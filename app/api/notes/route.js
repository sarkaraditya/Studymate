import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized, bad, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';
const MAX_TITLE = 200;
const MAX_CONTENT = 50000;

// GET /api/notes?q=search -> the user's notes, most recently edited first
export async function GET(req) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const q = new URL(req.url).searchParams.get('q')?.trim();
  const notes = await prisma.note.findMany({
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
    take: 500,
  });
  return NextResponse.json({ notes });
}

// POST { title?, content, conversationId? } -> create a note
export async function POST(req) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const body = await readJson(req);
  const content = typeof body?.content === 'string' ? body.content : '';
  const title = (typeof body?.title === 'string' ? body.title.trim() : '') || 'Untitled note';
  if (title.length > MAX_TITLE) return bad(`title is too long (max ${MAX_TITLE})`);
  if (content.length > MAX_CONTENT) return bad(`content is too long (max ${MAX_CONTENT})`);

  // Only link a conversation that belongs to this user.
  let conversationId = null;
  if (body?.conversationId) {
    const c = await prisma.conversation.findFirst({ where: { id: String(body.conversationId), userId }, select: { id: true } });
    conversationId = c?.id ?? null;
  }
  const note = await prisma.note.create({ data: { userId, title, content, conversationId } });
  return NextResponse.json({ note }, { status: 201 });
}
