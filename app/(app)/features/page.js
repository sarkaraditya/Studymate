'use client';
import Link from 'next/link';
import Icon from '@/components/Icon';

const QUICK_LINKS = [
  ['chat', 'Ask Questions', '/tutor'],
  ['doc', 'Chat with PDFs', '/documents'],
  ['notes', 'Generate Notes', '/notes'],
];

const DETAILED_FEATURES = [
  {
    icon: 'chat',
    title: 'AI Study Tutor',
    desc: 'Ask complex doubts, get step-by-step breakdowns, and receive crystal-clear explanations.',
    link: '/tutor',
  },
  {
    icon: 'doc',
    title: 'Chat with PDFs & Notes',
    desc: 'Upload your syllabus, lecture slides, or research papers.',
    link: '/documents',
  },
  {
    icon: 'notes',
    title: 'Persistent Notes Database',
    desc: 'Save tutor answers directly into your personal notes.',
    link: '/notes',
  },
];

export default function FeaturesPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 20 }}>
      {/* Hero Section matching Screen 2 in picture */}
      <section className="hero" style={{ padding: '16px 0 20px' }}>
        <div>
          <h1 style={{ fontSize: 27, lineHeight: 1.15, marginBottom: 10 }}>
            Your AI-Powered Study Assistant
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.45, marginBottom: 16 }}>
            Study smarter with AI. Ask questions, chat with your lecture notes, generate summaries, and keep your entire study history synced in the database.
          </p>
          <div className="row" style={{ display: 'flex', gap: 10 }}>
            <Link className="btn pri" href="/tutor" style={{ flex: 1, justifyContent: 'center' }}>
              Get Started Free <Icon n="arrow" size={16} />
            </Link>
            <a className="btn" href="#features-detail" style={{ flex: 1, justifyContent: 'center' }}>
              Explore Features
            </a>
          </div>
        </div>

        {/* Laptop with AI sparkle resting on books */}
        <svg
          viewBox="0 0 420 300"
          role="img"
          aria-label="Laptop with an AI sparkle resting on a stack of books"
          style={{ width: '100%', height: 'auto', maxWidth: 360, margin: '0 auto', display: 'block' }}
        >
          <circle cx="230" cy="130" r="110" fill="var(--tint)" />
          <g transform="rotate(-6 200 150)">
            <rect x="95" y="60" width="210" height="150" rx="10" fill="var(--surface)" stroke="var(--ink)" strokeWidth="4" />
            <rect x="112" y="78" width="176" height="114" rx="4" fill="var(--tint)" />
            <path d="M200 100l5 14 14 5-14 5-5 14-5-14-14-5 14-5z" fill="var(--brand)" />
            <rect x="130" y="148" width="80" height="7" rx="3" fill="var(--tint2)" />
            <rect x="130" y="162" width="130" height="7" rx="3" fill="var(--brand)" opacity=".6" />
          </g>
          <path d="M60 235h230l20 15H45z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="3" />
          <g stroke="var(--brand)" strokeWidth="4" fill="var(--surface)">
            <rect x="262" y="196" width="130" height="24" rx="6" />
            <rect x="262" y="226" width="130" height="24" rx="6" />
          </g>
        </svg>
      </section>

      {/* 3 Quick Navigation shortcuts matching Screen 2 */}
      <section className="feats" aria-label="Quick Navigation">
        {QUICK_LINKS.map(([ic, label, href]) => (
          <Link key={href} href={href} className="feat-pill-link">
            <span className="ic"><Icon n={ic} /></span>
            <span>{label}</span>
          </Link>
        ))}
      </section>

      {/* Detailed Features Section matching Screen 3 in picture */}
      <section id="features-detail" style={{ paddingTop: 24 }}>
        <div className="sec-head" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, lineHeight: 1.2, marginBottom: 8 }}>
            Everything You Need to Ace Your Studies
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.45 }}>
            Built with generative AI and designed to give you deep comprehension, active recall, and effortless note organization.
          </p>
        </div>

        <div className="feat-grid" style={{ padding: 0 }}>
          {DETAILED_FEATURES.map((f) => (
            <Link key={f.title} href={f.link} className="card feat-card">
              <div className="ic-wrap">
                <Icon n={f.icon} size={22} />
              </div>
              <div className="feat-card-body">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
              <div className="feat-card-arrow">
                <Icon n="arrow" size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
