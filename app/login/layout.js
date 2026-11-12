import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';

export const metadata = { title: 'Sign In · StudyMate AI' };

export default async function LoginLayout({ children }) {
  const session = await auth();
  if (session?.user) redirect('/dashboard');
  return <SessionProvider>{children}</SessionProvider>;
}
