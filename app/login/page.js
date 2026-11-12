'use client';
import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import Icon from '@/components/Icon';

// Tab: 'signin' | 'signup'
function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [tab, setTab]           = useState('signin');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function switchTab(t) {
    setTab(t);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (tab === 'signup') {
      if (!name.trim()) return setError('Please enter your name.');
      if (password.length < 6) return setError('Password must be at least 6 characters.');
      if (password !== confirm) return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      if (tab === 'signup') {
        // 1. Register via API (better error messages)
        const reg = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await reg.json();
        if (!reg.ok) {
          setError(data.error || 'Registration failed.');
          return;
        }
      }

      // 2. Sign in (for both signup flow and direct signin)
      const res = await signIn('email-password', {
        email,
        password,
        mode: 'signin',
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        // Map generic NextAuth error codes to friendly messages
        if (res.error === 'CredentialsSignin') {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError(res.error);
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn('google', { callbackUrl });
  }

  return (
    <main className="login">
      <div className="card loginbox">
        <Logo />

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={'auth-tab' + (tab === 'signin' ? ' on' : '')} onClick={() => switchTab('signin')} type="button">
            Sign In
          </button>
          <button className={'auth-tab' + (tab === 'signup' ? ' on' : '')} onClick={() => switchTab('signup')} type="button">
            Sign Up
          </button>
        </div>

        <h1>{tab === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          {tab === 'signin'
            ? 'Sign in to restore your chats, notes, and quizzes.'
            : 'Sign up to save your chats, notes, and quizzes across sessions.'}
        </p>

        {error && (
          <p role="alert" className="err" style={{ margin: 0, fontSize: 14 }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                className="pl-input"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              className="pl-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="pl-input"
              placeholder={tab === 'signup' ? 'At least 6 characters' : 'Your password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {tab === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-confirm">Confirm Password</label>
              <input
                id="auth-confirm"
                type="password"
                className="pl-input"
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button type="submit" className="btn pri gbtn" disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? (tab === 'signup' ? 'Creating account…' : 'Signing in…')
              : (tab === 'signup' ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        <button
          className="btn out gbtn"
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <Icon n="google" size={18} />
          <span>Continue with Google</span>
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          {tab === 'signin' ? (
            <>Don&apos;t have an account?{' '}
              <button type="button" onClick={() => switchTab('signup')} style={{ background: 'none', border: 0, color: 'var(--brand)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit', padding: 0 }}>
                Sign up free
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" onClick={() => switchTab('signin')} style={{ background: 'none', border: 0, color: 'var(--brand)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit', padding: 0 }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
