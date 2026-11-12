'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { api } from '@/lib/ask';

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return d;
  }
};

export default function History() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'notes', 'quizzes', 'plans'
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      const query = new URLSearchParams({ type: filter });
      if (q.trim()) query.set('q', q.trim());

      api(`/api/history?${query.toString()}`)
        .then((r) => {
          if (live) {
            setItems(r.items);
            setErr('');
          }
        })
        .catch((e) => live && setErr(e.message));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [filter, q]);

  async function removeItem(item) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      if (item.itemType === 'note') {
        await api(`/api/notes/${item.id}`, { method: 'DELETE' });
      } else if (item.itemType === 'chat') {
        await api(`/api/conversations/${item.id}`, { method: 'DELETE' });
      } else if (item.itemType === 'quiz') {
        await api(`/api/quizzes/${item.id}`, { method: 'DELETE' });
      } else if (item.itemType === 'plan') {
        await api(`/api/planner/${item.id}`, { method: 'DELETE' });
      }
      setItems((l) => l.filter((x) => x.id !== item.id));
      setActiveMenuId(null);
    } catch (e) {
      setErr(e.message);
    }
  }

  const getItemLink = (item) => {
    if (item.itemType === 'note') return `/notes?id=${item.id}`;
    if (item.itemType === 'chat') return `/tutor?c=${item.id}`;
    if (item.itemType === 'quiz') return `/quizzes?id=${item.id}`;
    if (item.itemType === 'plan') return `/planner`;
    return '/notes';
  };

  return (
    <>
      {/* Top Banner matching Screen 4 in mockup */}
      <div className="card lib-banner">
        <div className="lib-banner-icon">
          <Icon n="notes" size={26} />
        </div>
        <div>
          <h1 className="lib-banner-title">Your Notes</h1>
          <p className="lib-banner-sub">Access and organize all your notes in one place.</p>
        </div>
      </div>

      {/* Category Pills matching Screen 4 in mockup */}
      <div className="lib-tools">
        <div className="lib-pills">
          <button
            className={'pill' + (filter === 'all' ? ' on' : '')}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={'pill' + (filter === 'notes' ? ' on' : '')}
            onClick={() => setFilter('notes')}
          >
            Notes
          </button>
          <button
            className={'pill' + (filter === 'quizzes' ? ' on' : '')}
            onClick={() => setFilter('quizzes')}
          >
            Quizzes
          </button>
          <button
            className={'pill' + (filter === 'plans' ? ' on' : '')}
            onClick={() => setFilter('plans')}
          >
            Plans
          </button>
        </div>

        <label className="search" style={{ margin: 0 }}>
          <Icon n="search" size={16} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes, quizzes & plans…"
            aria-label="Search"
          />
        </label>
      </div>

      {err && <p role="alert" style={{ color: 'var(--pdfc)', marginBottom: 12 }}>{err}</p>}

      {items === null ? (
        <div className="empty">Loading your library…</div>
      ) : items.length === 0 ? (
        <div className="empty">
          {q
            ? 'No matches found.'
            : filter === 'notes'
            ? 'No saved notes yet. Start writing or save an answer from AI Tutor!'
            : filter === 'quizzes'
            ? 'No practice quizzes yet. Create your first quiz!'
            : filter === 'plans'
            ? 'No study sessions scheduled yet.'
            : 'No items in your library yet.'}
        </div>
      ) : (
        <div className="lib-list">
          {items.map((item) => (
            <div key={item.id} className="card lib-card" style={{ position: 'relative' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                  href={getItemLink(item)}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <b className="lib-card-title">{item.title || 'Untitled Note'}</b>
                  <div className="lib-card-meta">
                    <Icon n="cal" size={13} />
                    <span>{fmtDate(item.createdAt || item.updatedAt)}</span>
                  </div>
                  <p className="lib-card-snippet">
                    {item.content || 'Tap to view details and open note…'}
                  </p>
                </Link>
              </div>

              {/* 3-dots Menu matching Screen 4 */}
              <div style={{ position: 'relative' }}>
                <button
                  className="iconbtn"
                  aria-label="Item options"
                  onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                  style={{ color: 'var(--muted)', padding: '6px' }}
                >
                  <Icon n="dots" size={18} />
                </button>

                {activeMenuId === item.id && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      zIndex: 30,
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: '4px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      minWidth: 120,
                    }}
                  >
                    <Link
                      href={getItemLink(item)}
                      style={{
                        display: 'block',
                        padding: '8px 12px',
                        fontSize: 13,
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        borderRadius: 6,
                      }}
                      onClick={() => setActiveMenuId(null)}
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => removeItem(item)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        fontSize: 13,
                        color: 'var(--pdfc)',
                        background: 'none',
                        border: 0,
                        cursor: 'pointer',
                        borderRadius: 6,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button (+) matching Screen 4 in mockup */}
      <Link href="/notes" className="fab" aria-label="Create new note" title="New Note">
        <Icon n="plus" size={24} />
      </Link>
    </>
  );
}
