import React, { useState } from 'react';
import {
  ListMusic,
  MessageSquare,
  Users,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
  Sparkles,
  Heart,
  Flame,
  Music,
  Send,
  Radio,
  Play,
  Volume2,
  Clock,
  Plus,
} from 'lucide-react';
import { Song, RoomState, ChatMessage, RoomParticipant } from '../types';

interface RightContextPanelProps {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  activeRoom: RoomState | null;
  currentTime: number;
  onPlaySong: (song: Song) => void;
  onRemoveFromQueue: (index: number) => void;
  onSendChatMessage: (text: string, type?: 'text' | 'reaction' | 'moment' | 'sound', emoji?: string, soundName?: string) => void;
  onTriggerFloatingReaction: (emoji: string) => void;
  onOpenLyrics: () => void;
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({
  currentSong,
  queue,
  isPlaying,
  activeRoom,
  currentTime,
  onPlaySong,
  onRemoveFromQueue,
  onSendChatMessage,
  onTriggerFloatingReaction,
  onOpenLyrics,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'chat' | 'listeners'>('queue');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [songVotes, setSongVotes] = useState<Record<string, number>>({});

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChatMessage(chatInput.trim(), 'text');
    setChatInput('');
  };

  const handleVote = (songId: string) => {
    setSongVotes((prev) => ({ ...prev, [songId]: (prev[songId] || 0) + 1 }));
    onTriggerFloatingReaction('🔥');
  };

  const handleSendMoment = (emoji: string) => {
    const momentText = `${emoji} Moment at ${formatTime(currentTime)}`;
    onSendChatMessage(momentText, 'moment', emoji);
    onTriggerFloatingReaction(emoji);
  };

  const handleTriggerSound = (soundName: string, emoji: string) => {
    onSendChatMessage(`[Sound Effect: ${soundName}]`, 'sound', emoji, soundName);
    onTriggerFloatingReaction(emoji);
  };

  if (isCollapsed) {
    return (
      <div className="hidden xl:flex flex-col items-center py-4 px-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shrink-0 h-[calc(100vh-5rem)] sticky top-20">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 transition-all mb-4"
          title="Expand Right Panel"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col gap-4 text-zinc-400">
          <button
            onClick={() => { setIsCollapsed(false); setActiveTab('queue'); }}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-all"
            title="Queue"
          >
            <ListMusic size={18} />
          </button>
          <button
            onClick={() => { setIsCollapsed(false); setActiveTab('chat'); }}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-all relative"
            title="Live Chat"
          >
            <MessageSquare size={18} />
            {activeRoom && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            onClick={() => { setIsCollapsed(false); setActiveTab('listeners'); }}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-all"
            title="Listeners"
          >
            <Users size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 h-[calc(100vh-5rem)] sticky top-20 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-3.5 space-y-3 overflow-hidden select-none">
      {/* Top Header & Tab Selector */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'queue' ? 'bg-rose-500 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListMusic size={14} />
            <span>Queue</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'chat' ? 'bg-rose-500 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare size={14} />
            <span>Chat</span>
            {activeRoom && activeRoom.chatMessages.length > 0 && (
              <span className="text-[10px] bg-white/20 px-1 rounded-full">{activeRoom.chatMessages.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('listeners')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'listeners' ? 'bg-rose-500 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Room</span>
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          title="Collapse Panel"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* TAB 1: COLLABORATIVE QUEUE */}
      {activeTab === 'queue' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          {/* Now Playing Mini-Card */}
          {currentSong && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/15 via-purple-500/10 to-transparent border border-rose-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  Now Playing
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {formatTime(currentTime)} / {formatTime(currentSong.duration)}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <img
                  src={currentSong.coverArt}
                  alt={currentSong.title}
                  className="w-10 h-10 rounded-lg object-cover border border-white/20"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{currentSong.title}</h4>
                  <p className="text-[11px] text-zinc-400 truncate">{currentSong.artist}</p>
                </div>
              </div>
            </div>
          )}

          {/* Up Next List */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-300">Up Next ({queue.length})</span>
            <span className="text-[10px] text-zinc-400">Drag or vote</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-zinc-400">
                <Music size={32} className="mb-2 opacity-40 text-rose-400" />
                <p className="text-xs font-medium">Queue is empty</p>
                <p className="text-[11px] text-zinc-400 mt-1">Add tracks from Explore or Search to keep the vibes rolling.</p>
              </div>
            ) : (
              queue.map((song, idx) => (
                <div
                  key={`${song.id}-${idx}`}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={() => onPlaySong(song)}>
                    <span className="text-[11px] font-mono text-zinc-400 w-4 text-center">{idx + 1}</span>
                    <img
                      src={song.coverArt}
                      alt={song.title}
                      className="w-8 h-8 rounded-md object-cover border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-200 group-hover:text-rose-300 truncate transition-colors">
                        {song.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleVote(song.id)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-rose-500/20 text-[10px] font-semibold text-zinc-300 hover:text-rose-300 transition-colors"
                      title="Vote up"
                    >
                      <ThumbsUp size={11} />
                      <span>{songVotes[song.id] || 0}</span>
                    </button>
                    <button
                      onClick={() => onRemoveFromQueue(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition-opacity text-xs"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE ROOM CHAT & MOMENTS */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          {/* Quick Moment Tagger & Soundboard */}
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Tag Timestamped Moment
            </span>
            <div className="flex items-center justify-between gap-1">
              {[
                { emoji: '❤️', label: 'Love' },
                { emoji: '🔥', label: 'Drop' },
                { emoji: '✨', label: 'Vibe' },
                { emoji: '🙌', label: 'Drop' },
                { emoji: '😭', label: 'Feels' },
              ].map((m) => (
                <button
                  key={m.emoji}
                  onClick={() => handleSendMoment(m.emoji)}
                  className="flex-1 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs hover:scale-110 active:scale-95 transition-all text-center border border-white/5"
                  title={`Tag ${m.label} at current song time`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>

            {/* Quick Desi Soundboard */}
            <div className="pt-1 flex items-center justify-between gap-1 text-[10px]">
              <button
                onClick={() => handleTriggerSound('Dholak Beat 🪘', '🪘')}
                className="flex-1 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 truncate"
              >
                🪘 Dholak
              </button>
              <button
                onClick={() => handleTriggerSound('Sub-Bass 808 🔊', '🔊')}
                className="flex-1 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 truncate"
              >
                🔊 808
              </button>
              <button
                onClick={() => handleTriggerSound('Temple Chime 🔔', '🔔')}
                className="flex-1 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 truncate"
              >
                🔔 Bell
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
            {!activeRoom || activeRoom.chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-zinc-400">
                <MessageSquare size={28} className="mb-2 opacity-40 text-zinc-400" />
                <p className="text-xs font-medium">No messages yet</p>
                <p className="text-[11px] text-zinc-400 mt-1">Send reactions, moments or cheer with listeners.</p>
              </div>
            ) : (
              activeRoom.chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-xl border ${
                    msg.type === 'moment'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : msg.type === 'sound'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-white/[0.04] border-white/5 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5 text-[10px] text-zinc-400">
                    <span className="font-semibold text-zinc-300">{msg.senderName}</span>
                    <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs break-words">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="relative pt-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send message or reaction..."
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
      )}

      {/* TAB 3: ACTIVE ROOM & LISTENERS */}
      {activeTab === 'listeners' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          {activeRoom ? (
            <>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                    Room Host
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{activeRoom.roomId}</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{activeRoom.roomName}</h4>
                <p className="text-[11px] text-zinc-400">
                  {activeRoom.participants.length} Devices listening in real-time sync
                </p>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-zinc-300">Participants</span>
                <span className="text-[10px] text-emerald-400 font-mono">Sync Latency &lt; 20ms</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {activeRoom.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">{p.name}</span>
                          {p.isHost && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              DJ
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400">{p.currentStatus || 'Listening together'}</p>
                      </div>
                    </div>

                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-zinc-400">
              <Radio size={32} className="mb-2 opacity-40 text-rose-400" />
              <p className="text-xs font-bold text-zinc-200">Not in a Sync Room</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Start a session or join friends to listen together with synchronized playback and shared reactions.
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
