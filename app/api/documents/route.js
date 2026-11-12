import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized, bad } from '@/lib/api';
import { extractDocumentText } from '@/lib/documents';

export const dynamic = 'force-dynamic';

// GET /api/documents?q=search&type=All|Notes|Books|Slides
export async function GET(req) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const type = searchParams.get('type');

  const where = {
    userId,
    ...(type && type !== 'All' ? { type } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
  };

  const documents = await prisma.document.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      type: true,
      pages: true,
      fileSize: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ documents });
}

// POST /api/documents (FormData with 'file' and optional 'type')
export async function POST(req) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      console.warn('[documents] POST unauthorized - user is not signed in');
      return unauthorized();
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return bad('No file was received. Please select a valid document.');
    }

    const filename = file.name || 'document.pdf';
    const ext = filename.split('.').pop().toLowerCase();
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (buffer.length === 0) {
      return bad('The uploaded file is empty.');
    }

    const { text, pages } = await extractDocumentText(buffer, filename);

    let docType = formData.get('type');
    if (!docType || docType === 'All') {
      docType = /ppt|pptx/.test(ext) ? 'Slides' : ext === 'pdf' ? 'Books' : 'Notes';
    }

    const document = await prisma.document.create({
      data: {
        userId,
        name: filename,
        type: docType,
        pages: pages || '1 page',
        content: text || '',
        fileSize: buffer.length,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    console.error('[documents] Upload error:', err);
    return NextResponse.json({ error: `Upload error: ${err.message}` }, { status: 500 });
  }
}
