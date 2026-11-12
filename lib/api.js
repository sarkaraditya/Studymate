import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Returns the signed-in user's id, or null. Every API route scopes its queries by this id,
// so one user can never read or change another user's data.
export async function currentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export const unauthorized = () => NextResponse.json({ error: 'Not signed in' }, { status: 401 });
export const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404 });
export const bad = (msg) => NextResponse.json({ error: msg }, { status: 400 });

export async function readJson(req) {
  try { return await req.json(); } catch { return null; }
}
