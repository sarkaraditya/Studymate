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
      <div className="mhead">
        <div>
          <h1>History</h1>
          <p>Your saved study notes and AI Tutor chat history, stored in the database.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '18px 22px' }}>
        <div className="tools" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={'pill' + (filter === 'all' ? ' on' : '')}
              onClick={() => setFilter('all')}
            >
              All History
            </button>
            <button
              className={'pill' + (filter === 'notes' ? ' on' : '')}
              onClick={() => setFilter('notes')}
            >
              Notes History
            </button>
            <button
              className={'pill' + (filter === 'chats' ? ' on' : '')}
              onClick={() => setFilter('chats')}
            >
              Tutor Chats
            </button>
          </div>

          <label className="search" style={{ marginLeft: 0, minWidth: 240 }}>
            <Icon n="search" size={16} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search chats and notes…"
              aria-label="Search history"
            />
          </label>
        </div>

        {err && <p role="alert" style={{ color: 'var(--pdfc)', marginBottom: 12 }}>{err}</p>}

        {items === null ? (
          <div className="empty">Loading history from database…</div>
        ) : items.length === 0 ? (
          <div className="empty">
            {q
              ? 'No history matches your search.'
              : filter === 'notes'
              ? 'No saved notes yet. Create a note in the Notes section or save an answer from the AI Tutor.'
              : filter === 'chats'
              ? 'No chats yet. Ask the AI Tutor anything and your conversations will be stored here.'
              : 'No history yet. Start asking questions or writing notes to see them here.'}
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="hrow">
              <span
                className="av"
                style={{
                  background: item.itemType === 'note' ? 'var(--tint2)' : 'var(--tint)',
                  color: 'var(--brand)',
                  flexShrink: 0,
                }}
              >
                <Icon n={item.itemType === 'note' ? 'notes' : 'chat'} />
              </span>

              {item.itemType === 'note' ? (
                <>
                  <Link className="t" href={`/notes?id=${item.id}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b>{item.title || 'Untitled Note'}</b>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--tint)',
                          color: 'var(--brand)',
                          fontWeight: 600,
                        }}
                      >
                        Note
                      </span>
                    </div>
                    <span>
                      {item.content ? item.content.slice(0, 90) + (item.content.length > 90 ? '…' : '') : 'Empty note'} • {fmt(item.updatedAt)}
                    </span>
                  </Link>
                  <Link className="btn out" href={`/notes?id=${item.id}`}>
                    Open Note
                  </Link>
                  <button
                    className="btn danger"
                    aria-label={`Delete note ${item.title}`}
                    onClick={() => removeNote(item.id, item.title)}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <Link className="t" href={`/tutor?c=${item.id}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b>{item.title}</b>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--tint2)',
                          color: 'var(--brand)',
                          fontWeight: 600,
                        }}
                      >
                        Chat
                      </span>
                    </div>
                    <span>
                      {item._count?.messages || 0} messages • {fmt(item.updatedAt)}
                    </span>
                  </Link>
                  <Link className="btn out" href={`/tutor?c=${item.id}`}>
                    Open Chat
                  </Link>
                  <button
                    className="btn danger"
                    aria-label={`Delete chat ${item.title}`}
                    onClick={() => removeChat(item.id, item.title)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
