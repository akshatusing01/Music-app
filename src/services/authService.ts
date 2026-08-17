import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export const authService = {
  async getSession(): Promise<Session | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  },
  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    if (!supabase) return () => undefined;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
  },
  async signUp(email: string, password: string, displayName: string) {
    if (!supabase) throw new Error('Cloud authentication is not configured yet.');
    return supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
  },
  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Cloud authentication is not configured yet.');
    return supabase.auth.signInWithPassword({ email, password });
  },
  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  },
  async getUser(): Promise<User | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  },
};
