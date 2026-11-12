import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized, notFound } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/documents/[id] -> single document with extracted text content
export async function GET(_req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, userId },
  });

  if (!document) return notFound();
  return NextResponse.json({ document });
}

// DELETE /api/documents/[id] -> delete document
export async function DELETE(_req, { params }) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const { count } = await prisma.document.deleteMany({
    where: { id, userId },
  });

  if (!count) return notFound();
  return NextResponse.json({ ok: true });
}
