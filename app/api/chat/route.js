import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateReply } from '@/lib/llm';
import { currentUserId, unauthorized, notFound, bad, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';
const MAX_LEN = 8000;
const CONTEXT_MESSAGES = 20;

// POST { message, conversationId?, model?, documentId? } -> { conversationId, userMessage, aiMessage }
// Creates the conversation on the first message, asks the model, then saves both messages.
export async function POST(req) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const body = await readJson(req);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) return bad('message is required');
  if (message.length > MAX_LEN) return bad(`message is too long (max ${MAX_LEN} characters)`);

  let conversationId = null;
  let prior = [];
  if (body.conversationId) {
    const convo = await prisma.conversation.findFirst({
      where: { id: String(body.conversationId), userId },
      select: { id: true },
    });
    if (!convo) return notFound();
    conversationId = convo.id;
    const recent = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: CONTEXT_MESSAGES,
      select: { role: true, content: true },
    });
    prior = recent.reverse();
  }

  // If a documentId is provided, pull the extracted text to provide document context
  let docContext = '';
  if (body.documentId) {
    const doc = await prisma.document.findFirst({
      where: { id: String(body.documentId), userId },
      select: { name: true, content: true },
    });
    if (doc?.content) {
      docContext = `[Uploaded Study Document: "${doc.name}"]\n${doc.content.slice(0, 32000)}\n[End of Document]\n\n`;
    }
  }

  const promptForModel = docContext
    ? `${docContext}Student's question about the above document: ${message}`
    : message;

  let reply;
  try {
    reply = await generateReply([...prior, { role: 'user', content: promptForModel }], body.model);
  } catch (err) {
    console.error('[chat] model error:', err);
    return NextResponse.json({ error: 'The AI service failed. Please try again.' }, { status: 502 });
  }

  // Save both messages together so history never holds a question without its answer.
  const result = await prisma.$transaction(async (tx) => {
    const convo = conversationId
      ? await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } })
      : await tx.conversation.create({ data: { userId, title: message.slice(0, 60) } });
    const userMessage = await tx.message.create({ data: { conversationId: convo.id, role: 'user', content: message } });
    // createdAt is millisecond precision; nudge so ordering is stable.
    const aiMessage = await tx.message.create({
      data: { conversationId: convo.id, role: 'ai', content: reply, createdAt: new Date(userMessage.createdAt.getTime() + 1) },
    });
    return { conversationId: convo.id, userMessage, aiMessage };
  });

  return NextResponse.json(result);
}
