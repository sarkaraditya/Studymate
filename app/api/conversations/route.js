import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/conversations?q=search -> the signed-in user's chat history, newest first
export async function GET(req) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const q = new URL(req.url).searchParams.get('q')?.trim();

  const conversations = await prisma.conversation.findMany({
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
    select: { id: true, title: true, createdAt: true, updatedAt: true, _count: { select: { messages: true } } },
  });
  return NextResponse.json({ conversations });
}
