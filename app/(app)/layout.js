import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Providers from '@/components/Providers';
import Shell from '@/components/Shell';

// Every page in the app area requires a signed-in user.
export default async function AppLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <Providers session={session}>
      <Shell>{children}</Shell>
    </Providers>
  );
}
