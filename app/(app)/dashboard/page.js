'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Icon from '@/components/Icon';
import { api } from '@/lib/ask';

const DEFAULT_GOALS = ['Revise CPU Scheduling', 'Solve 10 MCQs', 'Make short notes'];
const fmt = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/* ── Slide-up modal ── */
function Modal({ title, onClose, children }) {
  const ref = useRef();

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === ref.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={ref}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
        zIndex: 200, display: 'grid', placeItems: 'end center', padding: '0 0 0 0',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 560, maxHeight: '80vh',
          background: 'var(--surface)', borderRadius: '18px 18px 0 0',
          border: '1px solid var(--line)', borderBottom: 'none',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp .22s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><Icon n="x" /></button>
        </div>
        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Chats list inside modal ── */
function ChatsModal({ onClose }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/history?type=chats')
      .then(r => setItems(r.items))
      .catch(e => setErr(e.message));
  }, []);

  return (
    <Modal title="Your Chats" onClose={onClose}>
      {err && <p style={{ color: 'var(--pdfc)', marginTop: 12 }}>{err}</p>}
      {items === null && !err && <div className="empty">Loading…</div>}
      {items?.length === 0 && (
        <div className="empty">No chats yet. Ask the AI Tutor anything!</div>
      )}
      {items?.map(item => (
        <div key={item.id} className="hrow" style={{ gap: 12 }}>
          <span className="av" style={{ background: 'var(--tint)', color: 'var(--brand)', flexShrink: 0 }}>
            <Icon n="chat" />
          </span>
          <Link className="t" href={`/tutor?c=${item.id}`} onClick={onClose} style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'var(--ink)' }}>
            <b style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</b>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
              {item._count?.messages || 0} messages · {fmt(item.updatedAt)}
            </span>
          </Link>
          <Link className="btn out" href={`/tutor?c=${item.id}`} onClick={onClose} style={{ flexShrink: 0, fontSize: 13, padding: '6px 12px' }}>
            Open
          </Link>
        </div>
      ))}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Link href="/history?filter=chats" className="btn" onClick={onClose} style={{ fontSize: 13 }}>
          View full history →
        </Link>
      </div>
    </Modal>
  );
}

