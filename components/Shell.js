'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Icon from './Icon';
import Logo from './Logo';

const NAV = [
  ['/dashboard', 'Dashboard', 'home'], ['/tutor', 'AI Tutor', 'chat'], ['/documents', 'My Documents', 'doc'],
  ['/notes', 'Notes', 'notes'], ['/quizzes', 'Quizzes', 'quiz'], ['/history', 'History', 'clock'], ['/planner', 'Study Planner', 'cal'],
];

export default function Shell({ children }) {
  const path = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const on = (h) => (path === h ? 'on' : '');
  return (
    <div className="shell">
      <aside className="side">
        <Logo />
        {NAV.map(([h, label, ic]) => (
          <Link key={h} href={h} className={on(h)} aria-current={path === h ? 'page' : undefined}><Icon n={ic} />{label}</Link>
        ))}
        <span className="sp" />
        <Link href="/settings" className={'set ' + on('/settings')}><Icon n="gear" /><span>Settings</span></Link>
        {user && (
          <div className="me">
            {user.image ? (
              <img src={user.image} alt={user.name || 'User'} className="avatar" style={{ objectFit: 'cover' }} />
            ) : (
              <span className="avatar" aria-hidden="true">{(user.name || user.email || '?')[0].toUpperCase()}</span>
            )}
            <span className="who"><b>{user.name || 'Student'}</b><small>{user.email}</small></span>
            <button className="btn" onClick={() => signOut({ callbackUrl: '/' })}>Sign out</button>
          </div>
        )}
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
