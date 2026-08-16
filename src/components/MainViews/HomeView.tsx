import React, { useMemo, useState } from 'react';
import { Play, Plus, Heart, Search, Sparkles, Music2, Users, ArrowRight } from 'lucide-react';
import { Song, Playlist, SupportedLanguage, ExperienceMode } from '../../types';
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
  onAddToQueue,
  likedSongIds,
  onToggleLike,
  onOpenAiGenerator,
  onSelectPlaylist,
  onNavigateTab,
  language,
}) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const t = translations[language] || translations.en;
  const moodChips = ['all', 'relax', 'workout', 'energize', 'focus', 'party', 'romance', 'bollywood', 'punjabi', 'lofi'];

  const filteredSongs = useMemo(() => songs.filter((song) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'relax') return song.mood === 'chill' || song.mood === 'study';
    if (selectedFilter === 'workout') return song.mood === 'gym' || (song.bpm ?? 0) > 125;
    if (selectedFilter === 'energize') return song.mood === 'party' || (song.bpm ?? 0) > 120;
    if (selectedFilter === 'focus') return song.mood === 'study';
    if (selectedFilter === 'party') return song.mood === 'party';
    if (selectedFilter === 'romance') return song.mood === 'romance';
    if (selectedFilter === 'bollywood') return song.language === 'hi';
    if (selectedFilter === 'punjabi') return song.language === 'pa';
    if (selectedFilter === 'lofi') return /lofi|raga/i.test(song.title);
    return true;
  }), [songs, selectedFilter]);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-bold">{t.home?.welcome || 'Your music space'}</p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-white">Find something worth listening to.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Search YouTube for real, playable music, build your library, or start a listening room with people you care about.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={() => onNavigateTab('search')} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-zinc-200"><Search size={16} /> Search music</button>
            <button onClick={onOpenAiGenerator} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.09]"><Sparkles size={16} /> Create an AI mix</button>
          </div>
        </div>
      </section>

      {songs.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {moodChips.map((chip) => (
              <button key={chip} onClick={() => setSelectedFilter(chip)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${selectedFilter === chip ? 'bg-white text-black border-white' : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:bg-white/[0.08]'}`}>
                {chip === 'all' ? 'All' : chip.charAt(0).toUpperCase() + chip.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-end justify-between">
            <div><p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">Your collection</p><h2 className="mt-1 text-2xl font-bold text-white">Recently added</h2></div>
            <button onClick={() => onNavigateTab('library')} className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1">Library <ArrowRight size={13} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            {filteredSongs.slice(0, 16).map((song) => {
              const active = currentSong?.id === song.id && isPlaying;
              const liked = likedSongIds.has(song.id);
              return (
                <div key={song.id} className="group flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.06] transition">
                  <button onClick={() => onPlaySong(song)} className="relative w-12 h-12 shrink-0 overflow-hidden rounded-lg bg-zinc-900 border border-white/10">
                    {song.coverArt ? <img src={song.coverArt} alt="" className="h-full w-full object-cover" /> : <Music2 className="m-auto h-full p-3 text-zinc-600" />}
                    <span className="absolute inset-0 hidden place-items-center bg-black/50 group-hover:grid"><Play size={17} fill="white" /></span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => onPlaySong(song)} className={`block max-w-full truncate text-left text-xs font-semibold ${active ? 'text-violet-300' : 'text-white'}`}>{song.title}</button>
                    <p className="truncate text-[11px] text-zinc-500">{song.artist}</p>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                    <button onClick={() => onToggleLike(song.id)} className={`p-1.5 ${liked ? 'text-rose-400' : 'text-zinc-500 hover:text-white'}`} aria-label="Like"><Heart size={14} fill={liked ? 'currentColor' : 'none'} /></button>
                    <button onClick={() => onAddToQueue(song)} className="p-1.5 text-zinc-500 hover:text-white" aria-label="Add to queue"><Plus size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <Music2 className="mx-auto h-10 w-10 text-zinc-600" />
          <h2 className="mt-4 text-lg font-bold text-white">Your music starts here.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">There are no demo songs or generated covers in this build. Search YouTube for a real track and play it instantly.</p>
          <button onClick={() => onNavigateTab('search')} className="mt-5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black">Search real music</button>
        </section>
      )}

      {playlists.length > 0 && (
        <section className="space-y-4">
          <div><p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">Your playlists</p><h2 className="mt-1 text-2xl font-bold text-white">Saved collections</h2></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {playlists.map((playlist) => (
              <button key={playlist.id} onClick={() => onSelectPlaylist(playlist)} className="group text-left">
                <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                  {playlist.coverArt ? <img src={playlist.coverArt} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <Music2 className="m-auto h-full w-full p-12 text-zinc-700" />}
                </div>
                <p className="mt-2 truncate text-xs font-semibold text-white">{playlist.title}</p>
                <p className="text-[11px] text-zinc-500">{playlist.songIds.length} tracks</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={() => onNavigateTab('sessions')} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left hover:bg-white/[0.05]"><Users className="text-violet-300" size={20} /><h3 className="mt-3 text-sm font-bold text-white">Listen together</h3><p className="mt-1 text-xs text-zinc-500">Create or join a live synchronized room.</p></button>
        <button onClick={() => onNavigateTab('focus')} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left hover:bg-white/[0.05]"><Music2 className="text-emerald-300" size={20} /><h3 className="mt-3 text-sm font-bold text-white">Focus mode</h3><p className="mt-1 text-xs text-zinc-500">Pair real music with a focused session.</p></button>
        <button onClick={onOpenAiGenerator} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left hover:bg-white/[0.05]"><Sparkles className="text-rose-300" size={20} /><h3 className="mt-3 text-sm font-bold text-white">Generate a mix</h3><p className="mt-1 text-xs text-zinc-500">Describe a mood and build a playlist from available music.</p></button>
      </section>
    </div>
  );
};
