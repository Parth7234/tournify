'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) { setError(result.error); setLoading(false); }
    else { router.push('/admin'); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle bg decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-fixed/10 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-secondary-container/10 blur-3xl" />
      </div>

      <div className="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl shadow-primary/[0.06] border border-outline-variant/20 w-full max-w-sm overflow-hidden animate-slide-up">
        {/* Accent top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary-container via-primary to-primary-container" />

        <div className="p-8 flex flex-col items-center gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-primary-container/30">
              T
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Tournify</h1>
              <p className="text-xs text-outline mt-1">College Sports, Live & Loud</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {error && (
              <div className="bg-error-container/40 border border-error/20 text-error text-sm rounded-xl px-4 py-3 flex items-center gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block">Email</label>
              <input
                id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary-container/50 focus:border-primary outline-none transition-all"
                placeholder="admin@tournify.com" required
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block">Password</label>
              <input
                id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary-container/50 focus:border-primary outline-none transition-all"
                placeholder="••••••••" required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/15 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
