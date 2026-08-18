import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Copy, DoorOpen, Loader2, LogOut, UserPlus, X } from 'lucide-react';
import { UserProfile } from '../types';
import { socialService, IncomingFriendRequest, IncomingRoomInvite } from '../services/socialService';
import { authService } from '../services/authService';
import { wsClient } from '../services/websocketClient';

export const SocialPanelV2: React.FC<{ profile: UserProfile; onUpdateProfile: (updated: Partial<UserProfile>) => void }> = ({ profile, onUpdateProfile }) => {
  const [myCode, setMyCode] = useState('');
  const [email, setEmail] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [friendRequests, setFriendRequests] = useState<IncomingFriendRequest[]>([]);
  const [roomInvites, setRoomInvites] = useState<IncomingRoomInvite[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (profile.name || 'Listener').trim().slice(0, 1).toUpperCase();

  const refresh = async () => {
    try {
      const [me, user] = await Promise.all([socialService.getMyProfile(), authService.getUser()]);
      setMyCode(me?.friendCode || '');
      setEmail(user?.email || '');
      if (user) {
        const [incomingFriends, incomingRooms] = await Promise.all([socialService.listIncomingFriendRequests(), socialService.listIncomingRoomInvites()]);
        setFriendRequests(incomingFriends);
        setRoomInvites(incomingRooms);
      } else {
        setFriendRequests([]);
        setRoomInvites([]);
      }
    } catch {
      // Auth/social may be unavailable; the profile itself remains usable.
    }
  };

  useEffect(() => { void refresh(); }, []);

  const uploadAvatar = async (file: File) => {
    setBusy(true);
    setMessage('');
    try {
      const url = await socialService.uploadAvatar(file);
      onUpdateProfile({ avatar: url });
      setMessage('Profile picture updated.');
    } catch (error: any) {
      setMessage(error?.message || 'Could not upload that image.');
    } finally { setBusy(false); }
  };

  const sendFriendRequest = async () => {
    if (!friendCode.trim()) return;
    setBusy(true); setMessage('');
    try {
      await socialService.sendFriendRequest(friendCode.trim());
      setFriendCode('');
      setMessage('Friend request sent.');
    } catch (error: any) {
      setMessage(error?.message || 'Could not send the request.');
    } finally { setBusy(false); }
  };

  const respondFriend = async (requestId: string, status: 'accepted' | 'declined') => {
    setBusy(true);
    try {
      await socialService.respondFriendRequest(requestId, status);
      await refresh();
      setMessage(status === 'accepted' ? 'Friend added.' : 'Request declined.');
    } finally { setBusy(false); }
  };

  const respondRoom = async (inviteId: string, roomId: string, status: 'accepted' | 'declined') => {
    setBusy(true);
    try {
      await socialService.respondRoomInvite(inviteId, status);
      if (status === 'accepted') wsClient.joinRoom(roomId, profile.name, profile.avatar);
      await refresh();
      setMessage(status === 'accepted' ? 'Joining room…' : 'Room invite declined.');
    } catch (error: any) {
      setMessage(error?.message || 'Could not respond to the invitation.');
    } finally { setBusy(false); }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await authService.signOut();
      setEmail(''); setMyCode(''); setFriendRequests([]); setRoomInvites([]); setMessage('Signed out.');
    } finally { setBusy(false); }
  };

  return <section className="space-y-5 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.06]">
        {profile.avatar ? <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-2xl font-semibold text-white">{initials}</div>}
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-xl bg-black/70 py-1.5 text-[10px] font-bold text-white backdrop-blur"><Camera size={12} /> Change</button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAvatar(file); event.currentTarget.value = ''; }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-semibold text-white">{profile.name}</h3>{email && <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">SIGNED IN</span>}</div>
        <p className="mt-1 truncate text-xs text-zinc-500">{email || 'Explore freely; sign in when you want cloud identity and social features.'}</p>
      </div>
      {email && <button onClick={() => void signOut()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-zinc-300 hover:bg-white/[0.07]"><LogOut size={14} /> Sign out</button>}
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">Your public identity</p>
        <div className="mt-2 flex items-center gap-2"><span className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-white">{myCode || 'Sign in to create your SyncBeat ID'}</span><button onClick={() => myCode && navigator.clipboard?.writeText(myCode)} disabled={!myCode} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><Copy size={15} /></button></div>
        <p className="mt-2 text-[10px] leading-5 text-zinc-600">Use your SyncBeat ID to find friends and receive room invitations.</p>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">Add a friend</p>
        <div className="mt-2 flex gap-2"><input value={friendCode} onChange={(event) => setFriendCode(event.target.value)} placeholder="sb-xxxxxxxx" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white outline-none focus:border-white/20" /><button onClick={() => void sendFriendRequest()} disabled={busy || !friendCode.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-black disabled:opacity-40"><UserPlus size={15} /></button></div>
      </div>
    </div>

    {(friendRequests.length > 0 || roomInvites.length > 0) && <div className="grid gap-4 md:grid-cols-2">
      {friendRequests.length > 0 && <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">Friend requests</p><div className="space-y-2">{friendRequests.map((request) => <div key={request.id} className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-2"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">{(request.profile?.displayName || 'U').slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{request.profile?.displayName || 'Listener'}</p><p className="text-[9px] text-zinc-600">{request.profile?.friendCode || ''}</p></div><button onClick={() => void respondFriend(request.id, 'accepted')} className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><Check size={14} /></button><button onClick={() => void respondFriend(request.id, 'declined')} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] text-zinc-500"><X size={14} /></button></div>)}</div></div>}
      {roomInvites.length > 0 && <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">Room invitations</p><div className="space-y-2">{roomInvites.map((invite) => <div key={invite.id} className="rounded-xl bg-white/[0.04] p-3"><div className="flex items-center gap-2"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">{(invite.profile?.displayName || 'U').slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{invite.profile?.displayName || 'Listener'} invited you</p><p className="truncate font-mono text-[9px] text-zinc-600">{invite.roomId}</p></div></div><div className="mt-2 flex gap-2"><button onClick={() => void respondRoom(invite.id, invite.roomId, 'accepted')} className="flex-1 rounded-lg bg-white py-2 text-[10px] font-bold text-black"><DoorOpen size={12} className="mr-1 inline" /> Join room</button><button onClick={() => void respondRoom(invite.id, invite.roomId, 'declined')} className="rounded-lg bg-white/[0.04] px-3 py-2 text-[10px] font-bold text-zinc-500">Decline</button></div></div>)}</div></div>}
    </div>}

    {message && <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-zinc-300">{message}</div>}
    {busy && <div className="flex items-center gap-2 text-[10px] text-zinc-600"><Loader2 size={12} className="animate-spin" /> Updating…</div>}
  </section>;
};
