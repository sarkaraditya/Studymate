'use client';
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/Icon';
import { api } from '@/lib/ask';

// ── helpers ───────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fmtDate = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
const fmtDur = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? m % 60 + 'm' : ''}`.trim() : `${m}m`);

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History',
  'Geography', 'English', 'Computer Science', 'Economics', 'Other',
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

// Week helpers
function startOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d;
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Color per subject (cycles through a palette)
const PALETTE = [
  '#5b3df5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899',
];
const subjectColor = (() => {
  const cache = {};
  let idx = 0;
  return (sub) => {
    if (!cache[sub]) cache[sub] = PALETTE[idx++ % PALETTE.length];
    return cache[sub];
  };
})();

// ── empty form state ──────────────────────────────────────────────────────────
const emptyForm = (date = todayStr()) => ({
  subject: SUBJECTS[0],
  date,
  startTime: '09:00',
  duration: 60,
  note: '',
});

// ── component ─────────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const [sessions, setSessions] = useState(null); // null = loading
  const [viewDate, setViewDate] = useState(todayStr());
  const [modal, setModal] = useState(null); // null | 'add' | session-object (edit)
  const [form, setForm] = useState(emptyForm());
  const [status, setStatus] = useState('');
  const [view, setView] = useState('week'); // 'week' | 'list'

  const load = useCallback(() => {
    api('/api/planner')
      .then((r) => setSessions(r.sessions))
      .catch((e) => setStatus(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── week grid data ────────────────────────────────────────────────────────
  const weekStart = startOfWeek(viewDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(weekStart, i)));

  function sessionsForDate(d) {
    return (sessions || []).filter((s) => s.date === d);
  }

  // ── modal helpers ─────────────────────────────────────────────────────────
  function openAdd(date = viewDate) {
    setForm(emptyForm(date));
    setModal('add');
    setStatus('');
  }
  function openEdit(s) {
    setForm({ subject: s.subject, date: s.date, startTime: s.startTime, duration: s.duration, note: s.note });
    setModal(s);
    setStatus('');
  }
  function closeModal() { setModal(null); setStatus(''); }

  function set(k) { return (e) => setForm((f) => ({ ...f, [k]: e.target.value })); }

  async function save() {
    setStatus('Saving…');
    try {
      if (modal === 'add') {
        const { session } = await api('/api/planner', { method: 'POST', body: { ...form, duration: Number(form.duration) } });
        setSessions((l) => [...(l || []), session].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)));
      } else {
        const { session } = await api(`/api/planner/${modal.id}`, { method: 'PATCH', body: { ...form, duration: Number(form.duration) } });
        setSessions((l) => l.map((x) => (x.id === session.id ? session : x)));
      }
      closeModal();
    } catch (e) { setStatus(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this session?')) return;
    try {
      await api(`/api/planner/${id}`, { method: 'DELETE' });
      setSessions((l) => l.filter((x) => x.id !== id));
    } catch (e) { setStatus(e.message); }
  }

  async function toggleDone(s) {
    try {
      const { session } = await api(`/api/planner/${s.id}`, { method: 'PATCH', body: { done: !s.done } });
      setSessions((l) => l.map((x) => (x.id === session.id ? session : x)));
    } catch (e) { setStatus(e.message); }
  }

  // ── summary stats ─────────────────────────────────────────────────────────
  const totalThisWeek = (sessions || [])
    .filter((s) => weekDays.includes(s.date))
    .reduce((acc, s) => acc + s.duration, 0);
  const doneThisWeek = (sessions || [])
    .filter((s) => weekDays.includes(s.date) && s.done)
    .reduce((acc, s) => acc + s.duration, 0);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── header ── */}
      <div className="mhead">
        <div>
          <h1>Study Planner</h1>
          <p>Schedule your study sessions, track subjects, and stay on top of your goals.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="pl-tabs">
            <button className={`pl-tab${view === 'week' ? ' on' : ''}`} onClick={() => setView('week')}>
              <Icon n="cal" size={15} /> Week
            </button>
            <button className={`pl-tab${view === 'list' ? ' on' : ''}`} onClick={() => setView('list')}>
              <Icon n="notes" size={15} /> List
            </button>
          </div>
          <button className="btn pri" onClick={() => openAdd()}>
            <Icon n="plus" size={16} /> Add session
          </button>
        </div>
      </div>

      {/* ── stats row ── */}
      <div className="pl-stats">
        <div className="card pl-stat">
          <Icon n="clock" size={20} />
          <div>
            <b>{fmtDur(totalThisWeek) || '—'}</b>
            <span>Scheduled this week</span>
          </div>
        </div>
        <div className="card pl-stat">
          <Icon n="check" size={20} />
          <div>
            <b>{fmtDur(doneThisWeek) || '—'}</b>
            <span>Completed this week</span>
          </div>
        </div>
        <div className="card pl-stat">
          <Icon n="bar" size={20} />
          <div>
            <b>{totalThisWeek ? Math.round((doneThisWeek / totalThisWeek) * 100) + '%' : '—'}</b>
            <span>Completion rate</span>
          </div>
        </div>
      </div>

      {/* ── week navigator ── */}
      {view === 'week' && (
        <div className="card pl-week-wrap">
          <div className="pl-week-nav">
            <button className="btn" onClick={() => setViewDate(toDateStr(addDays(weekStart, -7)))}>
              ‹ Prev
            </button>
            <span className="pl-week-label">
              {fmtDate(weekDays[0])} – {fmtDate(weekDays[6])}
            </span>
            <button className="btn" onClick={() => setViewDate(toDateStr(addDays(weekStart, 7)))}>
              Next ›
            </button>
          </div>
          <div className="pl-week-grid">
            {weekDays.map((d) => {
              const isToday = d === todayStr();
              const daySessions = sessionsForDate(d);
              return (
                <div key={d} className={`pl-day${isToday ? ' today' : ''}`}>
                  <div className="pl-day-head">
                    <span className="pl-day-name">
                      {new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className={`pl-day-num${isToday ? ' today' : ''}`}>
                      {new Date(d + 'T00:00:00').getDate()}
                    </span>
                    <button className="pl-add-btn" onClick={() => openAdd(d)} title="Add session">
                      <Icon n="plus" size={13} />
                    </button>
                  </div>
                  <div className="pl-day-body">
                    {sessions === null ? (
                      <div className="pl-empty">…</div>
                    ) : daySessions.length === 0 ? (
                      <div className="pl-empty">No sessions</div>
                    ) : (
                      daySessions.map((s) => (
                        <SessionCard key={s.id} s={s} onEdit={openEdit} onDelete={remove} onToggle={toggleDone} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── list view ── */}
      {view === 'list' && (
        <div className="card" style={{ padding: '8px 0' }}>
          {sessions === null ? (
            <div className="empty">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="empty">No sessions yet. Add your first one!</div>
          ) : (
            (() => {
              const grouped = {};
              sessions.forEach((s) => {
                (grouped[s.date] = grouped[s.date] || []).push(s);
              });
              return Object.keys(grouped).sort().map((d) => (
                <div key={d} className="pl-list-group">
                  <div className="pl-list-date">{fmtDate(d)}{d === todayStr() ? ' — Today' : ''}</div>
                  {grouped[d].map((s) => (
                    <SessionCard key={s.id} s={s} onEdit={openEdit} onDelete={remove} onToggle={toggleDone} list />
                  ))}
                </div>
              ));
            })()
          )}
        </div>
      )}

      {/* ── add / edit modal ── */}
      {modal && (
        <div className="pl-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="pl-modal card">
            <div className="pl-modal-head">
              <h2>{modal === 'add' ? 'Add study session' : 'Edit session'}</h2>
              <button className="iconbtn" onClick={closeModal}><Icon n="x" size={18} /></button>
            </div>

            <label className="pl-field">
              <span>Subject</span>
              <select value={form.subject} onChange={set('subject')} className="sel" style={{ width: '100%' }}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>

            <label className="pl-field">
              <span>Date</span>
              <input type="date" className="pl-input" value={form.date} onChange={set('date')} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="pl-field">
                <span>Start time</span>
                <input type="time" className="pl-input" value={form.startTime} onChange={set('startTime')} />
              </label>
              <label className="pl-field">
                <span>Duration</span>
                <select value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))} className="sel" style={{ width: '100%' }}>
                  {DURATIONS.map((d) => <option key={d} value={d}>{fmtDur(d)}</option>)}
                </select>
              </label>
            </div>

            <label className="pl-field">
              <span>Note <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</small></span>
              <input
                type="text"
                className="pl-input"
                value={form.note}
                onChange={set('note')}
                placeholder="e.g. Chapter 5, practice problems…"
                maxLength={200}
              />
            </label>

            <div className="pl-modal-foot">
              <button className="btn" onClick={closeModal}>Cancel</button>
              <button className="btn pri" onClick={save}>
                {modal === 'add' ? 'Add session' : 'Save changes'}
              </button>
              {status && <span style={{ color: 'var(--muted)', fontSize: 13 }}>{status}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── session card ──────────────────────────────────────────────────────────────
function SessionCard({ s, onEdit, onDelete, onToggle, list }) {
  const color = subjectColor(s.subject);
  return (
    <div className={`pl-session${s.done ? ' done' : ''}${list ? ' list-row' : ''}`} style={{ '--sc': color }}>
      <button className="pl-check" onClick={() => onToggle(s)} title={s.done ? 'Mark undone' : 'Mark done'}>
        {s.done ? <Icon n="check" size={13} /> : null}
      </button>
      <div className="pl-session-body">
        <span className="pl-subj">{s.subject}</span>
        <span className="pl-time">{s.startTime} · {fmtDur(s.duration)}</span>
        {s.note && <span className="pl-note">{s.note}</span>}
      </div>
      <div className="pl-session-actions">
        <button className="iconbtn" onClick={() => onEdit(s)} title="Edit"><Icon n="dots" size={15} /></button>
        <button className="iconbtn" onClick={() => onDelete(s.id)} title="Delete"><Icon n="x" size={15} /></button>
      </div>
    </div>
  );
}
