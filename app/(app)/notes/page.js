'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';
import { api } from '@/lib/ask';

const fmt = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function NotesInner() {
  const params = useSearchParams();
  const openId = params.get('id');

  const [notes, setNotes] = useState(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null); // note id, or 'new'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      api('/api/notes' + (q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''))
        .then((r) => {
          if (!live) return;
          setNotes(r.notes);
          if (openId && r.notes) {
            const found = r.notes.find((x) => x.id === openId);
            if (found) {
              setSel(found.id);
              setTitle(found.title);
              setContent(found.content);
              setStatus('');
            }
          }
        })
        .catch((e) => live && setStatus(e.message));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, openId]);

  function open(n) {
    setSel(n.id);
    setTitle(n.title);
    setContent(n.content);
    setStatus('');
    window.history.replaceState(null, '', `/notes?id=${n.id}`);
  }

  function create() {
    setSel('new');
    setTitle('');
    setContent('');
    setStatus('');
    window.history.replaceState(null, '', '/notes');
  }

  async function save() {
    setStatus('Saving…');
    try {
      if (sel === 'new') {
        const { note } = await api('/api/notes', { method: 'POST', body: { title, content } });
        setNotes((l) => [note, ...(l || [])]);
        setSel(note.id);
        setTitle(note.title);
        window.history.replaceState(null, '', `/notes?id=${note.id}`);
      } else {
        const { note } = await api(`/api/notes/${sel}`, { method: 'PATCH', body: { title, content } });
        setNotes((l) => [note, ...(l || []).filter((x) => x.id !== note.id)]);
        setTitle(note.title);
      }
      setStatus('Saved in database');
    } catch (e) {
      setStatus(e.message);
    }
  }

  async function remove() {
    if (sel === 'new') {
      setSel(null);
      window.history.replaceState(null, '', '/notes');
      return;
    }
    if (!confirm('Delete this note?')) return;
    try {
      await api(`/api/notes/${sel}`, { method: 'DELETE' });
      setNotes((l) => l.filter((x) => x.id !== sel));
      setSel(null);
      window.history.replaceState(null, '', '/notes');
    } catch (e) {
      setStatus(e.message);
    }
  }

  return (
    <>
      <div className="mhead">
        <div>
          <h1>Notes</h1>
          <p>Write notes or save tutor answers. Everything is securely stored in your account database.</p>
        </div>
        <button className="btn pri" onClick={create}><Icon n="plus" size={16} />New note</button>
      </div>
      <div className="notes">
        <div className="card nlist">
          <label className="search" style={{ marginLeft: 0, minWidth: 0 }}>
            <Icon n="search" size={16} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes…"
              aria-label="Search notes"
            />
          </label>
          {notes === null ? (
            <div className="empty">Loading…</div>
          ) : notes.length === 0 ? (
            <div className="empty">{q ? 'No notes match.' : 'No notes yet.'}</div>
          ) : (
            notes.map((n) => (
              <button key={n.id} className={'nitem' + (sel === n.id ? ' on' : '')} onClick={() => open(n)}>
                <b>{n.title}</b>
                <small>{fmt(n.updatedAt)}</small>
              </button>
            ))
          )}
        </div>
        {sel ? (
          <div className="card editor">
            <input
              className="ttl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              aria-label="Note title"
              maxLength={200}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing…"
              aria-label="Note content"
            />
            <div className="bar">
              <button className="btn pri" onClick={save}>Save</button>
              <button className="btn danger" onClick={remove}>{sel === 'new' ? 'Discard' : 'Delete'}</button>
              <span className="msg-s" role="status">{status}</span>
            </div>
          </div>
        ) : (
          <div className="card empty">Select a note, or create a new one.</div>
        )}
      </div>
    </>
  );
}

export default function Notes() {
  return (
    <Suspense fallback={null}>
      <NotesInner />
    </Suspense>
  );
}
