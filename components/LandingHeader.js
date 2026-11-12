'use client';
import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import Logo from './Logo';

export default function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header className="top desktop-top">
        <Logo />
        <nav>
          <a className="on" href="#">Home</a>
          <a href="#features">Features</a>
          <a href="#how">How it Works</a>
          <a href="#about">About</a>
        </nav>
        <span className="sp" />
        <div className="top-actions">
          <Link className="btn" href="/login">Log in</Link>
          <Link className="btn pri" href="/login">Get Started</Link>
        </div>
      </header>

      {/* Mobile Top App Bar (exact match to Screen 2 & 3 in mockup) */}
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

          <Link
            href="/login"
            className="mobile-avatar-btn"
            aria-label="User Profile"
          >
            <span className="avatar-initial">A</span>
          </Link>

          <button
            className="mobile-menu-btn"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen(true)}
          >
            <Icon n="menu" size={20} />
          </button>
        </div>
      </header>

      {/* Notification popover */}
      {notifOpen && (
        <div className="notif-dropdown" onClick={() => setNotifOpen(false)}>
          <div className="notif-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <b style={{ fontSize: 14 }}>Notifications</b>
              <button className="iconbtn" onClick={() => setNotifOpen(false)}><Icon n="x" size={16} /></button>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              Welcome to StudyMate AI! All your notes and study history sync automatically.
            </p>
          </div>
        </div>
      )}

      {/* Mobile Drawer (exact match to Screen 6 in mockup) */}
      {menuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-user-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <span className="avatar-initial" style={{ width: 38, height: 38, fontSize: 16 }}>
                  A
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <b style={{ fontSize: 15, color: '#fff' }}>Aditya Sarkar</b>
                  <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                    adityasarkar1975@gmail.com
                  </small>
                </div>
              </div>
              <button
                className="iconbtn"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                style={{ color: 'var(--muted)', padding: 6 }}
              >
                <Icon n="x" size={20} />
              </button>
            </div>

            <nav className="mobile-drawer-links">
              <Link href="/dashboard" className="mobile-drawer-item on" onClick={() => setMenuOpen(false)}>
                <Icon n="home" size={18} />
                <span>Dashboard</span>
              </Link>
              <Link href="/tutor" className="mobile-drawer-item" onClick={() => setMenuOpen(false)}>
                <Icon n="chat" size={18} />
                <span>AI Tutor</span>
              </Link>
              <Link href="/documents" className="mobile-drawer-item" onClick={() => setMenuOpen(false)}>
                <Icon n="doc" size={18} />
                <span>My Documents</span>
              </Link>
              <Link href="/notes" className="mobile-drawer-item" onClick={() => setMenuOpen(false)}>
                <Icon n="notes" size={18} />
                <span>Notes</span>
              </Link>
              <Link href="/quizzes" className="mobile-drawer-item" onClick={() => setMenuOpen(false)}>
                <Icon n="quiz" size={18} />
                <span>Quizzes</span>
              </Link>
              <Link href="/history" className="mobile-drawer-item" onClick={() => setMenuOpen(false)}>
                <Icon n="clock" size={18} />
                <span>History</span>
              </Link>
              <Link href="/planner" className="mobile-drawer-item" onClick={() => setMenuOpen(false)}>
                <Icon n="cal" size={18} />
                <span>Study Planner</span>
              </Link>

              <div style={{ height: 1, background: 'var(--line)', margin: '8px 0' }} />

              <Link href="/settings" className="mobile-drawer-item" onClick={() => setMenuOpen(false)}>
                <Icon n="gear" size={18} />
                <span>Settings</span>
              </Link>
              <Link href="/login" className="mobile-drawer-item" onClick={() => setMenuOpen(false)}>
                <Icon n="logout" size={18} />
                <span>Sign in / Sign out</span>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
