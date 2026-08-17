import React, { useState } from 'react';
import { authService } from '../services/authService';

interface AuthModalProps {
  onClose: () => void;
  onAuthenticated: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthenticated }) => {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    try {
      if (mode === 'sign-up') {
        const { data, error: authError } = await authService.signUp(email.trim(), password, name.trim() || 'Listener');
        if (authError) throw authError;
        if (!data.session) setNotice('Account created. Check your email if confirmation is enabled.');
        else onAuthenticated();
      } else {
        const { error: authError } = await authService.signIn(email.trim(), password);
        if (authError) throw authError;
        onAuthenticated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-rose-300">SyncBeat Account</div>
            <h2 className="text-2xl font-extrabold text-white mt-1">{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl">×</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'sign-up' && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/60" />}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/60" />
          <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/60" />
          {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs p-3">{error}</div>}
          {notice && <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs p-3">{notice}</div>}
          <button disabled={busy} className="w-full rounded-2xl bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-bold py-3 transition">{busy ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button>
        </form>
        <button onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setNotice(''); }} className="w-full mt-4 text-xs text-zinc-400 hover:text-white">{mode === 'sign-in' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
      </div>
    </div>
  );
};
