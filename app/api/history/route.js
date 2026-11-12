import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/history?type=all|chats|notes&q=search
// Returns the signed-in user's history from the database, sorted newest first.
export async function GET(req) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const type = searchParams.get('type') || 'all';

  const shouldFetchChats = type === 'all' || type === 'chats';
  const shouldFetchNotes = type === 'all' || type === 'notes';

  const [chats, notes] = await Promise.all([
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
  ]);

  const items = [...chats, ...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return NextResponse.json({
    items,
    totalChats: chats.length,
    totalNotes: notes.length,
  });
}
