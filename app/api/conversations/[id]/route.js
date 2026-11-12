import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized, notFound } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET -> one conversation with all its messages
export async function GET(_req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation) return notFound();
  return NextResponse.json({ conversation });
}

// DELETE -> remove the conversation and its messages (saved notes are kept)
export async function DELETE(_req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const { count } = await prisma.conversation.deleteMany({ where: { id, userId } });
  if (!count) return notFound();
  return NextResponse.json({ ok: true });
}
