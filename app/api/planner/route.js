import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized, bad, readJson } from '@/lib/api';

// GET /api/planner?date=YYYY-MM-DD  — fetch sessions for a given date (or all if no date)
export async function GET(req) {
  const uid = await currentUserId();
  if (!uid) return unauthorized();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const sessions = await prisma.studySession.findMany({
    where: { userId: uid, ...(date ? { date } : {}) },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  return NextResponse.json({ sessions });
}

// POST /api/planner — create a new session
export async function POST(req) {
  const uid = await currentUserId();
  if (!uid) return unauthorized();
  const body = await readJson(req);
  const { subject, date, startTime, duration, note } = body || {};
  if (!subject?.trim()) return bad('Subject is required');
  if (!date) return bad('Date is required');
  if (!startTime) return bad('Start time is required');
  if (!duration || duration < 5) return bad('Duration must be at least 5 minutes');
  const session = await prisma.studySession.create({
    data: {
      userId: uid,
      subject: subject.trim(),
      date,
      startTime,
      duration: Number(duration),
      note: note?.trim() || '',
    },
  });
  return NextResponse.json({ session }, { status: 201 });
}
