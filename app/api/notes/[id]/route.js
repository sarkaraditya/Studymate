import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized, notFound, bad, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';
const MAX_TITLE = 200;
const MAX_CONTENT = 50000;

// GET /api/notes/[id] -> get a single note
export async function GET(_req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const note = await prisma.note.findFirst({
    where: { id, userId },
    include: { conversation: { select: { id: true, title: true } } },
  });
  if (!note) return notFound();
  return NextResponse.json({ note });
}

// PATCH { title?, content? } -> edit a note
export async function PATCH(req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const body = await readJson(req);
  if (!body) return bad('invalid JSON');

  const data = {};
  if (typeof body.title === 'string') {
    data.title = body.title.trim() || 'Untitled note';
    if (data.title.length > MAX_TITLE) return bad(`title is too long (max ${MAX_TITLE})`);
  }
  if (typeof body.content === 'string') {
    if (body.content.length > MAX_CONTENT) return bad(`content is too long (max ${MAX_CONTENT})`);
    data.content = body.content;
  }
  if (!Object.keys(data).length) return bad('nothing to update');

  const { count } = await prisma.note.updateMany({ where: { id, userId }, data });
  if (!count) return notFound();
  const note = await prisma.note.findFirst({ where: { id, userId } });
  return NextResponse.json({ note });
}

export async function DELETE(_req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const { count } = await prisma.note.deleteMany({ where: { id, userId } });
  if (!count) return notFound();
  return NextResponse.json({ ok: true });
}
