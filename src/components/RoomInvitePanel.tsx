import React, { useState } from 'react';
import { Send, UserPlus, Loader2 } from 'lucide-react';
import { socialService } from '../services/socialService';
import { RoomState } from '../types';

export const RoomInvitePanel: React.FC<{ room: RoomState }> = ({ room }) => {
  const [code, setCode] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const sendInvite = async () => { setBusy(true); setMessage(''); try { await socialService.sendRoomInvite(room.roomId, code); setMessage('Invitation sent.'); setCode(''); } catch (error: any) { setMessage(error?.message || 'Could not send room invitation.'); } finally { setBusy(false); } };
  return <section className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="mb-3 flex items-center gap-2"><UserPlus size={15} className="text-rose-400" /><div><h3 className="text-xs font-bold text-white">Invite someone by SyncBeat ID</h3><p className="text-[10px] text-zinc-500">They'll receive a room invitation in their profile.</p></div></div><div className="flex gap-2"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="sb-xxxxxxxx" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-white outline-none focus:border-rose-500/50" /><button onClick={() => void sendInvite()} disabled={busy || !code.trim()} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-rose-500 px-3 text-xs font-bold text-white disabled:opacity-40">{busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send</button></div>{message && <p className="mt-2 text-[10px] text-emerald-300">{message}</p>}</section>;
};