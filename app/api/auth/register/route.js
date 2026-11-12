import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/auth/register — creates a new user with email + password.
// Returns { ok: true } on success, or { error: "message" } on failure.
export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name?.trim() || email.split('@')[0],
        password: hashed,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.', details: err?.message || String(err) }, { status: 500 });
  }
}
