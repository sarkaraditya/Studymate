import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/questions?take=100
// Returns user messages (questions asked) across all conversations, newest first.
export async function GET(req) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const take = Math.min(parseInt(new URL(req.url).searchParams.get('take') || '100', 10), 200);

  const messages = await prisma.message.findMany({
    where: { role: 'user', conversation: { userId } },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      content: true,
      createdAt: true,
      conversation: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ messages });
}
