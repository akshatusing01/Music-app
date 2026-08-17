import React, { useEffect, useRef, useState } from 'react';
import { Camera, Copy, UserPlus, Send, LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { socialService } from '../services/socialService';
import { authService } from '../services/authService';

export const SocialPanel: React.FC<{ profile: UserProfile; onUpdateProfile: (updated: Partial<UserProfile>) => void }> = ({ profile, onUpdateProfile }) => {
  const [friendCode, setFriendCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [publicProfile, user] = await Promise.all([socialService.getMyProfile(), authService.getUser()]);
        setMyCode(publicProfile?.friendCode || '');
        setEmail(user?.email || '');
      } catch {}
    })();
  }, []);

  const uploadAvatar = async (file: File) => {
    setBusy(true); setMessage('');
    try { const url = await socialService.uploadAvatar(file); onUpdateProfile({ avatar: url }); setMessage('Profile picture updated.'); }
    catch (error: any) { setMessage(error?.message || 'Unable to upload image.'); }
    finally { setBusy(false); }
  };

  const copyCode = async () => { if (!myCode) return; try { await navigator.clipboard.writeText(myCode); setMessage('SyncBeat ID copied.'); } catch {} };
  const sendFriend = async () => { setBusy(true); setMessage(''); try { await socialService.sendFriendRequest(friendCode); setMessage('Friend request sent.'); setFriendCode(''); } catch (error: any) { setMessage(error?.message || 'Could not send request.'); } finally { setBusy(false); } };
  const signOut = async () => { setBusy(true); try { await authService.signOut(); setMessage('Signed out.'); } finally { setBusy(false); } };

  return <section className="rounded-3xl border border-white/10 bg-white/[.03] p-5 sm:p-6 space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border-2 border-rose-500/40 bg-white/5">
        {profile.avatar ? <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-2xl font-black text-zinc-400">{profile.name.slice(0,1).toUpperCase()}</div>}
        <button onClick={() => inputRef.current?.click()} disabled={busy} className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-xl bg-black/70 py-1.5 text-[10px] font-bold text-white backdrop-blur" title="Upload profile picture"><Camera size={12} /> Change</button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadAvatar(file); e.currentTarget.value = ''; }} />
      </div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-bold text-white">{profile.name}</h3><span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">AUTHENTICATED ACCOUNT</span></div><p className="mt-1 truncate text-xs text-zinc-400">{email || 'Sign in to enable cloud social features'}</p></div>
      {email && <button onClick={() => void signOut()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-200 hover:bg-white/10"><LogOut size={14} /> Sign out</button>}
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-2 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Your SyncBeat ID</p><p className="mt-1 font-mono text-sm font-bold text-white">{myCode || 'Sign in to generate'}</p></div><button onClick={copyCode} disabled={!myCode} className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"><Copy size={15} /></button></div>
        <p className="text-[10px] leading-relaxed text-zinc-500">Use this ID to find you, send friend requests, and invite you into rooms.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Send friend request</p>
        <div className="flex gap-2"><input value={friendCode} onChange={(e) => setFriendCode(e.target.value)} placeholder="sb-xxxxxxxx" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white outline-none focus:border-rose-500/50" /><button onClick={() => void sendFriend()} disabled={busy || !friendCode.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500 text-white disabled:opacity-40"><UserPlus size={15} /></button></div>
      </div>
    </div>

    {message && <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-zinc-300"><ShieldCheck size={14} className="text-emerald-400" />{message}</div>}
    {busy && <div className="flex items-center gap-2 text-[10px] text-zinc-500"><Loader2 size={12} className="animate-spin" /> Working…</div>}
  </section>;
};
