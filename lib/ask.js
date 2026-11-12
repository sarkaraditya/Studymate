// Small fetch wrapper for the backend. Throws Error(message) on any non-2xx response.
export async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (res.status === 401) { window.location.href = '/login'; throw new Error('Please sign in again.'); }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

// Sends one question; the server saves it and the answer to the user's history.
export const askTutor = (message, conversationId, model, documentId) =>
  api('/api/chat', { method: 'POST', body: { message, conversationId, model, documentId } });