/* ── Questions list inside modal ── */
function QuestionsModal({ onClose }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/questions')
      .then(r => setItems(r.messages))
      .catch(e => setErr(e.message));
  }, []);

  return (
    <Modal title="Questions You've Asked" onClose={onClose}>
      {err && <p style={{ color: 'var(--pdfc)', marginTop: 12 }}>{err}</p>}
      {items === null && !err && <div className="empty">Loading…</div>}
      {items?.length === 0 && (
        <div className="empty">No questions yet. Start chatting with the AI Tutor!</div>
      )}
      {items?.map(item => (
        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
          <span className="av" style={{ background: 'var(--tint2)', color: 'var(--brand)', flexShrink: 0, marginTop: 2 }}>
            <Icon n="spark" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link
              href={`/tutor?c=${item.conversation.id}`}
              onClick={onClose}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <p style={{ margin: '0 0 4px', fontSize: 14, lineHeight: 1.5, color: 'var(--ink)', wordBreak: 'break-word' }}>
                {item.content.length > 160 ? item.content.slice(0, 160) + '…' : item.content}
              </p>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                in <b style={{ color: 'var(--brand)' }}>{item.conversation.title}</b> · {fmt(item.createdAt)}
              </span>
            </Link>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Link href="/history" className="btn" onClick={onClose} style={{ fontSize: 13 }}>
          View full history →
        </Link>
      </div>
    </Modal>
  );
}

/* ── Dashboard page ── */
export default function Dashboard() {
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [done, setDone] = useState([]);
  const [editing, setEditing] = useState(false);
  const [draftGoals, setDraftGoals] = useState([]);
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [modal, setModal] = useState(null); // 'chats' | 'questions' | null
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load persisted goals from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('dashboard_goals'));
      if (Array.isArray(saved) && saved.length > 0) setGoals(saved);
    } catch {}
  }, []);

  // Keep done array in sync with goals length
  useEffect(() => {
    setDone(prev => {
      if (prev.length === goals.length) return prev;
      return Array(goals.length).fill(false);
    });
  }, [goals]);

  useEffect(() => {
    api('/api/stats')
      .then(setStats)
      .catch(() => setStats({ chats: 0, questions: 0, notes: 0, recent: null, recentNote: null }));
  }, []);

  function openEdit() {
    setDraftGoals([...goals]);
    setEditing(true);
  }

  function saveEdit() {
    const filtered = draftGoals.map(g => g.trim()).filter(Boolean);
    const next = filtered.length > 0 ? filtered : DEFAULT_GOALS;
    setGoals(next);
    setDone(Array(next.length).fill(false));
    localStorage.setItem('dashboard_goals', JSON.stringify(next));
    setEditing(false);
  }

  function cancelEdit() { setEditing(false); }
  function updateDraft(i, val) { setDraftGoals(prev => prev.map((g, j) => (j === i ? val : g))); }
  function removeDraft(i) { setDraftGoals(prev => prev.filter((_, j) => j !== i)); }
  function addDraft() { setDraftGoals(prev => [...prev, '']); }

  const user = session?.user;
  const name = user?.name?.split(' ')[0] || 'there';
  const STATS = [
    { icon: 'chat',   value: stats?.chats     ?? '–', label: 'Chats',          modal: 'chats' },
    { icon: 'layers', value: stats?.questions  ?? '–', label: 'Questions Asked', modal: 'questions' },
    { icon: 'notes',  value: stats?.notes      ?? '–', label: 'Notes Saved',     href: '/notes' },
  ];

  return (
    <>
      {/* Slide-up animation keyframe */}
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

      {modal === 'chats'     && <ChatsModal     onClose={() => setModal(null)} />}
      {modal === 'questions' && <QuestionsModal onClose={() => setModal(null)} />}

      <div className="mhead">
        <div>
          <h1>Welcome back, {name} 👋</h1>
          <p>Your notes and chat history are synced with your account.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="iconbtn" aria-label="Notifications"><Icon n="bell" /></button>
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              className="iconbtn"
              aria-label="Profile menu"
              onClick={() => setProfileOpen((o) => !o)}
              style={{ padding: 0, borderRadius: '50%' }}
            >
              {user?.image ? (
                <img src={user.image} alt={user?.name || 'Account'} className="avatar" style={{ objectFit: 'cover', display: 'block' }} />
              ) : (
                <span className="avatar" aria-hidden="true">{name[0].toUpperCase()}</span>
              )}
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-info">
                  <div style={{ minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: 14 }}>{user?.name || 'Student'}</b>
                    <small style={{ color: 'var(--muted)', fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</small>
                  </div>
                </div>
                <div className="profile-dropdown-divider" />
                <button className="profile-dropdown-btn" onClick={() => signOut({ callbackUrl: '/' })}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stats">
        {STATS.map(({ icon, value, label, modal: m, href }) => {
          const isClickable = !!(m || href);
          const inner = (
            <>
              <Icon n={icon} />
              <b>{value}</b>
              <span>{label}</span>
              {isClickable && (
                <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600, marginTop: 2 }}>
                  View all →
                </span>
              )}
            </>
          );
          if (href) {
            return (
              <Link key={label} href={href} className="card stat" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                {inner}
              </Link>
            );
          }
          return (
            <button
              key={label}
              className="card stat"
              onClick={() => m && setModal(m)}
              style={{ cursor: isClickable ? 'pointer' : 'default', background: 'none', border: '1px solid var(--line)', textAlign: 'left', width: '100%', display: 'block', borderRadius: 14 }}
              aria-label={`View ${label}`}
            >
              {inner}
            </button>
          );
        })}
      </div>

      <div className="two" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="card cont">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Continue Learning</h2>
            <Link href="/history" style={{ fontSize: 13, color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
              All History →
            </Link>
          </div>
          <Link className="in" href={stats?.recent ? `/tutor?c=${stats.recent.id}` : '/tutor'}>
            <span className="play"><Icon n="play" /></span>
            <span>
              <b>{stats?.recent ? stats.recent.title : 'Start a new chat'}</b>
              <br />
              <small style={{ color: 'var(--muted)' }}>
                {stats?.recent ? 'Pick up your last conversation' : 'Ask the AI Tutor anything'}
              </small>
            </span>
            <span className="go"><Icon n="arrow" size={18} /></span>
          </Link>
        </div>

        <div className="card cont">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Recent Note</h2>
            <Link href="/notes" style={{ fontSize: 13, color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
              All Notes →
            </Link>
          </div>
          <Link className="in" href={stats?.recentNote ? `/notes?id=${stats.recentNote.id}` : '/notes'}>
            <span className="play" style={{ background: 'var(--tint2)' }}><Icon n="notes" /></span>
            <span>
              <b>{stats?.recentNote ? stats.recentNote.title : 'Create your first note'}</b>
              <br />
              <small style={{ color: 'var(--muted)' }}>
                {stats?.recentNote ? 'Open and edit in Notes' : 'Jot down insights or save AI answers'}
              </small>
            </span>
            <span className="go"><Icon n="arrow" size={18} /></span>
          </Link>
        </div>

        <div className="card goals">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Today's Goals</h2>
            {!editing && (
              <button className="iconbtn" aria-label="Edit goals" onClick={openEdit} title="Edit goals">
                <Icon n="edit" />
              </button>
            )}
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {draftGoals.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <input
                    value={g}
                    placeholder={`Goal ${i + 1}`}
                    onChange={e => updateDraft(i, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addDraft(); }}
                    style={{
                      flex: 1, fontSize: 14, border: 'none', background: 'transparent',
                      outline: 'none', color: 'inherit', padding: 0,
                    }}
                  />
                  <button
                    className="iconbtn"
                    aria-label="Remove goal"
                    onClick={() => removeDraft(i)}
                    style={{ color: 'var(--pdfc)', flexShrink: 0 }}
                  >
                    <Icon n="trash" />
                  </button>
                </div>
              ))}
              <button
                onClick={addDraft}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: '1px dashed var(--line)',
                  borderRadius: 10, padding: '7px 12px', fontSize: 13,
                  color: 'var(--muted)', cursor: 'pointer', marginTop: 2,
                }}
              >
                <Icon n="plus" /> Add goal
              </button>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn pri" style={{ flex: 1, justifyContent: 'center' }} onClick={saveEdit}>Save</button>
                <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={cancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            goals.map((g, i) => (
              <label key={i}>
                <input type="checkbox" checked={!!done[i]} onChange={() => setDone(done.map((d, j) => (j === i ? !d : d)))} />
                <span>{g}</span>
              </label>
            ))
          )}
        </div>
      </div>
    </>
  );
}
