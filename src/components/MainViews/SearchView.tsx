import React, { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, X, Play, Plus, Heart, Download, Check, TrendingUp, Sparkles, Music, ListMusic, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Song, Playlist, SupportedLanguage } from '../../types';
import { searchYouTubeMusic } from '../../services/youtubeSearch';

interface SearchViewProps {
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  isPlaying: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPlaySong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  likedSongIds: Set<string>;
  onToggleLike: (songId: string) => void;
  downloadedSongIds: Set<string>;
  onToggleDownload: (song: Song) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onJoinRoom: (roomId: string) => void;
  language: SupportedLanguage;
}

export const SearchView: React.FC<SearchViewProps> = ({
  songs,
  playlists,
  currentSong,
  isPlaying,
  searchQuery,
  onSearchChange,
  onPlaySong,
  onAddToQueue,
  likedSongIds,
  onToggleLike,
  downloadedSongIds,
  onToggleDownload,
  onSelectPlaylist,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'songs' | 'artists' | 'playlists'>('all');
  const [youtubeSongs, setYoutubeSongs] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('syncbeat_recent_searches');
      return saved ? JSON.parse(saved) : ['Arijit Singh', 'Kesariya', 'Stephen Sanchez', 'Punjabi gym songs'];
    } catch {
      return ['Arijit Singh', 'Kesariya', 'Stephen Sanchez', 'Punjabi gym songs'];
    }
  });

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setYoutubeSongs([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const result = await searchYouTubeMusic(query, 15);
        if (!controller.signal.aborted) {
          setYoutubeSongs(result.songs);
          setRecentSearches((prev) => {
            const next = [query, ...prev.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
            try { localStorage.setItem('syncbeat_recent_searches', JSON.stringify(next)); } catch {}
            return next;
          });
        }
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setYoutubeSongs([]);
          setSearchError(error?.message || 'Unable to search YouTube right now.');
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const localResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return songs.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.album?.toLowerCase().includes(q) ||
      s.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [searchQuery, songs]);

  const searchResults = useMemo(() => {
    const seen = new Set<string>();
    return [...youtubeSongs, ...localResults].filter((song) => {
      if (seen.has(song.id)) return false;
      seen.add(song.id);
      return true;
    });
  }, [youtubeSongs, localResults]);

  const artists = useMemo(() => {
    const result = new Set<string>();
    searchResults.forEach((song) => song.artist.split('•').forEach((artist) => result.add(artist.trim())));
    return Array.from(result);
  }, [searchResults]);

  const trendingTags = ['Tum Hi Ho', 'Arijit Singh', 'Kesariya', 'Stephen Sanchez', 'Ed Sheeran', 'Anirudh', 'Punjabi Hits', 'Gym Phonk'];

  const selectRecent = (term: string) => onSearchChange(term);

  const clearRecent = () => {
    setRecentSearches([]);
    try { localStorage.removeItem('syncbeat_recent_searches'); } catch {}
  };

  const playSong = (song: Song) => {
    onPlaySong(song);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-950/40 via-zinc-950/70 to-purple-950/40 border border-white/10 backdrop-blur-2xl">
        <div className="relative z-10 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-rose-300 font-bold">Live music search</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">Find something. Play it now.</h1>
            <p className="mt-2 text-xs text-zinc-400">Searches YouTube in real time and only surfaces videos that can be embedded for playback.</p>
          </div>

          <div className="relative flex items-center max-w-3xl">
            <SearchIcon size={20} className="absolute left-4 text-zinc-400 pointer-events-none" />
            <input
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search songs, artists, albums, Bollywood, Punjabi, Tamil..."
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-black/60 border border-white/15 focus:border-rose-500/70 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
            {isSearching ? (
              <Loader2 size={18} className="absolute right-4 text-rose-400 animate-spin" />
            ) : searchQuery ? (
              <button onClick={() => onSearchChange('')} className="absolute right-3 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10">
                <X size={15} />
              </button>
            ) : null}
          </div>

          <div className="flex gap-2 overflow-x-auto custom-scrollbar pt-1">
            {[
              ['all', 'All'],
              ['songs', 'Songs'],
              ['artists', 'Artists'],
              ['playlists', 'Playlists'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilterType(id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${filterType === id ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!searchQuery.trim() ? (
        <div className="space-y-7">
          {recentSearches.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent searches</span>
                <button onClick={clearRecent} className="text-xs text-zinc-500 hover:text-white">Clear</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button key={term} onClick={() => selectRecent(term)} className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-zinc-200">
                    {term}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-rose-400" /> Explore music
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {trendingTags.map((tag, index) => (
                <button key={tag} onClick={() => selectRecent(tag)} className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-left transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-rose-400">#{index + 1}</span>
                    <Sparkles size={13} className="text-zinc-500 group-hover:text-rose-400" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-white truncate">{tag}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {searchError && (
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-200 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">YouTube search unavailable</p>
                <p className="mt-1 text-amber-200/70">{searchError}</p>
              </div>
            </div>
          )}

          {isSearching && searchResults.length === 0 && (
            <div className="p-10 rounded-3xl border border-white/10 bg-white/[0.02] text-center">
              <Loader2 size={28} className="mx-auto text-rose-400 animate-spin" />
              <p className="mt-3 text-sm text-white font-semibold">Searching YouTube…</p>
              <p className="mt-1 text-xs text-zinc-500">Finding playable results for “{searchQuery}”</p>
            </div>
          )}

          {!isSearching && !searchError && searchResults.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10">
              <Music size={40} className="mx-auto text-zinc-500 opacity-40" />
              <h3 className="mt-3 text-base font-bold text-white">No playable results</h3>
              <p className="mt-1 text-xs text-zinc-500">Try the artist name, song title, or a broader search.</p>
            </div>
          )}

          {(filterType === 'all' || filterType === 'songs') && searchResults.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Music size={16} className="text-rose-400" /> Songs</h3>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">{searchResults.length} playable</span>
              </div>

              <div className="space-y-2">
                {searchResults.map((song) => {
                  const active = currentSong?.id === song.id && isPlaying;
                  const liked = likedSongIds.has(song.id);
                  const downloaded = downloadedSongIds.has(song.id);
                  const externalUrl = song.youtubeVideoId ? `https://www.youtube.com/watch?v=${song.youtubeVideoId}` : undefined;
                  return (
                    <div key={song.id} className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${active ? 'bg-rose-500/15 border-rose-500/40' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'}`}>
                      <button onClick={() => playSong(song)} className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 group/play">
                        <img src={song.coverArt} alt="" className="w-full h-full object-cover" />
                        <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 group-hover/play:opacity-100 transition-opacity">
                          <Play size={18} fill="currentColor" className="text-white ml-0.5" />
                        </span>
                        {active && <span className="absolute inset-0 grid place-items-center bg-rose-500/50"><span className="w-2 h-5 rounded-full bg-white animate-pulse" /></span>}
                      </button>

                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => playSong(song)}>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                          {song.youtubeVideoId && <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/20">YouTube</span>}
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-500">
                          <span>{Math.floor(song.duration / 60)}:{String(Math.floor(song.duration % 60)).padStart(2, '0')}</span>
                          <span>•</span>
                          <span>{song.languageLabel}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => onToggleLike(song.id)} className={`p-2 rounded-lg ${liked ? 'text-rose-400 bg-rose-500/10' : 'text-zinc-500 hover:text-white'}`} title="Like">
                          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={() => onAddToQueue(song)} className="p-2 rounded-lg text-zinc-500 hover:text-white" title="Add to queue"><Plus size={16} /></button>
                        <button onClick={() => onToggleDownload(song)} className={`p-2 rounded-lg ${downloaded ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'}`} title="Save locally">
                          {downloaded ? <Check size={15} /> : <Download size={15} />}
                        </button>
                        {externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-zinc-500 hover:text-white" title="Open on YouTube"><ExternalLink size={15} /></a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(filterType === 'all' || filterType === 'artists') && artists.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-white">Artists / channels</h3>
              <div className="flex flex-wrap gap-2">
                {artists.slice(0, 12).map((artist) => <button key={artist} onClick={() => onSearchChange(artist)} className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-200 hover:bg-white/10">{artist}</button>)}
              </div>
            </section>
          )}

          {filterType !== 'songs' && (filterType === 'all' || filterType === 'playlists') && playlists.filter((playlist) => playlist.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><ListMusic size={16} className="text-purple-400" /> Your playlists</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {playlists.filter((playlist) => playlist.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8).map((playlist) => (
                  <button key={playlist.id} onClick={() => onSelectPlaylist(playlist)} className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-left">
                    <img src={playlist.coverArt} alt="" className="w-full aspect-square rounded-xl object-cover" />
                    <p className="mt-2 text-xs font-bold text-white truncate">{playlist.title}</p>
                    <p className="text-[10px] text-zinc-500">{playlist.songIds.length} songs</p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
