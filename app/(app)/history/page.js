'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { api } from '@/lib/ask';

const fmt = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function History() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'notes', 'chats'
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

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

  async function removeChat(id, title) {
    if (!confirm(`Delete chat "${title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/conversations/${id}`, { method: 'DELETE' });
      setItems((l) => l.filter((x) => x.id !== id));
    } catch (e) {
      setErr(e.message);
    }
  }

  async function removeNote(id, title) {
    if (!confirm(`Delete note "${title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/notes/${id}`, { method: 'DELETE' });
      setItems((l) => l.filter((x) => x.id !== id));
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <>
      {/* Top Banner matching Screen 4 in picture */}
      <div className="card lib-banner">
        <div className="lib-banner-icon">
          <Icon n="notes" size={24} />
        </div>
        <div>
          <h1 className="lib-banner-title">Your Notes & History</h1>
          <p className="lib-banner-sub">Access and organize all your notes and tutor chats in one place.</p>
        </div>
      </div>

      {/* Category Pills matching Screen 4 in picture */}
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
            className={'pill' + (filter === 'chats' ? ' on' : '')}
            onClick={() => setFilter('chats')}
          >
            Chats
          </button>
        </div>

        <label className="search" style={{ margin: 0 }}>
          <Icon n="search" size={16} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes and chats…"
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
            : filter === 'chats'
            ? 'No chats yet. Ask the AI Tutor anything!'
            : 'No items in your library yet.'}
        </div>
      ) : (
        <div className="lib-list">
          {items.map((item) => (
            <div key={item.id} className="card lib-card">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                  href={item.itemType === 'note' ? `/notes?id=${item.id}` : `/tutor?c=${item.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <b className="lib-card-title">{item.title || 'Untitled Note'}</b>
                  <div className="lib-card-meta">
                    <Icon n="cal" size={13} />
                    <span>{fmt(item.updatedAt)}</span>
                    <span className="lib-badge">{item.itemType === 'note' ? 'Note' : 'Chat'}</span>
                  </div>
                  <p className="lib-card-snippet">
                    {item.itemType === 'note'
                      ? item.content ? item.content.slice(0, 110) + '…' : 'Empty note'
                      : `${item._count?.messages || 0} messages in this conversation`}
                  </p>
                </Link>
              </div>

              <div className="lib-card-actions">
                <Link
                  className="btn out"
                  href={item.itemType === 'note' ? `/notes?id=${item.id}` : `/tutor?c=${item.id}`}
                  style={{ padding: '6px 12px', fontSize: 13 }}
                >
                  Open
                </Link>
                <button
                  className="btn danger"
                  aria-label="Delete item"
                  onClick={() => (item.itemType === 'note' ? removeNote(item.id, item.title) : removeChat(item.id, item.title))}
                  style={{ padding: '6px 10px', fontSize: 13 }}
                >
                  <Icon n="trash" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button (+) matching Screen 4 in picture */}
      <Link href="/tutor" className="fab" aria-label="Start new AI Tutor chat" title="New chat">
        <Icon n="plus" size={24} />
      </Link>
    </>
  );
}
