import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/history?type=all|notes|quizzes|plans|chats&q=search
// Returns the signed-in user's history from the database, sorted newest first.
export async function GET(req) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const type = searchParams.get('type') || 'all';

  const shouldFetchChats = type === 'all' || type === 'chats';
  const shouldFetchNotes = type === 'all' || type === 'notes';
  const shouldFetchQuizzes = type === 'all' || type === 'quizzes';
  const shouldFetchPlans = type === 'all' || type === 'plans';

  const [chats, notes, quizzes, plans] = await Promise.all([
    shouldFetchChats
      ? prisma.conversation.findMany({
          where: {
            userId,
            ...(q
              ? {
                  OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { messages: { some: { content: { contains: q, mode: 'insensitive' } } } },
                  ],
                }
              : {}),
          },
          orderBy: { updatedAt: 'desc' },
          take: 200,
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { messages: true } },
          },
        }).then((res) => res.map((c) => ({ ...c, itemType: 'chat' })))
      : Promise.resolve([]),

    shouldFetchNotes
      ? prisma.note.findMany({
          where: {
            userId,
            ...(q
              ? {
                  OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { content: { contains: q, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          orderBy: { updatedAt: 'desc' },
          take: 200,
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        }).then((res) => res.map((n) => ({ ...n, itemType: 'note' })))
      : Promise.resolve([]),

    shouldFetchQuizzes
      ? prisma.quiz.findMany({
          where: {
            userId,
            ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
          },
          orderBy: { updatedAt: 'desc' },
          take: 100,
          select: {
            id: true,
            title: true,
            total: true,
            score: true,
            createdAt: true,
            updatedAt: true,
          },
        }).then((res) =>
          res.map((qz) => ({
            ...qz,
            itemType: 'quiz',
            content: `${qz.total} Questions · Score: ${qz.score !== null ? `${qz.score}/${qz.total}` : 'Not taken'}`,
          }))
        )
      : Promise.resolve([]),

    shouldFetchPlans
      ? prisma.studySession.findMany({
          where: {
            userId,
            ...(q
              ? {
                  OR: [
                    { subject: { contains: q, mode: 'insensitive' } },
                    { note: { contains: q, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          orderBy: { updatedAt: 'desc' },
          take: 100,
          select: {
            id: true,
            subject: true,
            date: true,
            startTime: true,
            duration: true,
            note: true,
            done: true,
            createdAt: true,
            updatedAt: true,
          },
        }).then((res) =>
          res.map((p) => ({
            ...p,
            title: `${p.subject} Study Plan`,
            content: `${p.date} at ${p.startTime} (${p.duration} mins) · ${p.note || 'Scheduled session'}`,
            itemType: 'plan',
          }))
        )
      : Promise.resolve([]),
  ]);

  const items = [...chats, ...notes, ...quizzes, ...plans].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  return NextResponse.json({
    items,
    totalChats: chats.length,
    totalNotes: notes.length,
    totalQuizzes: quizzes.length,
    totalPlans: plans.length,
  });
}
