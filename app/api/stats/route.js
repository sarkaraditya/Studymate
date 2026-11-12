import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET -> counts and recent activity for the dashboard
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const [chats, questions, notes, recent, recentNote] = await Promise.all([
    prisma.conversation.count({ where: { userId } }),
    prisma.message.count({ where: { role: 'user', conversation: { userId } } }),
    prisma.note.count({ where: { userId } }),
    prisma.conversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true },
    }),
    prisma.note.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
    }),
  ]);
  return NextResponse.json({ chats, questions, notes, recent, recentNote });
}
