'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Icon from './Icon';
import Logo from './Logo';

const NAV = [
  ['/dashboard', 'Dashboard', 'home'],
  ['/tutor', 'AI Tutor', 'chat'],
  ['/documents', 'My Documents', 'doc'],
  ['/notes', 'Notes', 'notes'],
  ['/quizzes', 'Quizzes', 'quiz'],
  ['/history', 'History', 'clock'],
  ['/planner', 'Study Planner', 'cal'],
];

export default function Shell({ children }) {
  const path = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifOpen(false);
  }, [path]);

  const on = (h) => (path === h ? 'on' : '');
  const initial = (user?.name || user?.email || 'A')[0].toUpperCase();

  return (
    <div className="shell">
      {/* Mobile Top App Bar (matching top header in picture) */}
      <header className="mobile-bar">
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="mobile-iconbtn"
            aria-label="Notifications"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Icon n="bell" size={19} />
          </button>

          <button
            className="mobile-avatar-btn"
            aria-label="User Profile"
            onClick={() => setMobileMenuOpen(true)}
          >
            {user?.image ? (
              <img src={user.image} alt={user.name || 'User'} className="avatar-img" />
            ) : (
              <span className="avatar-initial">{initial}</span>
            )}
          </button>

          <button
            className="mobile-menu-btn"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Icon n="menu" size={20} />
          </button>
        </div>
      </header>

      {/* Notifications Popover */}
      {notifOpen && (
        <div className="notif-dropdown" onClick={() => setNotifOpen(false)}>
          <div className="notif-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <b style={{ fontSize: 14 }}>Notifications</b>
              <button className="iconbtn" onClick={() => setNotifOpen(false)}><Icon n="x" size={16} /></button>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              All study notes and chat history are synced with your cloud database!
            </p>
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer (exact match to Screen 6 in picture) */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Header with User Info */}
            <div className="mobile-drawer-user-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <span className="avatar-initial" style={{ width: 38, height: 38, fontSize: 16 }}>
                  {initial}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <b style={{ fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || 'Aditya Sarkar'}
                  </b>
                  <small style={{ color: 'var(--muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email || 'adityasarkar1975@gmail.com'}
                  </small>
                </div>
              </div>
              <button
                className="iconbtn"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: 'var(--muted)', padding: 6 }}
              >
                <Icon n="x" size={20} />
              </button>
            </div>

            {/* Navigation links matching Screen 6 */}
            <nav className="mobile-drawer-links">
              {NAV.map(([h, label, ic]) => (
                <Link
                  key={h}
                  href={h}
                  className={'mobile-drawer-item ' + on(h)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon n={ic} size={18} />
                  <span>{label}</span>
                </Link>
              ))}

              <div style={{ height: 1, background: 'var(--line)', margin: '8px 0' }} />

              <Link
                href="/settings"
                className={'mobile-drawer-item ' + on('/settings')}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon n="gear" size={18} />
                <span>Settings</span>
              </Link>

              <button
                className="mobile-drawer-item"
                style={{ width: '100%', background: 'none', border: 0, textAlign: 'left', color: 'var(--muted)', cursor: 'pointer' }}
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <Icon n="logout" size={18} />
                <span>Sign out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (hidden on phone) */}
      <aside className="side">
        <Logo />
        {NAV.map(([h, label, ic]) => (
          <Link key={h} href={h} className={on(h)} aria-current={path === h ? 'page' : undefined}>
            <Icon n={ic} />
            {label}
          </Link>
        ))}
        <span className="sp" />
        <Link href="/settings" className={'set ' + on('/settings')}>
          <Icon n="gear" />
          <span>Settings</span>
        </Link>
        {user && (
          <div className="me">
            {user.image ? (
              <img src={user.image} alt={user.name || 'User'} className="avatar" style={{ objectFit: 'cover' }} />
            ) : (
              <span className="avatar" aria-hidden="true">{initial}</span>
            )}
            <span className="who">
              <b>{user.name || 'Student'}</b>
              <small>{user.email}</small>
            </span>
            <button className="btn" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="main">{children}</main>

      {/* Mobile 4-Item Bottom Navigation Bar (exact match to screens in picture) */}
      <nav className="mobile-bottom-nav">
        <Link
          href="/dashboard"
          className={'mobile-nav-item ' + (path === '/dashboard' ? 'on' : '')}
        >
          <Icon n="home" size={20} />
          <span>Home</span>
        </Link>

        <Link
          href="/tutor"
          className={'mobile-nav-item ' + (path === '/tutor' ? 'on' : '')}
        >
          <Icon n="grid" size={20} />
          <span>Features</span>
        </Link>

        <Link
          href="/history"
          className={'mobile-nav-item ' + (path === '/history' || path === '/notes' || path === '/documents' ? 'on' : '')}
        >
          <Icon n="book" size={20} />
          <span>Library</span>
        </Link>

        <button
          className={'mobile-nav-item ' + (mobileMenuOpen || path === '/settings' ? 'on' : '')}
          onClick={() => setMobileMenuOpen(true)}
          style={{ background: 'none', border: 0, cursor: 'pointer' }}
        >
          <Icon n="user" size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
