import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Users, Radio, Send, Sparkles, Copy, Check, Crown, Play, Pause, SkipForward, Plus, Music, MessageSquare, Wifi, LogOut, UserCog, Link2 } from 'lucide-react';
import { RoomState, Song, SupportedLanguage, ExperienceMode } from '../../types';
import { translations } from '../../data/translations';
import { wsClient } from '../../services/websocketClient';

interface SessionsViewProps {
  room: RoomState | null;
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onSelectSong: (song: Song) => void;
  availableSongs: Song[];
  currentUser: { id: string; name: string; avatar: string };
  onCreateRoom: (customName: string, mood: string, isPrivate?: boolean) => void;
  onJoinRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
  onOpenLyrics: () => void;
  language: SupportedLanguage;
  latencyMs: number;
}

const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-35';

export const SessionsView: React.FC<SessionsViewProps> = ({
  room,
  currentSong,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onSelectSong,
  availableSongs,
  currentUser,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onOpenLyrics,
  language,
  latencyMs,
}) => {
  const t = translations[language] || translations.en;
  const [localRoom, setLocalRoom] = useState<RoomState | null>(room);
  const [localSong, setLocalSong] = useState<Song | null>(currentSong);
  const [localPlaying, setLocalPlaying] = useState(isPlaying);
  const [roomName, setRoomName] = useState('');
  const [mood, setMood] = useState<ExperienceMode>('love');
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [chat, setChat] = useState('');
  const [copied, setCopied] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  const effectiveRoom = localRoom || room;
  const effectiveSong = localSong || currentSong;
  const effectivePlaying = effectiveRoom ? localPlaying : isPlaying;
  const isHost = Boolean(effectiveRoom && effectiveRoom.hostId === currentUser.id);

  useEffect(() => setLocalRoom(room), [room]);
  useEffect(() => { if (currentSong) setLocalSong(currentSong); }, [currentSong]);
  useEffect(() => setLocalPlaying(isPlaying), [isPlaying]);

  useEffect(() => {
    const unsub = wsClient.addListener((event) => {
      if (event.type === 'ROOM_SYNC_STATE') {
        const next = event.payload as RoomState;
        setLocalRoom(next);
        if (next.currentSong) setLocalSong(next.currentSong);
        setLocalPlaying(Boolean(next.isPlaying));
      } else if (event.type === 'PARTICIPANT_JOINED' || event.type === 'PARTICIPANT_LEFT' || event.type === 'HOST_CHANGED') {
        setLocalRoom((prev) => prev ? ({ ...prev, hostId: event.payload?.newHostId || event.payload?.hostId || prev.hostId, participants: event.payload?.participants || prev.participants, chatMessages: event.payload?.systemMessage ? [...prev.chatMessages, event.payload.systemMessage].slice(-80) : prev.chatMessages }) : prev);
      } else if (event.type === 'RECEIVE_CHAT' || event.type === 'NEW_CHAT_MESSAGE') {
        setLocalRoom((prev) => prev ? ({ ...prev, chatMessages: [...prev.chatMessages, event.payload].slice(-80) }) : prev);
      } else if (event.type === 'PLAYBACK_SYNC') {
        if (event.payload?.song) setLocalSong(event.payload.song as Song);
        setLocalPlaying(Boolean(event.payload?.isPlaying));
        setLocalRoom((prev) => prev ? ({ ...prev, currentSongId: event.payload?.songId || prev.currentSongId, currentSong: event.payload?.song || prev.currentSong, isPlaying: Boolean(event.payload?.isPlaying), playbackPosition: Number(event.payload?.position || 0), playbackRate: Number(event.payload?.playbackRate || 1), lastStateUpdate: Number(event.payload?.lastStateUpdate || Date.now()) }) : prev);
      }
    });
    const onRoomPlayback = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.song) setLocalSong(detail.song as Song);
      setLocalPlaying(Boolean(detail?.isPlaying));
    };
    window.addEventListener('syncbeat:room-playback', onRoomPlayback);
    return () => { unsub(); window.removeEventListener('syncbeat:room-playback', onRoomPlayback); };
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [effectiveRoom?.chatMessages.length]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedRoom = params.get('room');
    if (linkedRoom && !effectiveRoom) {
      setJoinCode(linkedRoom);
      onJoinRoom(linkedRoom);
    }
  }, []);

  const create = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = roomName.trim();
    if (!clean) return;
    onCreateRoom(clean, mood, isPrivate);
    setRoomName('');
  };

  const join = () => { const value = joinCode.trim(); if (value) onJoinRoom(value); };

  const copyInvite = async () => {
    if (!effectiveRoom) return;
    const invite = `${window.location.origin}/?room=${encodeURIComponent(effectiveRoom.roomId)}`;
    try { await navigator.clipboard.writeText(invite); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const sendChat = (event: React.FormEvent) => {
    event.preventDefault();
    const text = chat.trim();
    if (!text || !effectiveRoom) return;
    wsClient.sendChatMessage(text);
    setChat('');
  };

  const queueSongs = useMemo(() => {
    const ids = new Set(effectiveRoom?.queue || []);
    return availableSongs.filter((song) => ids.has(song.id));
  }, [availableSongs, effectiveRoom?.queue]);

  if (effectiveRoom) {
    return (
      <div className="space-y-5 pb-10">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-rose-950/40 via-zinc-950/80 to-purple-950/30 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-300"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> LIVE SESSION <span className="font-mono text-zinc-500">{effectiveRoom.roomId}</span></div>
              <h1 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">{effectiveRoom.roomName}</h1>
              <p className="mt-1 text-xs text-zinc-400">{effectiveRoom.participants.length} listener{effectiveRoom.participants.length === 1 ? '' : 's'} · <span className="text-emerald-400">{latencyMs}ms sync</span> · {isHost ? 'You are hosting' : `Hosted by ${effectiveRoom.participants.find((p) => p.id === effectiveRoom.hostId)?.name || 'another listener'}`}</p>
            </div>
            <div className="flex flex-wrap gap-2"><button className={button} onClick={copyInvite}>{copied ? <Check size={14} className="text-emerald-400" /> : <Link2 size={14} />}{copied ? 'Copied' : 'Invite link'}</button><button className={button} onClick={onLeaveRoom}><LogOut size={14} /> Leave</button></div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              {effectiveSong ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <img src={effectiveSong.coverArt} alt="" referrerPolicy="no-referrer" className="h-24 w-24 rounded-2xl object-cover ring-1 ring-white/10" />
                  <div className="min-w-0 flex-1"><span className="text-[10px] font-bold uppercase tracking-widest text-rose-300">Now playing together</span><h2 className="mt-1 truncate text-lg font-bold text-white">{effectiveSong.title}</h2><p className="truncate text-sm text-zinc-400">{effectiveSong.artist}</p><button className="mt-3 text-xs font-semibold text-rose-300 hover:text-white" onClick={onOpenLyrics}>Open lyrics</button></div>
                  {isHost && <div className="flex shrink-0 items-center gap-2"><button onClick={onTogglePlay} className="grid h-11 w-11 place-items-center rounded-full bg-white text-black shadow-xl" aria-label={effectivePlaying ? 'Pause session' : 'Play session'}>{effectivePlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}</button><button onClick={onNextTrack} className={button} aria-label="Next track"><SkipForward size={17} /></button></div>}
                </div>
              ) : <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center"><Music className="mx-auto mb-2 text-zinc-600" size={26} /><p className="text-sm font-semibold text-zinc-300">No track selected</p><p className="mt-1 text-xs text-zinc-500">The host can select a real YouTube track below.</p></div>}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-white">Listeners</span><Wifi size={14} className="text-emerald-400" /></div><div className="space-y-2">{effectiveRoom.participants.map((p) => <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white/[.04] p-2"><div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-xs font-bold text-white">{p.avatar ? <img src={p.avatar} alt="" className="h-full w-full object-cover" /> : p.name.slice(0, 1).toUpperCase()}</div><span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">{p.name}{p.id === currentUser.id ? ' (You)' : ''}</span>{p.isHost ? <Crown size={13} className="text-amber-400" /> : isHost ? <button onClick={() => wsClient.transferHost(p.id)} className="text-[10px] text-zinc-400 hover:text-white" title="Transfer hosting"><UserCog size={13} /></button> : null}</div>)}</div></div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-white"><Music size={16} className="text-rose-400" /> Shared queue</h2><span className="text-[10px] text-zinc-500">{isHost ? 'You control playback' : 'Host controls playback'}</span></div>
            {queueSongs.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-zinc-500">Search a real YouTube track and the host can add/play it here.</div> : <div className="space-y-2">{queueSongs.map((song) => <div key={song.id} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[.03] p-2"><img src={song.coverArt} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-white">{song.title}</span><span className="block truncate text-[10px] text-zinc-500">{song.artist}</span></span>{isHost && <button onClick={() => onSelectSong(song)} className={button}><Play size={13} /> Play</button>}</div>)}</div>}
            {isHost && <div className="mt-4 grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">{availableSongs.filter((s) => !effectiveRoom.queue.includes(s.id)).slice(0, 20).map((song) => <button key={song.id} onClick={() => onSelectSong(song)} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/5 bg-white/[.03] p-2 text-left hover:bg-white/[.07]"><img src={song.coverArt} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-white">{song.title}</span><span className="block truncate text-[10px] text-zinc-500">{song.artist}</span></span><Plus size={14} className="shrink-0 text-zinc-500" /></button>)}</div>}
          </section>

          <section className="flex min-h-[430px] flex-col rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3"><MessageSquare size={16} className="text-purple-300" /><span className="text-sm font-bold text-white">Live chat</span></div><div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">{(effectiveRoom.chatMessages || []).map((message) => <div key={message.id} className="rounded-xl bg-white/[.05] p-2"><div className="mb-0.5 flex items-center gap-2"><span className="text-[10px] font-semibold text-zinc-300">{message.senderName}</span><span className="text-[9px] text-zinc-600">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><p className="break-words text-xs text-white">{message.text}</p></div>)}<div ref={chatEnd} /></div><form onSubmit={sendChat} className="relative mt-3"><input value={chat} onChange={(e) => setChat(e.target.value)} placeholder="Say something…" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 pr-10 text-xs text-white outline-none focus:border-rose-500/50" /><button disabled={!chat.trim()} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-lg bg-rose-500 text-white disabled:opacity-30"><Send size={13} /></button></form></section>
        </div>
      </div>
    );
  }

  return <div className="space-y-6 pb-12"><section className="rounded-3xl border border-white/10 bg-gradient-to-br from-rose-950/40 via-zinc-950/80 to-purple-950/30 p-6 sm:p-8"><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-300"><Radio size={13} /> Listen together</div><h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">Create a real listening session.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">Share one link, get the same room state, chat live, transfer hosting, and keep playback synchronized across every joined device.</p></section>
    <div className="grid gap-5 lg:grid-cols-2"><form onSubmit={create} className="rounded-3xl border border-white/10 bg-white/[.025] p-5 sm:p-6"><div className="mb-5"><h2 className="flex items-center gap-2 text-base font-bold text-white"><Sparkles size={17} className="text-rose-400" /> Create session</h2><p className="mt-1 text-xs text-zinc-500">You'll become the host.</p></div><label className="mb-1.5 block text-xs font-semibold text-zinc-300">Session name</label><input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Late night Bollywood 💕" className="mb-4 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-rose-500/50" required /><div className="mb-4 grid grid-cols-2 gap-2">{([['love','Love & Couple 💕'],['focus','Study & Focus ☕'],['gym','Gym ⚡'],['friends','Friends 🪩']] as const).map(([id,label]) => <button type="button" key={id} onClick={() => setMood(id)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${mood === id ? 'border-rose-500 bg-rose-500 text-white' : 'border-white/10 bg-white/[.03] text-zinc-400'}`}>{label}</button>)}</div><button type="button" onClick={() => setIsPrivate((v) => !v)} className="mb-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[.03] p-3 text-left"><span className="text-xs text-white">{isPrivate ? 'Private session' : 'Public session'}</span><span className={`h-5 w-9 rounded-full p-0.5 ${isPrivate ? 'bg-rose-500' : 'bg-white/15'}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-4' : ''}`} /></span></button><button disabled={!roomName.trim()} className="w-full rounded-xl bg-rose-500 py-3 text-sm font-bold text-white disabled:opacity-30">Launch session</button></form>
      <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5 sm:p-6"><div className="mb-5"><h2 className="flex items-center gap-2 text-base font-bold text-white"><Users size={17} className="text-purple-300" /> Join session</h2><p className="mt-1 text-xs text-zinc-500">Paste a room code or the shared URL.</p></div><input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="room-abc123 or https://…?room=room-abc123" className="mb-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 font-mono text-xs text-white outline-none focus:border-purple-500/50" /><button onClick={join} disabled={!joinCode.trim()} className="w-full rounded-xl border border-white/10 bg-white/10 py-3 text-sm font-bold text-white disabled:opacity-30">Join room</button><div className="mt-5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[.04] p-4 text-xs text-zinc-400">Join links are deep links to the same room. Every member receives the same room state, queue, host status, chat and playback timeline.</div></div>
    </div>
  </div>;
};