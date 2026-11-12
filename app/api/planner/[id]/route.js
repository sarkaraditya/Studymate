import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized, notFound, readJson } from '@/lib/api';

async function getOwned(uid, id) {
  return prisma.studySession.findFirst({ where: { id, userId: uid } });
}

// PATCH /api/planner/[id] — update subject, date, time, duration, note, or toggle done
export async function PATCH(req, { params }) {
  const uid = await currentUserId();
  if (!uid) return unauthorized();
  const { id } = await params;
  const existing = await getOwned(uid, id);
  if (!existing) return notFound();
  const body = await readJson(req);
  const data = {};
  if (body.subject !== undefined) data.subject = body.subject.trim();
  if (body.date !== undefined) data.date = body.date;
  if (body.startTime !== undefined) data.startTime = body.startTime;
  if (body.duration !== undefined) data.duration = Number(body.duration);
  if (body.note !== undefined) data.note = body.note.trim();
  if (body.done !== undefined) data.done = Boolean(body.done);
  const session = await prisma.studySession.update({ where: { id }, data });
  return NextResponse.json({ session });
}

// DELETE /api/planner/[id]
export async function DELETE(req, { params }) {
  const uid = await currentUserId();
  if (!uid) return unauthorized();
  const { id } = await params;
  const existing = await getOwned(uid, id);
  if (!existing) return notFound();
  await prisma.studySession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
