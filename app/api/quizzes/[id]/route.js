import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized, notFound, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/quizzes/[id] -> single quiz with questions
export async function GET(_req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const quiz = await prisma.quiz.findFirst({
    where: { id, userId },
  });

  if (!quiz) return notFound();

  let questions = [];
  try {
    questions = JSON.parse(quiz.questions);
  } catch {}

  return NextResponse.json({
    quiz: {
      ...quiz,
      questions,
    },
  });
}

// PATCH /api/quizzes/[id] -> update score
export async function PATCH(req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const body = await readJson(req);
  const score = typeof body?.score === 'number' ? Math.round(body.score) : null;

  const quiz = await prisma.quiz.findFirst({ where: { id, userId } });
  if (!quiz) return notFound();

  // Save the highest score or updated score
  const updated = await prisma.quiz.update({
    where: { id },
    data: {
      score: quiz.score !== null ? Math.max(quiz.score, score ?? 0) : score,
    },
  });

  return NextResponse.json({ ok: true, score: updated.score });
}

// DELETE /api/quizzes/[id] -> delete quiz
export async function DELETE(_req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const { count } = await prisma.quiz.deleteMany({
    where: { id, userId },
  });

  if (!count) return notFound();
  return NextResponse.json({ ok: true });
}
