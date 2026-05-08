'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const fn = mode === 'signin'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    const { error } = await fn;
    setBusy(false);
    if (error) setMsg(error.message);
    else if (mode === 'signup') setMsg('Check your inbox to verify your email.');
    else location.href = '/dashboard';
  }

  async function google() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    });
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="card">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">{mode === 'signin' ? 'Welcome back' : 'Create account'}</h1>
          <p className="text-sm text-slate-500">Save trips, sync across devices.</p>
        </div>

        <button onClick={google} className="btn-ghost mb-4 w-full">Continue with Google</button>
        <div className="my-4 flex items-center gap-2 text-xs text-slate-400"><div className="h-px flex-1 bg-slate-200" /> or <div className="h-px flex-1 bg-slate-200" /></div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600 flex items-center gap-1"><Lock className="h-3 w-3" /> Password</span>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
          </label>
          {msg && <p className="text-sm text-slate-600">{msg}</p>}
          <button disabled={busy} className="btn-primary w-full">{busy ? '…' : (mode === 'signin' ? 'Sign in' : 'Create account')}</button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === 'signin' ? "No account?" : 'Have an account?'}{' '}
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="font-semibold text-brand-600">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
      <p className="mt-4 text-center text-sm">
        <Link href="/" className="text-slate-500 hover:text-slate-700">← Back home</Link>
      </p>
    </div>
  );
}
