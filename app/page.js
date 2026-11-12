import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Icon from '@/components/Icon';
import LandingHeader from '@/components/LandingHeader';

// 3 quick action items matching Screen 2 in reference image
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

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Upload or Ask',
    desc: 'Upload your lecture slides, notes, and PDFs, or start a new chat by typing any question you want clarified.',
  },
  {
    step: '2',
    title: 'Learn with AI',
    desc: 'The AI Tutor analyzes your material and explains tricky concepts patiently with concise summaries and bullet points.',
  },
  {
    step: '3',
    title: 'Save & Review History',
    desc: 'Save critical answers directly to your notes library and return to your past study sessions whenever you log in.',
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <>
      <LandingHeader />

      {/* Hero Section */}
      <section className="hero">
        <div>
          <h1>Your AI-Powered Study Assistant</h1>
          <p>
            Study smarter with AI. Ask questions, chat with your lecture notes, generate summaries, and keep your entire study history synced in the database.
          </p>
          <div className="row">
            <Link className="btn pri" href="/login">
              Get Started Free <Icon n="arrow" size={16} />
            </Link>
            <a className="btn" href="#features">
              Explore Features
            </a>
          </div>
        </div>
        <svg
          viewBox="0 0 420 300"
          role="img"
          aria-label="Laptop with an AI sparkle resting on a stack of books"
          style={{ width: '100%', height: 'auto' }}
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

      {/* Quick shortcuts (3 items matching Screen 2 in reference image) */}
      <section className="feats" aria-label="Quick Navigation">
        {QUICK_LINKS.map(([ic, label, href]) => (
          <Link key={href} href={href} className="feat-pill-link">
            <span className="ic"><Icon n={ic} /></span>
            <span>{label}</span>
          </Link>
        ))}
      </section>

      {/* Detailed Features Section matching Screen 3 in reference image */}
      <section id="features" style={{ paddingTop: 30 }}>
        <div className="sec-head">
          <h2>Everything You Need to Ace Your Studies</h2>
          <p>Built with generative AI and designed to give you deep comprehension, active recall, and effortless note organization.</p>
        </div>
        <div className="feat-grid">
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

      {/* How it Works Section */}
      <section id="how" className="how-section">
        <div className="sec-head">
          <h2>How StudyMate AI Works</h2>
          <p>Three simple steps to transform the way you learn and prepare for exams.</p>
        </div>
        <div className="how-grid">
          {HOW_IT_WORKS.map((h) => (
            <div key={h.step} className="card how-step">
              <span className="how-num">{h.step}</span>
              <h3>{h.title}</h3>
              <p>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="sec-head">
          <h2>About StudyMate AI</h2>
          <p>
            StudyMate AI was created to solve a universal student problem: information overload. Instead of searching through hundreds of scattered slides and videos, StudyMate turns your existing study material into an interactive knowledge base.
          </p>
        </div>

        <div className="about-grid">
          <div className="card about-box">
            <h3>Tailored to Your Syllabus</h3>
            <p>
              Generic chatbots often hallucinate or answer outside your curriculum. StudyMate AI grounds its responses in the PDFs, lecture slides, and notes you upload, making sure explanations align with your professors' expectations.
            </p>
          </div>
          <div className="card about-box">
            <h3>Persistent Account & Database Sync</h3>
            <p>
              Every note you jot down, document you upload, and conversation you have is securely stored under your user account. When you log in with Google, everything is waiting for you exactly where you left off.
            </p>
          </div>
          <div className="card about-box">
            <h3>Powered by Google Gemini</h3>
            <p>
              Backed by Google's latest multimodal Gemini models, StudyMate understands complex technical prose, code, formulas, and diagrams with lightning-fast response times and high factual accuracy.
            </p>
          </div>
          <div className="card about-box">
            <h3>Privacy & Student Isolation</h3>
            <p>
              Your academic material and chat history belong solely to you. All database queries enforce strict user-level isolation, ensuring your notes and documents remain completely private.
            </p>
          </div>
        </div>
      </section>

      {/* Call To Action Box */}
      <section className="cta-box">
        <h2>Ready to Master Your Coursework?</h2>
        <p>
          Join students using StudyMate AI to study faster, understand deeper, and stay organized throughout the semester.
        </p>
        <Link className="btn pri" href="/login" style={{ padding: '12px 24px', fontSize: 16 }}>
          Start Studying for Free <Icon n="arrow" size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-in">
          <Logo />
          <div className="footer-nav">
            <a href="#features">Features</a>
            <a href="#how">How it Works</a>
            <a href="#about">About</a>
            <Link href="/tutor">AI Tutor</Link>
            <Link href="/documents">Documents</Link>
            <Link href="/login">Sign In</Link>
          </div>
          <span className="footer-copy" suppressHydrationWarning>© {new Date().getFullYear()} StudyMate AI. Built for students.</span>
        </div>
      </footer>

      {/* Mobile 4-Item Bottom Navigation Bar matching Screen 2 in reference image */}
      <nav className="mobile-bottom-nav">
        <Link href="/" className="mobile-nav-item on">
          <Icon n="home" size={20} />
          <span>Home</span>
        </Link>
        <a href="#features" className="mobile-nav-item">
          <Icon n="grid" size={20} />
          <span>Features</span>
        </a>
        <Link href="/login" className="mobile-nav-item">
          <Icon n="book" size={20} />
          <span>Library</span>
        </Link>
        <Link href="/login" className="mobile-nav-item">
          <Icon n="user" size={20} />
          <span>Profile</span>
        </Link>
      </nav>
    </>
  );
}
