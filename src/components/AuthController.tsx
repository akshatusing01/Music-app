import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { cloudPersistenceService } from '../services/cloudPersistenceService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { AuthModal } from './AuthModal';

export const AuthController: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    authService.getSession().then((value) => { if (mounted) setSession(value); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    return authService.onAuthStateChange((value) => setSession(value));
  }, []);

  useEffect(() => {
    if (!session || !cloudPersistenceService.enabled) return;
    let cancelled = false;
    setBusy(true);
    cloudPersistenceService.loadUserData().then((data) => {
      if (cancelled || !data) return;
      window.dispatchEvent(new CustomEvent('syncbeat:cloud-restored', { detail: data }));
    }).catch(() => undefined).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [session]);

  if (!isSupabaseConfigured) return null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed right-4 bottom-24 md:bottom-6 z-[70] rounded-full border border-white/10 bg-zinc-900/90 backdrop-blur px-4 py-2 text-xs font-bold text-white shadow-xl hover:bg-zinc-800" title={session ? 'Account' : 'Sign in'}>
        {session ? (busy ? 'Syncing…' : 'Account') : 'Sign in'}
      </button>
      {open && <AuthModal onClose={() => setOpen(false)} onAuthenticated={() => setOpen(false)} />}
    </>
  );
};