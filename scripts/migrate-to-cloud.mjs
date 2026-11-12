#!/usr/bin/env node
/**
 * migrate-to-cloud.mjs
 * 
 * Safely copies all existing local SQLite data (users, conversations, messages,
 * notes, documents, quizzes, study sessions) from prisma/dev.db to your Cloud
 * PostgreSQL database (Neon, Supabase, Railway, etc.).
 * 
 * Run with:
 *   npm run db:migrate-to-cloud
 */

import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const sqlitePath = resolve(process.cwd(), 'prisma/dev.db');

if (!existsSync(sqlitePath)) {
  console.log('ℹ No local SQLite database found at prisma/dev.db. Nothing to migrate.');
  process.exit(0);
}

const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  console.error('\n❌ DATABASE_URL is not set to a PostgreSQL cloud database.');
  console.error('Please configure your cloud DATABASE_URL in .env before migrating.\n');
  process.exit(1);
}

console.log('🚀 Connecting to local SQLite database and Cloud PostgreSQL...');
const sqlite = new DatabaseSync(sqlitePath);
const prisma = new PrismaClient();

function getRows(table) {
  try {
    return sqlite.prepare(`SELECT * FROM "${table}"`).all() || [];
  } catch (err) {
    // Table might not exist in SQLite
    return [];
  }
}

function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'number') return new Date(val);
  return new Date(val);
}

async function migrate() {
  try {
    await prisma.$connect();
    console.log('✓ Successfully connected to Cloud PostgreSQL database!\n');

    // 1. Users
    const users = getRows('User');
    console.log(`Migrating ${users.length} user(s)...`);
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: parseDate(u.emailVerified),
          image: u.image,
          password: u.password,
          createdAt: parseDate(u.createdAt) || new Date(),
        },
      });
    }
    console.log(`✓ Users migrated: ${users.length}`);

    // 2. Accounts
    const accounts = getRows('Account');
    for (const a of accounts) {
      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: a.provider,
            providerAccountId: a.providerAccountId,
          },
        },
        update: {},
        create: {
          id: a.id,
          userId: a.userId,
          type: a.type,
          provider: a.provider,
          providerAccountId: a.providerAccountId,
          refresh_token: a.refresh_token,
          access_token: a.access_token,
          expires_at: a.expires_at ? Number(a.expires_at) : null,
          token_type: a.token_type,
          scope: a.scope,
          id_token: a.id_token,
          session_state: a.session_state,
        },
      });
    }
    if (accounts.length) console.log(`✓ Accounts migrated: ${accounts.length}`);

    // 3. Documents
    const documents = getRows('Document');
    for (const d of documents) {
      await prisma.document.upsert({
        where: { id: d.id },
        update: {},
        create: {
          id: d.id,
          userId: d.userId,
          name: d.name,
          type: d.type,
          pages: d.pages,
          content: d.content,
          fileSize: d.fileSize ? Number(d.fileSize) : null,
          createdAt: parseDate(d.createdAt) || new Date(),
          updatedAt: parseDate(d.updatedAt) || new Date(),
        },
      });
    }
    if (documents.length) console.log(`✓ Documents migrated: ${documents.length}`);

    // 4. Conversations
    const conversations = getRows('Conversation');
    console.log(`Migrating ${conversations.length} conversation(s)...`);
    for (const c of conversations) {
      await prisma.conversation.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          userId: c.userId,
          title: c.title,
          createdAt: parseDate(c.createdAt) || new Date(),
          updatedAt: parseDate(c.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✓ Conversations migrated: ${conversations.length}`);

    // 5. Messages
    const messages = getRows('Message');
    console.log(`Migrating ${messages.length} message(s)...`);
    for (const m of messages) {
      await prisma.message.upsert({
        where: { id: m.id },
        update: {},
        create: {
          id: m.id,
          conversationId: m.conversationId,
          role: m.role,
          content: m.content,
          vote: m.vote,
          createdAt: parseDate(m.createdAt) || new Date(),
        },
      });
    }
    console.log(`✓ Messages migrated: ${messages.length}`);

    // 6. Notes
    const notes = getRows('Note');
    for (const n of notes) {
      await prisma.note.upsert({
        where: { id: n.id },
        update: {},
        create: {
          id: n.id,
          userId: n.userId,
          title: n.title,
          content: n.content,
          conversationId: n.conversationId || null,
          createdAt: parseDate(n.createdAt) || new Date(),
          updatedAt: parseDate(n.updatedAt) || new Date(),
        },
      });
    }
    if (notes.length) console.log(`✓ Notes migrated: ${notes.length}`);

    // 7. Quizzes
    const quizzes = getRows('Quiz');
    for (const q of quizzes) {
      await prisma.quiz.upsert({
        where: { id: q.id },
        update: {},
        create: {
          id: q.id,
          userId: q.userId,
          title: q.title,
          documentId: q.documentId || null,
          questions: q.questions,
          score: q.score ? Number(q.score) : null,
          total: Number(q.total),
          createdAt: parseDate(q.createdAt) || new Date(),
          updatedAt: parseDate(q.updatedAt) || new Date(),
        },
      });
    }
    if (quizzes.length) console.log(`✓ Quizzes migrated: ${quizzes.length}`);

    // 8. StudySessions
    const sessions = getRows('StudySession');
    for (const s of sessions) {
      await prisma.studySession.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          userId: s.userId,
          subject: s.subject,
          date: s.date,
          startTime: s.startTime,
          duration: Number(s.duration),
          note: s.note || '',
          done: Boolean(s.done),
          createdAt: parseDate(s.createdAt) || new Date(),
          updatedAt: parseDate(s.updatedAt) || new Date(),
        },
      });
    }
    if (sessions.length) console.log(`✓ Study sessions migrated: ${sessions.length}`);

    console.log('\n🎉 Cloud database migration completed successfully!');
    console.log('You can now log in from anywhere in the world and continue any conversation.');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
