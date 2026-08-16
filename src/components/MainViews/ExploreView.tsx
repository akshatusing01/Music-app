import React, { useState } from 'react';
import {
  Play,
  Pause,
  Plus,
  Heart,
  Flame,
  Sparkles,
  Users,
  Music,
  Radio,
  Download,
  Check,
  Disc,
  ArrowRight,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { Song, Playlist, MoodCategory, SupportedLanguage } from '../../types';
import { translations } from '../../data/translations';
import { GlassIcon } from '../GlassIcon';
import { AudioVisualizer } from '../AudioVisualizer';

interface ExploreViewProps {
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onTogglePlay: () => void;
  onAddToQueue: (song: Song) => void;
  likedSongIds: Set<string>;
  onToggleLike: (songId: string) => void;
  downloadedSongIds: Set<string>;
  onToggleDownload: (song: Song) => void;
  onJoinRoom: (roomId: string) => void;
  onOpenAiGenerator: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  language: SupportedLanguage;
  theme: string;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  songs,
  playlists,
  currentSong,
  isPlaying,
  onPlaySong,
  onTogglePlay,
  onAddToQueue,
  likedSongIds,
  onToggleLike,
  downloadedSongIds,
  onToggleDownload,
  onJoinRoom,
  onOpenAiGenerator,
  onSelectPlaylist,
  language,
  theme,
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodCategory>('all');
  const t = translations[language] || translations.en;

  const moodFilters: { id: MoodCategory; label: string; emoji: string }[] = [
    { id: 'all', label: t.allSongs, emoji: '✨' },
    { id: 'romance', label: t.moodRomance, emoji: '💕' },
    { id: 'gym', label: t.moodGym, emoji: '⚡' },
    { id: 'study', label: t.moodStudy, emoji: '☕' },
    { id: 'party', label: t.moodParty, emoji: '🪩' },
    { id: 'devotional', label: t.moodDevotional, emoji: '🕊️' },
    { id: 'regional', label: t.moodRegional, emoji: '🇮🇳' },
  ];

  const filteredSongs = songs.filter((s) => {
    if (selectedMood === 'all') return true;
    if (selectedMood === 'regional') return ['ta', 'te', 'pa', 'bn', 'mr', 'kn', 'ml'].includes(s.language);
    return s.mood === selectedMood;
  });

  const featuredRooms = [
    {
      id: 'BOLLY-LOVE',
      name: 'Bollywood & English Romance 💕',
      listeners: 48,
      songTitle: 'Tum Hi Ho • Arijit Singh',
      mood: 'romance',
      badgeColor: 'from-rose-500 to-pink-600',
    },
    {
      id: 'GYM-BEAST',
      name: 'Desi Beast Mode & Phonk ⚡',
      listeners: 62,
      songTitle: 'Zinda Phonk • Heavy 808s',
      mood: 'gym',
      badgeColor: 'from-amber-500 to-red-600',
    },
    {
      id: 'STUDY-CHAI',
      name: 'Midnight Chai & Lofi Focus ☕',
      listeners: 35,
      songTitle: 'Sitar Chill • 432Hz Monsoon',
      mood: 'study',
      badgeColor: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="space-y-8 pb-32">
      {/* Hero Banner with Glass Aesthetics */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-white/15 bg-gradient-to-br from-rose-950/40 via-purple-950/30 to-zinc-950/70 backdrop-blur-2xl shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold backdrop-blur-md">
            <Radio size={14} className="animate-pulse text-rose-400" />
            <span>Real-Time Synchronized Audio Engine • Sub-20ms Drift</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Listen Together.{' '}
            <span className="bg-gradient-to-r from-rose-400 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              Feel Every Beat.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            {t.tagline}. Synchronize live audio with friends, chat with instant soundboard reactions, study with ambient Pomodoro timers, and explore Indian regional hits.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-btn-join-room"
              onClick={() => onJoinRoom('BOLLY-LOVE')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Users size={18} />
              <span>Join Live Romance Room</span>
            </button>

            <button
              id="hero-btn-ai-playlist"
              onClick={onOpenAiGenerator}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles size={18} className="text-amber-400" />
              <span>{t.aiGenerator}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Featured Jam Rooms Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-rose-400 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{t.activeRooms}</h2>
          </div>
          <span className="text-xs text-zinc-400 font-medium">Real-Time Sync Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredRooms.map((room) => (
            <div
              key={room.id}
              id={`featured-room-${room.id}`}
              onClick={() => onJoinRoom(room.id)}
              className="group cursor-pointer rounded-2xl p-4 border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-all hover:border-rose-500/40 hover:-translate-y-0.5 shadow-lg relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${room.badgeColor}`}>
                  {room.id}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Users size={12} /> {room.listeners} listening
                </span>
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                {room.name}
              </h3>
              <p className="text-xs text-zinc-400 truncate mt-1">🎵 {room.songTitle}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-rose-400 font-semibold">
                <span>Join & Sync Now</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Curated Mood Playlists */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc size={18} className="text-indigo-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Curated Mood Collections</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              id={`playlist-card-${pl.id}`}
              onClick={() => onSelectPlaylist(pl)}
              className="group cursor-pointer rounded-3xl p-4 border border-white/10 bg-zinc-900/60 hover:bg-zinc-900/90 backdrop-blur-xl transition-all hover:border-white/20 hover:scale-[1.01] shadow-xl flex gap-4 items-center"
            >
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/15">
                <img
                  src={pl.coverArt}
                  alt={pl.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all shadow-lg">
                    <Play size={14} fill="currentColor" className="translate-x-0.5" />
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-white truncate group-hover:text-rose-300 transition-colors">
                  {pl.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {pl.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {pl.songIds.length} Tracks
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-medium">
                    {pl.platformSource || 'SurSync'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mood Filters Pill Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-rose-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Explore Track Catalog</h2>
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            {filteredSongs.length} songs available
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {moodFilters.map((filter) => (
            <button
              key={filter.id}
              id={`filter-mood-${filter.id}`}
              onClick={() => setSelectedMood(filter.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedMood === filter.id
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
              }`}
            >
              <span>{filter.emoji}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Songs List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSongs.map((song) => {
            const isThisPlaying = currentSong?.id === song.id && isPlaying;
            const isThisCurrent = currentSong?.id === song.id;
            const isLiked = likedSongIds.has(song.id);
            const isDownloaded = downloadedSongIds.has(song.id);

            return (
              <div
                key={song.id}
                id={`song-row-${song.id}`}
                className={`group rounded-2xl p-3 border transition-all flex items-center justify-between gap-3 ${
                  isThisCurrent
                    ? 'bg-rose-500/15 border-rose-500/40 shadow-lg shadow-rose-500/10'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left: Thumbnail & Info */}
                <div
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    if (isThisCurrent) {
                      onTogglePlay();
                    } else {
                      onPlaySong(song);
                    }
                  }}
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/15">
                    <img
                      src={song.coverArt}
                      alt={song.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                      {isThisPlaying ? (
                        <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center">
                          <Pause size={12} fill="currentColor" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/80 text-black flex items-center justify-center">
                          <Play size={12} fill="currentColor" className="translate-x-0.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-sm font-bold truncate ${isThisCurrent ? 'text-rose-300' : 'text-white'}`}>
                        {song.title}
                      </h4>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 border border-white/15 shrink-0">
                        {song.languageLabel}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {Math.floor(song.duration / 60)}:{song.duration % 60 < 10 ? '0' : ''}
                        {song.duration % 60}
                      </span>
                      {song.bpm && (
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ⚡ {song.bpm} BPM
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions (Like, Queue, Download) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    id={`btn-like-${song.id}`}
                    onClick={() => onToggleLike(song.id)}
                    className={`p-2 rounded-xl transition-colors ${
                      isLiked ? 'text-rose-500 bg-rose-500/15' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    id={`btn-queue-${song.id}`}
                    onClick={() => onAddToQueue(song)}
                    title="Add to Up Next Queue"
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    id={`btn-download-${song.id}`}
                    onClick={() => onToggleDownload(song)}
                    title={isDownloaded ? 'Downloaded' : 'Download for Offline'}
                    className={`p-2 rounded-xl transition-colors ${
                      isDownloaded
                        ? 'text-emerald-400 bg-emerald-500/15'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isDownloaded ? <Check size={16} /> : <Download size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
