'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { api } from '@/lib/ask';

const TYPES = ['All', 'Notes', 'Books', 'Slides'];

export default function Documents() {
  const [docs, setDocs] = useState(null);
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [toast, setToast] = useState('');

  // Fetch documents from the backend database
  function loadDocs() {
    const params = new URLSearchParams();
    if (filter !== 'All') params.set('type', filter);
    if (q.trim()) params.set('q', q.trim());

    api(`/api/documents?${params.toString()}`)
      .then((r) => setDocs(r.documents || []))
      .catch((err) => {
        console.error(err);
        setDocs([]);
      });
  }

  useEffect(() => {
    const t = setTimeout(loadDocs, 200);
    return () => clearTimeout(t);
  }, [filter, q]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside() {
      setMenuOpen(null);
    }
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const count = (t) => (t === 'All' ? docs?.length ?? 0 : docs?.filter((d) => d.type === t).length ?? 0);
  const rows = docs || [];

  async function upload(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    const formData = new FormData();
    formData.append('file', f);
    formData.append('type', filter !== 'All' ? filter : '');

    setUploading(true);
    flash(`Uploading & parsing "${f.name}"…`);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errMessage = `Upload failed (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) errMessage = data.error;
        } catch {
          const text = await res.text().catch(() => '');
          if (text) errMessage = text.slice(0, 120);
        }
        throw new Error(errMessage);
      }

      const { document } = await res.json();
      setDocs((prev) => [document, ...(prev || []).filter((x) => x.id !== document.id)]);
      flash(`"${f.name}" ready to chat!`);
    } catch (err) {
      console.error('[Upload error]', err);
      flash(`Error: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function deleteDoc(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api(`/api/documents/${id}`, { method: 'DELETE' });
      setDocs((prev) => (prev || []).filter((d) => d.id !== id));
      setMenuOpen(null);
      flash(`Deleted "${name}"`);
    } catch (err) {
      flash(`Error: ${err.message}`);
    }
  }

  return (
    <>
      <div className="mhead">
        <div>
          <h1>My Documents</h1>
          <p>Upload your notes or PDFs. StudyMate extracts their text so the AI Tutor can chat with them.</p>
        </div>
        <label className="btn pri" style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
          <Icon n="plus" size={16} />
          {uploading ? 'Processing…' : 'Upload Document'}
          <input
            type="file"
            hidden
            accept=".pdf,.txt,.md,.ppt,.pptx,.csv"
            disabled={uploading}
            onChange={upload}
          />
        </label>
      </div>

      <div className="card card-pad">
        <div className="tools">
          {TYPES.map((t) => (
            <button
              key={t}
              className={'pill' + (filter === t ? ' on' : '')}
              onClick={() => setFilter(t)}
            >
              {t} ({count(t)})
            </button>
          ))}
          <label className="search">
            <Icon n="search" size={16} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search documents…"
              aria-label="Search documents"
            />
          </label>
        </div>

        {docs === null ? (
          <div className="empty">Loading your documents…</div>
        ) : rows.length === 0 ? (
          <div className="empty">
            {q
              ? 'No documents match your search.'
              : 'No documents uploaded yet. Click "Upload Document" above to upload your notes or PDFs!'}
          </div>
        ) : (
          rows.map((d) => (
            <div key={d.id} className="doc">
              <span className="pdf">{d.name.endsWith('.pdf') ? 'PDF' : 'DOC'}</span>
              <div className="t">
                <b>{d.name}</b>
                <span>
                  {d.pages || '1 page'} • Uploaded {new Date(d.createdAt).toLocaleDateString()}
                </span>
              </div>

              <Link className="btn out" href={`/tutor?doc=${d.id}`}>
                <Icon n="chat" size={16} />
                Chat
              </Link>

              <button
                className="btn danger"
                aria-label={`Delete ${d.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDoc(d.id, d.name);
                }}
              >
                Delete
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  className="iconbtn"
                  aria-label="More options"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === d.id ? null : d.id);
                  }}
                >
                  <Icon n="dots" />
                </button>

                {menuOpen === d.id && (
                  <div
                    className="card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: 4,
                      zIndex: 50,
                      minWidth: 160,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      padding: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      className="btn"
                      href={`/tutor?doc=${d.id}`}
                      style={{ border: 0, justifyContent: 'flex-start', padding: '8px 12px', fontSize: 13 }}
                    >
                      <Icon n="chat" size={15} />
                      Chat with PDF
                    </Link>
                    <button
                      className="btn"
                      style={{
                        border: 0,
                        justifyContent: 'flex-start',
                        padding: '8px 12px',
                        fontSize: 13,
                        color: 'var(--pdfc)',
                      }}
                      onClick={() => deleteDoc(d.id, d.name)}
                    >
                      Delete Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
