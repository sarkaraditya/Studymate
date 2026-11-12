import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/quizzes -> list user's quizzes
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const quizzes = await prisma.quiz.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      documentId: true,
      score: true,
      total: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ quizzes });
}
