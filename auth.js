import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '';
const googleSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

// Database sessions persist across server restarts so users stay logged in.
// Credentials provider still uses JWT internally (NextAuth requirement), but the
// session record is stored in SQLite — so quitting and restarting the dev server
// does NOT log anyone out.
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'studymate-production-fallback-auth-secret-32-chars-long',
  adapter: PrismaAdapter(prisma),
  // Use JWT strategy (required for Credentials provider) but we also store
  // sessions in the DB via the adapter for durability.
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  providers: [
    ...(googleId && googleSecret
      ? [
          Google({
            clientId: googleId,
            clientSecret: googleSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    // Email + password sign-in. Sign-up is handled by /api/auth/register.
    Credentials({
      id: 'email-password',
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email    = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      // Persist the user id in the JWT so we can retrieve it in session()
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      // Expose user.id on every session object
      if (session.user) {
        session.user.id = token.id ?? token.sub;
      }
      return session;
    },
  },
});
