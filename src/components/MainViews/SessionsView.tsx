import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Radio,
  Send,
  Sparkles,
  Copy,
  Check,
  Share2,
  Volume2,
  Crown,
  Play,
  Pause,
  SkipForward,
  Plus,
  QrCode,
  Flame,
  Heart,
  Music,
  Smile,
  Timer,
  Clock,
  Lock,
  Globe,
  Sliders,
  ThumbsUp,
  X,
  MessageSquare,
} from 'lucide-react';
import { RoomState, Song, ChatMessage, FloatingReaction, SupportedLanguage, ExperienceMode } from '../../types';
import { translations } from '../../data/translations';
import { wsClient } from '../../services/websocketClient';
import { audioEngine } from '../../services/audioEngine';
import confetti from 'canvas-confetti';
import { GlassIcon } from '../GlassIcon';
import { AudioVisualizer } from '../AudioVisualizer';

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
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMood, setNewRoomMood] = useState<ExperienceMode>('love');
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [songVotes, setSongVotes] = useState<Record<string, number>>({});
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const t = translations[language] || translations.en;

  const isHost = room ? room.hostId === currentUser.id : false;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.chatMessages]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !room) return;
    wsClient.sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleSendReaction = (emoji: string, soundEffect?: string) => {
    if (!room) return;
    wsClient.burstReaction(emoji, soundEffect);
    if (soundEffect) {
      audioEngine.playReactionSound(soundEffect);
    }
    confetti({
      particleCount: 20,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  const handleSendMoment = (emoji: string) => {
    if (!room || !currentSong) return;
    const timeFormatted = `${Math.floor(room.playbackPosition / 60)}:${Math.floor(room.playbackPosition % 60).toString().padStart(2, '0')}`;
    wsClient.sendChatMessage(`${emoji} Moment at ${timeFormatted} • ${currentSong.title}`);
    handleSendReaction(emoji);
  };

  const handleCopyInvite = () => {
    if (!room) return;
    const url = `${window.location.origin}?room=${room.roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    onCreateRoom(newRoomName.trim(), newRoomMood, isPrivateRoom);
    setNewRoomName('');
  };

  const activeHubRooms = [
    {
      id: 'room-delhi-lofi',
      name: 'Delhi Monsoon Chai & Code ☕',
      listeners: 18,
      songTitle: 'Midnight Chai & Sitar Lofi',
      host: 'Aarav (DJ)',
      mood: 'study',
      cover: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'room-couple-drive',
      name: 'Midnight Highway & Bollywood Romance 💕',
      listeners: 12,
      songTitle: 'Tum Hi Ho • Aashiqui 2',
      host: 'Rohan & Priya',
      mood: 'love',
      cover: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'room-beast-workout',
      name: 'Heavy Deadlift 140+ BPM Gym Phonk ⚡',
      listeners: 24,
      songTitle: 'Zinda Phonk • Beast Anthem',
      host: 'Vikram',
      mood: 'gym',
      cover: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'room-south-party',
      name: 'Chennai Kuthu & Telugu Hits 🪩',
      listeners: 31,
      songTitle: 'Arabic Kuthu • Beast',
      host: 'Karthik',
      mood: 'friends',
      cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    },
  ];

  // ----------------------------------------------------
  // VIEW A: USER IS INSIDE AN ACTIVE SYNC ROOM
  // ----------------------------------------------------
  if (room) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        {/* Top Room Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-950/40 via-zinc-950/60 to-purple-950/40 border border-white/10 backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Real-Time Listening Room
                </span>
                <span className="text-xs font-mono text-zinc-400">#{room.roomId}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{room.roomName}</h1>
              <p className="text-xs text-zinc-400 flex items-center gap-2">
                <span>{room.participants.length} Active Listeners</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">Sync Latency: {latencyMs}ms</span>
              </p>
            </div>

            {/* Room Controls: Invite, QR, Leave */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all"
              >
                {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Link Copied!' : 'Invite Friends'}</span>
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-zinc-300 hover:text-white transition-all"
                title="Scan QR Code to join on Mobile"
              >
                <QrCode size={16} />
              </button>

              <button
                onClick={onLeaveRoom}
                className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-xs font-semibold text-red-300 transition-all"
              >
                Leave Room
              </button>
            </div>
          </div>

          {/* Active Synced Track Box */}
          {currentSong && (
            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full md:w-auto">
                <img
                  src={currentSong.coverArt}
                  alt={currentSong.title}
                  className="w-16 h-16 rounded-xl object-cover border border-white/20 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Now Synced
                    </span>
                    <span className="text-[10px] text-zinc-400">{currentSong.languageLabel}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">{currentSong.title}</h3>
                  <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
                </div>
              </div>

              {/* Host Playback Controls */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {isHost && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onTogglePlay}
                      className="p-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 transition-all"
                      title={isPlaying ? 'Pause for all' : 'Play for all'}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                    </button>
                    <button
                      onClick={onNextTrack}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 transition-all"
                      title="Next Track"
                    >
                      <SkipForward size={16} />
                    </button>
                  </div>
                )}

                <button
                  onClick={onOpenLyrics}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-zinc-200 transition-all"
                >
                  <span>Live Lyrics</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Room Grid: Left Collaborative Queue & Right Synchronized Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Collaborative Queue (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Music size={18} className="text-rose-400" />
                <span>Collaborative Queue</span>
              </h2>
              <span className="text-xs text-zinc-400">Listeners can vote or request tracks</span>
            </div>

            {/* Song Request Picker */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-3">
              <span className="text-xs font-bold text-zinc-300">Add Track to Room Queue</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {availableSongs.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (isHost) onSelectSong(s);
                      else wsClient.sendChatMessage(`Requested track: ${s.title}`);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={s.coverArt} alt={s.title} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{s.title}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{s.artist}</p>
                      </div>
                    </div>
                    <Plus size={14} className="text-zinc-400 hover:text-rose-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Synced Listeners Stack */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  Synced Participants ({room.participants.length})
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">100% In-Sync</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {room.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5"
                  >
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                        {p.isHost && <Crown size={11} className="text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">Device Synced</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Synchronized Live Chat & Reactions (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col h-[520px] rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-rose-400" />
                <span className="text-xs font-bold text-white">Live Room Chat</span>
              </div>
              <span className="text-[10px] text-zinc-400">Timestamp moments & reactions</span>
            </div>

            {/* Quick Moment Tagger */}
            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-white/5 border border-white/10">
              {['❤️', '🔥', '✨', '😭', '🙌'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendMoment(emoji)}
                  className="flex-1 py-1 text-sm rounded-lg hover:bg-white/15 transition-all text-center"
                  title="Tag moment in song"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
              {room.chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="font-bold text-zinc-300">{msg.senderName}</span>
                    <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-white break-words">{msg.text}</p>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Send Chat Bar */}
            <form onSubmit={handleSendChat} className="relative pt-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send a vibe message or song reaction..."
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-rose-500/50 text-xs text-white placeholder-zinc-400 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="absolute right-1.5 top-2.5 p-1 rounded-lg bg-rose-500 text-white disabled:opacity-30 transition-opacity"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>

        {/* QR Code Invite Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/20 p-6 text-center space-y-4">
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
              <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <QrCode size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Join {room.roomName}</h3>
              <p className="text-xs text-zinc-400">
                Scan with any phone camera to instantly synchronize playback and reactions.
              </p>
              <div className="p-4 rounded-2xl bg-white flex items-center justify-center">
                {/* Visual QR Simulation */}
                <div className="w-44 h-44 bg-zinc-900 rounded-lg p-2 flex flex-col items-center justify-center text-white text-[11px] font-mono border-4 border-dashed border-rose-500">
                  <Radio size={32} className="text-rose-400 mb-1 animate-pulse" />
                  <span className="font-bold text-xs">SyncBeat Room</span>
                  <span>Code: {room.roomId}</span>
                  <span className="text-[9px] text-zinc-400 mt-1">Point camera to join</span>
                </div>
              </div>
              <button
                onClick={handleCopyInvite}
                className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-md"
              >
                {copiedLink ? 'Link Copied!' : 'Copy Session Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW B: SESSIONS HUB & ROOM CREATOR / JOINER LOBBY
  // ----------------------------------------------------
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-950/40 via-zinc-950/60 to-purple-950/40 border border-white/10 backdrop-blur-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          <Users size={14} />
          <span>Real-Time Social Listening Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Listen Together in Near-Instant Sync
        </h1>
        <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
          Create a private session for your partner, launch a gym beast room, or join thousands of listeners in live Indian Bollywood and Lofi rooms.
        </p>
      </div>

      {/* 2-Column: Create New Room (Left) & Join via Code (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Room Form */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-rose-400" />
              <span>Create New Sync Room</span>
            </h2>
            <p className="text-xs text-zinc-400">Set up your shared listening space and invite friends</p>
          </div>

          <form onSubmit={handleCreateNewRoom} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Room Name</label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Late Night Bollywood Drive 💕, Chai & Study ☕"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-rose-500/50 text-xs sm:text-sm text-white placeholder-zinc-400 outline-none transition-all"
                required
              />
            </div>

            {/* Atmosphere Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Atmosphere Theme</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'love', label: 'Love & Couple 💕' },
                  { id: 'focus', label: 'Study & Focus ☕' },
                  { id: 'gym', label: 'Gym Beast ⚡' },
                  { id: 'friends', label: 'Social Party 🪩' },
                ].map((theme) => (
                  <button
                    type="button"
                    key={theme.id}
                    onClick={() => setNewRoomMood(theme.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center truncate ${
                      newRoomMood === theme.id
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2.5">
                {isPrivateRoom ? <Lock size={16} className="text-rose-400" /> : <Globe size={16} className="text-emerald-400" />}
                <div>
                  <p className="text-xs font-bold text-white">
                    {isPrivateRoom ? 'Private Session (Invite Only)' : 'Public Room (Visible in Lobby)'}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {isPrivateRoom ? 'Only friends with link or PIN can join' : 'Anyone can discover and vibe with you'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivateRoom(!isPrivateRoom)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isPrivateRoom ? 'bg-rose-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    isPrivateRoom ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={!newRoomName.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition-all disabled:opacity-40"
            >
              Launch Room as DJ Host
            </button>
          </form>
        </div>

        {/* Join by Code Form */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Radio size={18} className="text-purple-400" />
                <span>Join with Session Code</span>
              </h2>
              <p className="text-xs text-zinc-400">Enter a 6-digit room PIN or paste an invitation link</p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="e.g. 748291 or room link"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 text-sm text-white placeholder-zinc-400 font-mono outline-none transition-all"
              />
              <button
                onClick={() => {
                  if (joinCodeInput.trim()) onJoinRoom(joinCodeInput.trim());
                }}
                disabled={!joinCodeInput.trim()}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all disabled:opacity-40"
              >
                Connect to Stream
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 text-xs text-zinc-300 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Low-Latency Adaptive Sync</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              SyncBeat automatically calculates round-trip network ping to keep all devices tightly aligned within 20 milliseconds.
            </p>
          </div>
        </div>
      </div>

      {/* Public Live Rooms Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Active Public Listening Rooms</h2>
            <p className="text-xs text-zinc-400">Drop in and vibe with listeners in real time</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeHubRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onJoinRoom(room.id)}
              className="group p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-rose-500/40 backdrop-blur-xl cursor-pointer transition-all space-y-3"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/15">
                <img
                  src={room.cover}
                  alt={room.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 border border-white/20">
                  <Users size={11} />
                  <span>{room.listeners} Live</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors truncate">
                  {room.name}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">{room.songTitle}</p>
                <p className="text-[10px] text-zinc-400 mt-1">Host: {room.host}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-rose-400">
                <span>Join & Vibe</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
