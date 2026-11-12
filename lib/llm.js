// Server-only: calls the model provider. Keys never reach the browser.
// history: [{ role: 'user' | 'ai', content: string }] ending with the new user message.

const SYSTEM =
  'You are StudyMate AI, a patient study tutor. Explain clearly and simply, use short paragraphs and bullet points where helpful, and give a small example when it aids understanding. Be accurate; say so if you are unsure.';

async function askClaude(history) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 1500,
      system: SYSTEM,
      messages: history.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

async function askGemini(history) {
  // Try preferred model first, then fallback to active available Gemini models
  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
  ].filter(Boolean);

  // Remove duplicates
  const models = [...new Set(candidateModels)];

  let lastError = null;

  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: history.map((m) => ({
            role: m.role === 'ai' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API ${res.status} (${model}): ${errText.slice(0, 250)}`);
      }

      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      if (text) return text;
    } catch (err) {
      lastError = err;
      console.warn(`[askGemini] Attempt with ${model} failed, trying alternative:`, err.message);
    }
  }

  throw lastError || new Error('The Gemini model returned an empty reply');
}

// preferred: 'Claude' | 'Gemini' (from the UI picker). Falls back to whichever key is configured.
export async function generateReply(history, preferred) {
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  let provider = null;
  if (preferred === 'Claude' && hasClaude) provider = 'claude';
  else if (preferred === 'Gemini' && hasGemini) provider = 'gemini';
  else if (hasClaude) provider = 'claude';
  else if (hasGemini) provider = 'gemini';

  if (!provider) {
    const last = history[history.length - 1]?.content ?? '';
    return `Demo reply: no AI key is configured on the server yet. Add ANTHROPIC_API_KEY or GEMINI_API_KEY to your .env to get real answers about “${last.slice(0, 120)}”.`;
  }
  const text = provider === 'claude' ? await askClaude(history) : await askGemini(history);
  if (!text) throw new Error('The model returned an empty reply');
  return text;
}
