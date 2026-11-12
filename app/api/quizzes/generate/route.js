import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { currentUserId, unauthorized, bad } from '@/lib/api';
import { generateReply } from '@/lib/llm';
import { extractDocumentText } from '@/lib/documents';

export const dynamic = 'force-dynamic';

function cleanAndParseJson(text) {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
  }
  // Try direct parse
  try {
    return JSON.parse(clean);
  } catch {}

  // Try extracting array via regex
  const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  throw new Error('Could not parse valid quiz questions from the AI response.');
}

export async function POST(req) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  try {
    let title = 'Study Notes Quiz';
    let notesContent = '';
    let documentId = null;
    let numQuestions = 5;
    let difficulty = 'Medium';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      numQuestions = parseInt(formData.get('numQuestions') || '5', 10) || 5;
      difficulty = formData.get('difficulty') || 'Medium';

      if (file && typeof file !== 'string') {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name || 'uploaded_notes.pdf';
        const extracted = await extractDocumentText(buffer, filename);
        notesContent = extracted.text;
        title = `Quiz: ${filename}`;

        // Also save as a document for future reference
        try {
          const doc = await prisma.document.create({
            data: {
              userId,
              name: filename,
              type: 'Notes',
              pages: extracted.pages,
              content: extracted.text,
              fileSize: buffer.length,
            },
          });
          documentId = doc.id;
        } catch {}
      }
    } else {
      const body = await req.json().catch(() => ({}));
      numQuestions = parseInt(body?.numQuestions || 5, 10) || 5;
      difficulty = body?.difficulty || 'Medium';

      if (body?.documentId) {
        documentId = String(body.documentId);
        const doc = await prisma.document.findFirst({
          where: { id: documentId, userId },
        });
        if (doc) {
          notesContent = doc.content;
          title = `Quiz: ${doc.name}`;
        }
      } else if (body?.noteId) {
        const note = await prisma.note.findFirst({
          where: { id: String(body.noteId), userId },
        });
        if (note) {
          notesContent = `${note.title}\n\n${note.content}`;
          title = `Quiz: ${note.title}`;
        }
      } else if (body?.text) {
        notesContent = String(body.text).trim();
        title = body.title ? String(body.title).trim() : 'Custom Notes Quiz';
      }
    }

    if (!notesContent || notesContent.trim().length < 20) {
      return bad('Please provide notes or select a document with sufficient study content.');
    }

    const prompt = `
Analyze the following study notes and generate an academic practice quiz with exactly ${numQuestions} multiple-choice questions (difficulty level: ${difficulty}).

Study Material:
"""
${notesContent.slice(0, 32000)}
"""

Instructions:
1. Every question must test a real concept, definition, mechanism, or principle from the study material above.
2. Provide exactly 4 distinct answer options for each question.
3. Specify the 0-indexed correct option (correctIndex: 0, 1, 2, or 3).
4. Provide a clear, educational explanation citing the concept from the notes.
5. Return ONLY a valid JSON array of question objects (no markdown code blocks, no preamble, just raw JSON).

Schema:
[
  {
    "question": "Clear and specific question based on the notes?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Explanation based on the material."
  }
]
`;

    const aiResponse = await generateReply([{ role: 'user', content: prompt }], 'Gemini');
    const rawQuestions = cleanAndParseJson(aiResponse);

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      throw new Error('AI returned an empty question list.');
    }

    // Validate and clean each question object
    const validatedQuestions = rawQuestions.map((q, idx) => ({
      id: idx + 1,
      question: String(q.question || `Question ${idx + 1}`),
      options: Array.isArray(q.options) && q.options.length >= 2
        ? q.options.slice(0, 4).map(String)
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4
        ? q.correctIndex
        : 0,
      explanation: String(q.explanation || 'Refer to your study notes for details.'),
    }));

    const quiz = await prisma.quiz.create({
      data: {
        userId,
        title: title.slice(0, 120),
        documentId,
        questions: JSON.stringify(validatedQuestions),
        total: validatedQuestions.length,
        score: null,
      },
    });

    return NextResponse.json(
      {
        quiz: {
          ...quiz,
          questions: validatedQuestions,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[quizzes/generate] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
}
