'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';
import { api, askTutor } from '@/lib/ask';

const GREETING = {
  local: true,
  role: 'ai',
  content: 'Hi! Ask me anything about your studies, or upload your notes and PDFs to chat with them directly.',
};

function TutorInner() {
  const params = useSearchParams();
  const openId = params.get('c');
  const docId = params.get('doc');

  const [msgs, setMsgs] = useState([GREETING]);
  const [convoId, setConvoId] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [toast, setToast] = useState('');
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [msgs, busy]);

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(''), 3000);
  };

  // Load active document if ?doc=<id> is in URL
  useEffect(() => {
    if (!docId) return;
    let live = true;
    api(`/api/documents/${docId}`)
      .then(({ document }) => {
        if (!live || !document) return;
        setActiveDoc(document);
        setMsgs([
          {
            local: true,
            role: 'ai',
            content: `📄 I've loaded your document **${document.name}** (${document.pages})! Ask me any questions, request a summary, or ask for practice questions based on your notes.`,
          },
        ]);
      })
      .catch((e) => live && flash(e.message));
    return () => {
      live = false;
    };
  }, [docId]);

  // Opening /tutor?c=<id> (from History) loads that saved conversation.
  useEffect(() => {
    if (!openId) {
      if (!docId) setMsgs([GREETING]);
      setConvoId(null);
      return;
    }
    let live = true;
    api(`/api/conversations/${openId}`)
      .then(({ conversation }) => {
        if (live) {
          setConvoId(conversation.id);
          setMsgs(conversation.messages);
        }
      })
      .catch((e) => live && flash(e.message));
    return () => {
      live = false;
    };
  }, [openId, docId]);

  async function send(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    const temp = { id: 'tmp-' + Date.now(), role: 'user', content: q };
    setMsgs((m) => [...m, temp]);
    setInput('');
    setBusy(true);
    try {
      const r = await askTutor(q, convoId, 'Gemini', activeDoc?.id);
      setConvoId(r.conversationId);
      setMsgs((m) => [...m.filter((x) => x.id !== temp.id), r.userMessage, r.aiMessage]);
    } catch (err) {
      setMsgs((m) => m.filter((x) => x.id !== temp.id));
      setInput(q);
      flash(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function attachDoc(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    const formData = new FormData();
    formData.append('file', f);

    setUploading(true);
    flash(`Uploading & reading "${f.name}"…`);

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
      setActiveDoc(document);
      flash(`"${document.name}" attached!`);
      setMsgs((m) => [
        ...m,
        {
          local: true,
          role: 'ai',
          content: `📎 Attached **${document.name}** (${document.pages}). I am ready to answer questions based on this file!`,
        },
      ]);
    } catch (err) {
      flash(`Attachment error: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function vote(msg, v) {
    if (msg.local) return;
    const next = msg.vote === v ? null : v;
    setMsgs((m) => m.map((x) => (x.id === msg.id ? { ...x, vote: next } : x)));
    try {
      await api(`/api/messages/${msg.id}`, { method: 'PATCH', body: { vote: next } });
    } catch (err) {
      setMsgs((m) => m.map((x) => (x.id === msg.id ? { ...x, vote: msg.vote } : x)));
      flash(err.message);
    }
  }

  async function saveNote(i) {
    const m = msgs[i];
    const question = [...msgs.slice(0, i)].reverse().find((x) => x.role === 'user');
    try {
      await api('/api/notes', {
        method: 'POST',
        body: {
          title: (question?.content || 'Tutor note').slice(0, 80),
          content: m.content,
          conversationId: convoId,
        },
      });
      flash('Saved to Notes');
    } catch (err) {
      flash(err.message);
    }
  }

  function newChat() {
    window.history.replaceState(null, '', '/tutor');
    setMsgs([GREETING]);
    setConvoId(null);
    setActiveDoc(null);
    setInput('');
  }

  return (
    <div className="tutor">
      <div className="mhead">
        <div>
          <h1>AI Tutor</h1>
          <p>Ask anything, upload your notes, or get explanations based on your study materials.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn" onClick={newChat}>
            <Icon n="plus" size={16} />
            New chat
          </button>
        </div>
      </div>

      {activeDoc && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: 'var(--tint)',
            borderRadius: 10,
            marginBottom: 14,
            border: '1px solid var(--tint2)',
          }}
        >
          <span style={{ color: 'var(--brand)', display: 'grid', placeItems: 'center' }}>
            <Icon n="doc" size={18} />
          </span>
          <span style={{ fontSize: 13, flex: 1, color: 'var(--ink)' }}>
            Active Document: <b>{activeDoc.name}</b> ({activeDoc.pages})
          </span>
          <button
            style={{
              background: 'none',
              border: 0,
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: 12,
              fontWeight: 600,
            }}
            onClick={() => {
              setActiveDoc(null);
              window.history.replaceState(null, '', '/tutor');
            }}
            title="Detach document"
          >
            ✕ Remove
          </button>
        </div>
      )}

      <div className="chat" aria-live="polite">
        {msgs.map((m, i) =>
          m.role === 'user' ? (
            <div key={m.id} className="msg u">
              <div className="bub">{m.content}</div>
              <span className="av">
                <Icon n="user" />
              </span>
            </div>
          ) : (
            <div key={m.id || 'greeting-' + i} className="msg a">
              <span className="av">
                <Icon n="spark" />
              </span>
              <div className="bub pre">
                {m.content}
                {!m.local && (
                  <div className="acts">
                    <button
                      aria-label="Copy"
                      onClick={() => {
                        navigator.clipboard?.writeText(m.content);
                        flash('Copied');
                      }}
                    >
                      <Icon n="doc" size={18} />
                    </button>
                    <button aria-label="Save to notes" title="Save to notes" onClick={() => saveNote(i)}>
                      <Icon n="notes" size={18} />
                    </button>
                    <button
                      aria-label="Helpful"
                      className={m.vote === 'up' ? 'on' : ''}
                      onClick={() => vote(m, 'up')}
                    >
                      <Icon n="up" size={18} />
                    </button>
                    <button
                      aria-label="Not helpful"
                      className={m.vote === 'down' ? 'on' : ''}
                      onClick={() => vote(m, 'down')}
                    >
                      <Icon n="down" size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {busy && (
          <div className="msg a">
            <span className="av">
              <Icon n="spark" />
            </span>
            <div className="bub typing">Thinking…</div>
          </div>
        )}
        <div ref={end} />
      </div>

      <form className="card composer" onSubmit={send}>
        <label
          className="iconbtn"
          style={{
            cursor: uploading ? 'wait' : 'pointer',
            display: 'grid',
            placeItems: 'center',
            opacity: uploading ? 0.5 : 1,
          }}
          title="Upload & attach document to chat"
        >
          <Icon n="clip" size={20} />
          <input
            type="file"
            hidden
            accept=".pdf,.txt,.md,.ppt,.pptx,.csv"
            disabled={uploading || busy}
            onChange={attachDoc}
          />
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            activeDoc
              ? `Ask a question about ${activeDoc.name}…`
              : 'Ask a question or upload notes to chat…'
          }
          aria-label="Ask a question"
          autoComplete="off"
          maxLength={8000}
        />
        <button className="send" aria-label="Send" disabled={busy || uploading}>
          <Icon n="send" />
        </button>
      </form>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default function Tutor() {
  return (
    <Suspense fallback={null}>
      <TutorInner />
    </Suspense>
  );
}
