import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized, notFound, bad, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

// PATCH { vote: 'up' | 'down' | null } -> store thumbs up/down feedback on an AI answer
export async function PATCH(req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const body = await readJson(req);
  const vote = body?.vote ?? null;
  if (vote !== null && vote !== 'up' && vote !== 'down') return bad("vote must be 'up', 'down' or null");

  const { count } = await prisma.message.updateMany({
    where: { id, role: 'ai', conversation: { userId } },
    data: { vote },
  });
  if (!count) return notFound();
  return NextResponse.json({ ok: true, vote });
}
