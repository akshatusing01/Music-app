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
  ArrowRight,
  TrendingUp,
  Clock,
  Dumbbell,
  Coffee,
  Moon,
  Globe,
  Shuffle,
  Volume2,
  MoreVertical,
} from 'lucide-react';
import { Song, Playlist, MoodCategory, SupportedLanguage, ExperienceMode, RoomState } from '../../types';
import { translations } from '../../data/translations';

interface HomeViewProps {
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
  onSelectExperience?: (mode: ExperienceMode) => void;
  onNavigateTab: (tab: any) => void;
  language: SupportedLanguage;
  experienceMode?: ExperienceMode;
}

export const HomeView: React.FC<HomeViewProps> = ({
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
  onSelectExperience,
  onNavigateTab,
  language,
  experienceMode = 'love',
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const t = translations[language] || translations.en;

  const moodChips = [
    { id: 'all', label: 'All' },
    { id: 'relax', label: 'Relax' },
    { id: 'workout', label: 'Workout' },
    { id: 'energize', label: 'Energize' },
    { id: 'focus', label: 'Focus' },
    { id: 'commute', label: 'Commute' },
    { id: 'party', label: 'Party' },
    { id: 'romance', label: 'Romance' },
    { id: 'bollywood', label: 'Bollywood' },
    { id: 'punjabi', label: 'Punjabi' },
    { id: 'lofi', label: 'Lofi & Chai' },
  ];

  const filteredSongs = songs.filter((s) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'relax') return s.mood === 'chill' || s.mood === 'study';
    if (selectedFilter === 'workout') return s.mood === 'gym' || (s.bpm && s.bpm > 125);
    if (selectedFilter === 'energize') return s.mood === 'party' || (s.bpm && s.bpm > 120);
    if (selectedFilter === 'focus') return s.mood === 'study';
    if (selectedFilter === 'party') return s.mood === 'party';
    if (selectedFilter === 'romance') return s.mood === 'romance';
    if (selectedFilter === 'bollywood') return s.language === 'hi';
    if (selectedFilter === 'punjabi') return s.language === 'pa';
    if (selectedFilter === 'lofi') return s.title.toLowerCase().includes('lofi') || s.title.toLowerCase().includes('raga');
    return true;
  });

  const activeLiveRooms = [
    {
      id: 'room-delhi-lofi',
      name: 'Delhi Monsoon Chai & Code ☕',
      listeners: 18,
      songTitle: 'Midnight Chai & Sitar Lofi',
      host: 'Aarav (DJ)',
      mood: 'Study / Focus',
      cover: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'room-couple-drive',
      name: 'Midnight Highway & Romance 💕',
      listeners: 12,
      songTitle: 'Kesariya • Brahmastra',
      host: 'Rohan & Priya',
      mood: 'Romance',
      cover: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'room-beast-workout',
      name: 'Heavy Deadlift 140+ BPM Beast ⚡',
      listeners: 24,
      songTitle: 'Zinda Phonk • Beast Anthem',
      host: 'Vikram',
      mood: 'Gym',
      cover: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      {/* 1. YOUTUBE MUSIC FILTER CHIPS CAROUSEL */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar sticky top-16 z-30 bg-[#030303]/90 backdrop-blur-md py-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
        {moodChips.map((chip) => {
          const isActive = selectedFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedFilter(chip.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-black font-bold'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* 2. QUICK PICKS (YouTube Music 4-row Grid) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">START RADIO FROM A SONG</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Quick picks</h2>
          </div>
          <button
            onClick={() => {
              if (songs[0]) onPlaySong(songs[0]);
            }}
            className="px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-semibold text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <Play size={12} fill="currentColor" />
            <span>Play all</span>
          </button>
        </div>

        {/* Quick Picks 4-Row Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {filteredSongs.slice(0, 16).map((song) => {
            const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
            const isLiked = likedSongIds.has(song.id);

            return (
              <div
                key={song.id}
                className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.07] transition-colors cursor-pointer"
                onClick={() => onPlaySong(song)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 border border-white/10">
                    <img
                      src={song.coverArt}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCurrentPlaying ? (
                        <Pause size={18} className="text-white" />
                      ) : (
                        <Play size={18} className="text-white" fill="white" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-xs font-semibold truncate ${
                        isCurrentPlaying ? 'text-[#ff0000]' : 'text-white'
                      }`}
                    >
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike(song.id);
                    }}
                    className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                      isLiked ? 'text-[#ff0000]' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToQueue(song);
                    }}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
                    title="Add to queue"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SIMILAR TO / LISTEN AGAIN SHELF (YouTube Music Horizontal Shelf) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">SIMILAR TO YOUR FAVORITES</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Recommended playlists</h2>
          </div>
          <button
            onClick={() => onNavigateTab('library')}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            More
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl)}
              className="group cursor-pointer space-y-2.5"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-zinc-900 shadow-md">
                <img
                  src={pl.coverArt}
                  alt={pl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                  <Play size={16} fill="white" className="translate-x-0.5" />
                </button>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white truncate group-hover:underline">
                  {pl.title}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  Playlist • {pl.songIds.length} tracks
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LIVE SOCIAL LISTEN ALONG ROOMS (YouTube Music Community Shelf) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff0000] animate-pulse" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-400">LISTEN TOGETHER</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Live sync rooms</h2>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('sessions')}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            See all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {activeLiveRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onJoinRoom(room.id)}
              className="group p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer transition-all flex items-center gap-3.5"
            >
              <img
                src={room.cover}
                alt={room.name}
                className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-1.5 py-0.5 rounded-md bg-[#ff0000]/20 text-red-400 text-[10px] font-bold">
                    {room.listeners} Live
                  </span>
                  <span className="text-[10px] text-zinc-400">{room.mood}</span>
                </div>
                <h4 className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                  {room.name}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">{room.songTitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. GEMINI AI MIXES & ATMOSPHERES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">MIXED FOR YOU</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Atmospheres & Focus</h2>
          </div>
          <button
            onClick={onOpenAiGenerator}
            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <Sparkles size={12} />
            <span>Generate Custom Mix</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            { id: 'love', title: 'Romance & Ballads', sub: 'Arijit, Ed Sheeran, Prateek', color: 'from-rose-900/60 to-black' },
            { id: 'focus', title: 'Focus & 432Hz Binaural', sub: 'Monsoon Sitar Lofi & Beats', color: 'from-emerald-900/60 to-black' },
            { id: 'gym', title: 'Workout & Trap Phonk', sub: '135+ BPM High Intensity', color: 'from-amber-900/60 to-black' },
            { id: 'chill', title: 'Late Night Chill', sub: 'Ambient Ragas & Deep Calm', color: 'from-purple-900/60 to-black' },
          ].map((mix) => (
            <div
              key={mix.id}
              onClick={() => {
                onSelectExperience?.(mix.id as ExperienceMode);
                if (mix.id === 'focus') onNavigateTab('focus');
              }}
              className={`p-4 rounded-xl bg-gradient-to-br ${mix.color} border border-white/10 hover:border-white/20 cursor-pointer transition-all group`}
            >
              <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-300 transition-colors">{mix.title}</h4>
              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{mix.sub}</p>
              <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-300">
                <span>Play Station</span>
                <Play size={12} fill="white" className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
