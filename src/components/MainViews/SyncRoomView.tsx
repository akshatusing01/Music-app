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
} from 'lucide-react';
import { RoomState, Song, ChatMessage, FloatingReaction, SupportedLanguage } from '../../types';
import { translations } from '../../data/translations';
import { wsClient } from '../../services/websocketClient';
import { audioEngine } from '../../services/audioEngine';
import confetti from 'canvas-confetti';

interface SyncRoomViewProps {
  room: RoomState | null;
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onSelectSong: (song: Song) => void;
  availableSongs: Song[];
  currentUser: { id: string; name: string; avatar: string };
  onCreateRoom: (customName: string, mood: string) => void;
  onJoinRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
  language: SupportedLanguage;
  latencyMs: number;
}

export const SyncRoomView: React.FC<SyncRoomViewProps> = ({
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
  language,
  latencyMs,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMood, setNewRoomMood] = useState('romance');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const t = translations[language] || translations.en;

  const isHost = room ? room.hostId === currentUser.id : false;

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.chatMessages]);

  // Clean up floating reactions after 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setFloatingReactions((prev) => prev.filter((r) => now - r.createdAt < 3500));
    }, 500);
    return () => clearInterval(timer);
  }, []);

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

    const newReaction: FloatingReaction = {
      id: 'reaction-' + Date.now() + '-' + Math.random(),
      emoji,
      senderName: currentUser.name,
      x: 0.15 + Math.random() * 0.7,
      createdAt: Date.now(),
    };

    setFloatingReactions((prev) => [...prev, newReaction]);

    // Micro confetti on fire or heart burst
    if (emoji === '🔥' || emoji === '🎉') {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const handleCopyInvite = () => {
    if (!room) return;
    const shareUrl = `${window.location.origin}?room=${room.roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // If not currently in a room, display the Room Browser & Creation Screen
  if (!room) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-32">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            <Radio size={14} className="animate-pulse" />
            <span>Cross-Device Real-Time Sync</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Listen Together in Real-Time
          </h1>
          <p className="text-zinc-300 text-sm max-w-lg mx-auto">
            Sync exact audio timestamps across multiple phones, laptops, and tablets with zero lag. Chat, share instant soundboard drops, and vibe together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create New Room Card */}
          <div className="rounded-3xl p-6 border border-white/15 bg-zinc-900/70 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Radio size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{t.createRoom}</h3>
                <p className="text-xs text-zinc-400">Become the DJ and host your friends</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Room Name</label>
                <input
                  id="input-create-room-name"
                  type="text"
                  placeholder="e.g. Late Night Bollywood Chai ☕"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:border-rose-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Mood Theme</label>
                <select
                  id="select-create-room-mood"
                  value={newRoomMood}
                  onChange={(e) => setNewRoomMood(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-white/15 text-sm text-white focus:border-rose-500/50 outline-none"
                >
                  <option value="romance">Couple & Bollywood Romance 💕</option>
                  <option value="gym">Desi Gym Beast Mode ⚡</option>
                  <option value="study">Midnight Study & Focus ☕</option>
                  <option value="party">Desi Party & Kuthu 🪩</option>
                  <option value="devotional">Sufi Peace & Zen 🕊️</option>
                </select>
              </div>

              <button
                id="btn-confirm-create-room"
                onClick={() => onCreateRoom(newRoomName || 'Vibe Jam Room', newRoomMood)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-rose-500/30 transition-all"
              >
                Create Room & Start DJing
              </button>
            </div>
          </div>

          {/* Join with Room Code */}
          <div className="rounded-3xl p-6 border border-white/15 bg-zinc-900/70 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{t.joinRoom}</h3>
                <p className="text-xs text-zinc-400">Enter a 6-letter room code or link</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Room Code / Link</label>
                <input
                  id="input-join-room-code"
                  type="text"
                  placeholder="e.g. BOLLY-LOVE or GYM-BEAST"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white font-mono uppercase focus:border-indigo-500/50 outline-none"
                />
              </div>

              <button
                id="btn-confirm-join-room"
                onClick={() => {
                  if (joinCodeInput.trim()) onJoinRoom(joinCodeInput.trim());
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all"
              >
                Join Room
              </button>
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="text-[11px] font-semibold text-zinc-400 mb-2">Quick Featured Rooms:</p>
              <div className="flex flex-wrap gap-2">
                {['BOLLY-LOVE', 'GYM-BEAST', 'STUDY-CHAI', 'DESI-PARTY'].map((code) => (
                  <button
                    key={code}
                    onClick={() => onJoinRoom(code)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-rose-300 transition-colors"
                  >
                    #{code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Sync Room Screen
  return (
    <div className="relative max-w-7xl mx-auto space-y-6 pb-32">
      {/* Floating Reactions Rendering Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute bottom-20 animate-float-reaction flex flex-col items-center gap-1 text-4xl filter drop-shadow-xl"
            style={{ left: `${reaction.x * 100}%` }}
          >
            <span>{reaction.emoji}</span>
            <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full backdrop-blur-md">
              {reaction.senderName}
            </span>
          </div>
        ))}
      </div>

      {/* Room Header Card */}
      <div className="rounded-3xl p-4 sm:p-6 border border-white/15 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Radio size={24} className="animate-pulse" />
            <span className="absolute -bottom-1 -right-1 text-xs">✨</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">{room.roomName}</h2>
              <span className="px-2 py-0.5 rounded-full font-mono text-xs font-bold bg-white/10 text-rose-300 border border-rose-500/30">
                #{room.roomId}
              </span>
              {isHost && (
                <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Crown size={12} /> DJ / Host
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {latencyMs}ms Sync Latency
              </span>
              <span>•</span>
              <span>{room.participants.length} Active Listeners</span>
            </div>
          </div>
        </div>

        {/* Room Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            id="btn-copy-room-link"
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all"
          >
            {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            id="btn-show-room-qr"
            onClick={() => setShowQrModal(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all"
            title="Show Room QR Code"
          >
            <QrCode size={16} />
          </button>

          <button
            id="btn-leave-room"
            onClick={onLeaveRoom}
            className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-semibold transition-all"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Grid: Left (Now Playing & Queue) / Right (Live Chat & Soundboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Currently Playing + Synced Queue */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Synced Song Stage */}
          <div className="rounded-3xl p-5 border border-white/15 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-rose-400 tracking-wider">
                DJ Broadcast Active
              </span>
              {isHost ? (
                <span className="text-xs text-amber-300 font-medium">You control the music for everyone</span>
              ) : (
                <span className="text-xs text-zinc-400 font-medium">Listening in sync with DJ</span>
              )}
            </div>

            {currentSong ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={currentSong.coverArt}
                  alt={currentSong.title}
                  referrerPolicy="no-referrer"
                  className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border border-white/20 shadow-2xl ${
                    isPlaying ? 'ring-4 ring-rose-500/50' : ''
                  }`}
                />
                <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-white truncate">
                      {currentSong.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-zinc-300 border border-white/20">
                      {currentSong.languageLabel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300">{currentSong.artist}</p>
                  <p className="text-xs text-zinc-400">{currentSong.album}</p>

                  {/* DJ Host Playback Controls */}
                  <div className="pt-3 flex items-center justify-center sm:justify-start gap-3">
                    <button
                      id="btn-room-dj-play-pause"
                      onClick={onTogglePlay}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                      <span>{isPlaying ? 'Pause for Room' : 'Play for Room'}</span>
                    </button>

                    <button
                      id="btn-room-dj-next"
                      onClick={onNextTrack}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-all"
                      title="Next in Queue"
                    >
                      <SkipForward size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-400">
                <Music size={32} className="mx-auto mb-2 opacity-50" />
                <p>No song currently broadcasting in this room.</p>
              </div>
            )}
          </div>

          {/* Active Participants Avatars */}
          <div className="rounded-3xl p-5 border border-white/15 bg-zinc-900/60 backdrop-blur-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Users size={16} className="text-indigo-400" />
                <span>Connected Listeners ({room.participants.length})</span>
              </h3>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {room.participants.map((p) => {
                const isThisHost = p.id === room.hostId;
                const isMe = p.id === currentUser.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all ${
                      isThisHost
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                        : isMe
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                        : 'bg-white/5 border-white/10 text-zinc-300'
                    }`}
                  >
                    <span className="text-base">{p.avatar}</span>
                    <span className="text-xs font-semibold">{p.name} {isMe && '(You)'}</span>
                    {isThisHost && <Crown size={12} className="text-amber-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Queue & Quick Song Switch */}
          <div className="rounded-3xl p-5 border border-white/15 bg-zinc-900/60 backdrop-blur-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Music size={16} className="text-rose-400" />
                <span>Up Next Queue</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {availableSongs.slice(0, 6).map((song) => (
                <div
                  key={song.id}
                  onClick={() => onSelectSong(song)}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={song.coverArt}
                      alt={song.title}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{song.title}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{song.artist}</div>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-rose-400 hover:text-rose-300 shrink-0">
                    Play Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Real-Time Live Chat & Soundboard */}
        <div className="lg:col-span-5 flex flex-col h-[580px] rounded-3xl border border-white/15 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
              <Smile size={16} className="text-rose-400" />
              <h3 className="font-bold text-sm text-white">Live Room Reactions & Chat</h3>
            </div>
            <span className="text-[10px] text-zinc-400">Instant Broadcast</span>
          </div>

          {/* Interactive Soundboard & Emoji Reaction Burst Bar */}
          <div className="p-3 border-b border-white/10 bg-black/40 space-y-2">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Reaction Soundboard</span>
              <span className="text-rose-400">Click to Burst</span>
            </div>

            {/* Quick Emojis */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none py-1">
              {[
                { emoji: '💕', sound: 'heart' },
                { emoji: '🔥', sound: 'fire' },
                { emoji: '⚡', sound: 'bass' },
                { emoji: '🥁', sound: 'dholak' },
                { emoji: '🎉', sound: 'cheer' },
                { emoji: '😭', sound: 'sparkle' },
                { emoji: '💯', sound: 'bass' },
                { emoji: '🙏', sound: 'sparkle' },
              ].map((item) => (
                <button
                  key={item.emoji}
                  onClick={() => handleSendReaction(item.emoji, item.sound)}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-125 transition-transform text-lg shadow-sm"
                  title={`Burst ${item.emoji}`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>

            {/* Soundboard Triggers */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => handleSendReaction('🥁', 'dholak')}
                className="py-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition-all flex items-center justify-center gap-1"
              >
                🥁 Dholak Beat
              </button>
              <button
                onClick={() => handleSendReaction('💥', 'bass')}
                className="py-1 px-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold border border-red-500/30 transition-all flex items-center justify-center gap-1"
              >
                💥 Bass Drop
              </button>
              <button
                onClick={() => handleSendReaction('✨', 'sparkle')}
                className="py-1 px-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold border border-purple-500/30 transition-all flex items-center justify-center gap-1"
              >
                ✨ Vibe Chime
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {room.chatMessages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="text-center my-1.5">
                    <span className="text-[10px] font-medium text-zinc-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isMe = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-lg shrink-0 mt-0.5">{msg.senderAvatar}</span>
                  <div className={`max-w-[80%] space-y-0.5 ${isMe ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <span className="font-semibold text-zinc-300">{msg.senderName}</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-rose-500 text-white rounded-tr-none'
                          : 'bg-white/10 text-zinc-100 rounded-tl-none border border-white/10'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Message Input Bar */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2">
            <input
              id="room-chat-input"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t.chatPlaceholder}
              className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-zinc-500 focus:border-rose-500/50 outline-none"
            />
            <button
              id="btn-send-room-chat"
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white transition-all shadow-md"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Room QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl p-6 border border-white/20 bg-zinc-900 shadow-2xl text-center space-y-4">
            <h3 className="font-bold text-lg text-white">Join via QR Code</h3>
            <p className="text-xs text-zinc-400">Scan with your phone camera to instantly jump into the session</p>

            {/* Generated QR representation */}
            <div className="p-4 rounded-2xl bg-white text-black inline-block mx-auto shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  window.location.origin + '?room=' + room.roomId
                )}`}
                alt="Room QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="font-mono text-sm font-bold text-rose-400">Room: #{room.roomId}</div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
