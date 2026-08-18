import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Download, Heart, Loader2, Music2, Play, Plus, Search, Sparkles, TrendingUp, Users, X } from 'lucide-react';
import { Playlist, Song, SupportedLanguage } from '../../types';
import { searchYouTubeMusic } from '../../services/youtubeSearch';
import { persistenceService } from '../../services/persistenceService';

interface DiscoverViewProps {
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  isPlaying: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
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

type Filter = 'all' | 'songs' | 'artists' | 'playlists';

const starterTopics = ['Hindi romantic', 'Punjabi hits', 'Tamil melodies', 'Indie pop', 'Workout music', 'Lo-fi focus'];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
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
  const [filter, setFilter] = useState<Filter>('all');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('syncbeat_recent_searches');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchYouTubeMusic(query, 18);
        if (controller.signal.aborted) return;
        setResults(response.songs);
        setRecentSearches((previous) => {
          const next = [query, ...previous.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 10);
          try { localStorage.setItem('syncbeat_recent_searches', JSON.stringify(next)); } catch { /* best effort */ }
          return next;
        });
      } catch (caught: any) {
        if (!controller.signal.aborted) {
          setResults([]);
          setError(caught?.message || 'Search is temporarily unavailable.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const localMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return songs.filter((song) => [song.title, song.artist, song.album ?? '', ...(song.tags ?? [])].some((value) => value.toLowerCase().includes(query)));
  }, [searchQuery, songs]);

  const mergedResults = useMemo(() => {
    const seen = new Set<string>();
    return [...results, ...localMatches].filter((song) => {
      if (seen.has(song.id)) return false;
      seen.add(song.id);
      return true;
    });
  }, [results, localMatches]);

  const artists = useMemo(() => {
    const values = new Set<string>();
    mergedResults.forEach((song) => song.artist.split('•').forEach((artist) => values.add(artist.trim())));
    return [...values].slice(0, 16);
  }, [mergedResults]);

  const history = persistenceService.getHistory(12).map((entry) => entry.song).filter((song, index, list) => list.findIndex((item) => item.id === song.id) === index);
  const recentlyLiked = songs.filter((song) => likedSongIds.has(song.id)).slice(0, 8);
  const recommended = useMemo(() => {
    const source = history.length ? history : recentlyLiked;
    if (!source.length) return songs.slice(0, 8);
    const artistsSet = new Set(source.map((song) => song.artist));
    const tagsSet = new Set(source.flatMap((song) => song.tags ?? []));
    return songs.filter((song) => !source.some((item) => item.id === song.id)).sort((a, b) => {
      const score = (song: Song) => (artistsSet.has(song.artist) ? 5 : 0) + (song.tags ?? []).filter((tag) => tagsSet.has(tag)).length;
      return score(b) - score(a);
    }).slice(0, 8);
  }, [songs, history.length, recentlyLiked.length]);

  const clearRecent = () => {
    setRecentSearches([]);
    try { localStorage.removeItem('syncbeat_recent_searches'); } catch { /* best effort */ }
  };

  const resultList = filter === 'songs' || filter === 'all' ? mergedResults : [];
  const playlistMatches = playlists.filter((playlist) => playlist.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-10 pb-12">
      <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[var(--cine-accent,#d4a574)] opacity-[0.08] blur-3xl" />
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Discover</p>
        <div className="mt-2 max-w-3xl">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-6xl">Follow the music.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">Explore artists, languages, moods and real playable tracks. Your searches become part of how Cineosync learns what to surface next.</p>
        </div>

        <div className="relative mt-7 max-w-4xl">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} autoFocus type="search" placeholder="Search a song, artist, album, language or mood…" className="w-full rounded-2xl border border-white/10 bg-black/25 py-4 pl-11 pr-11 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:bg-black/35" />
          {searchQuery && <button onClick={() => onSearchChange('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><X size={15} /></button>}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['all', 'songs', 'artists', 'playlists'] as Filter[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize ${filter === item ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white'}`}>{item}</button>)}
        </div>
      </section>

      {!searchQuery.trim() ? (
        <>
          {recentSearches.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Your trail</p><h2 className="mt-1 text-xl font-semibold text-white">Recent searches</h2></div><button onClick={clearRecent} className="text-xs text-zinc-500 hover:text-white">Clear</button></div>
              <div className="flex flex-wrap gap-2">{recentSearches.map((term) => <button key={term} onClick={() => onSearchChange(term)} className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-zinc-300 hover:bg-white/[0.06]">{term}</button>)}</div>
            </section>
          )}

          <section className="space-y-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Because you listened</p><h2 className="mt-1 text-2xl font-semibold text-white">A little more in your direction</h2></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(history.length ? history : recommended).slice(0, 8).map((song) => <button key={song.id} onClick={() => onPlaySong(song)} className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2.5 text-left hover:bg-white/[0.05]"><img src={song.coverArt} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-xl object-cover" /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{song.title}</span><span className="block truncate text-xs text-zinc-500">{song.artist}</span></span><Play size={14} className="ml-auto shrink-0 text-zinc-600 transition group-hover:text-white" fill="currentColor" /></button>)}
            </div>
          </section>

          <section className="space-y-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Explore by intent</p><h2 className="mt-1 text-2xl font-semibold text-white">What are you in the mood for?</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{starterTopics.map((topic) => <button key={topic} onClick={() => onSearchChange(topic)} className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left hover:bg-white/[0.05]"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">{topic}</span><Sparkles size={15} className="text-zinc-600 group-hover:text-white" /></div><p className="mt-1 text-xs text-zinc-600">Start a real search</p></button>)}</div>
          </section>
        </>
      ) : (
        <section className="space-y-5">
          {error && <div className="flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-300/[0.05] p-4 text-xs text-amber-100"><AlertCircle size={16} className="shrink-0" /><div><p className="font-semibold">Search unavailable</p><p className="mt-1 text-amber-100/65">{error}</p></div></div>}
          {loading && <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-zinc-400"><Loader2 size={17} className="animate-spin" /> Finding playable music…</div>}
          {!loading && !error && filter === 'all' && resultList.length === 0 && playlistMatches.length === 0 && <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center"><Music2 className="mx-auto text-zinc-600" size={34} /><p className="mt-3 text-sm font-semibold text-white">No matches yet</p><p className="mt-1 text-xs text-zinc-600">Try a broader title, artist, language or mood.</p></div>}

          {resultList.length > 0 && <div className="space-y-3">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Playable results</p><h2 className="mt-1 text-xl font-semibold text-white">Songs</h2></div><span className="text-[10px] text-zinc-600">{resultList.length} results</span></div>
            <div className="space-y-2">{resultList.map((song) => {
              const active = currentSong?.id === song.id && isPlaying;
              const liked = likedSongIds.has(song.id);
              const downloaded = downloadedSongIds.has(song.id);
              return <div key={song.id} className={`group flex items-center gap-3 rounded-2xl border p-2.5 sm:p-3 ${active ? 'border-white/15 bg-white/[0.07]' : 'border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05]'}`}>
                <button onClick={() => onPlaySong(song)} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"><img src={song.coverArt} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /><span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition group-hover:opacity-100"><Play size={17} fill="currentColor" /></span></button>
                <button onClick={() => onPlaySong(song)} className="min-w-0 flex-1 text-left"><p className={`truncate text-sm font-semibold ${active ? 'text-[var(--cine-accent,#d4a574)]' : 'text-white'}`}>{song.title}</p><p className="truncate text-xs text-zinc-500">{song.artist}</p><p className="mt-1 truncate text-[10px] text-zinc-600">{song.languageLabel || 'Music'}</p></button>
                <div className="flex shrink-0 items-center gap-0.5"><button onClick={() => onToggleLike(song.id)} aria-label={liked ? 'Unlike' : 'Like'} className={`rounded-full p-2 ${liked ? 'text-[var(--cine-accent,#d4a574)]' : 'text-zinc-600 hover:text-white'}`}><Heart size={15} fill={liked ? 'currentColor' : 'none'} /></button><button onClick={() => onAddToQueue(song)} aria-label="Add to queue" className="rounded-full p-2 text-zinc-600 hover:text-white"><Plus size={15} /></button><button onClick={() => onToggleDownload(song)} aria-label={downloaded ? 'Remove from saved' : 'Save'} className={`rounded-full p-2 ${downloaded ? 'text-emerald-400' : 'text-zinc-600 hover:text-white'}`}>{downloaded ? <Check size={15} /> : <Download size={15} />}</button></div>
              </div>;
            })}</div>
          </div>}

          {filter !== 'songs' && artists.length > 0 && <section className="space-y-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Explore further</p><h2 className="mt-1 text-xl font-semibold text-white">Artists & channels</h2></div><div className="flex flex-wrap gap-2">{artists.map((artist) => <button key={artist} onClick={() => onSearchChange(artist)} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.06]">{artist}</button>)}</div></section>}

          {filter !== 'songs' && playlistMatches.length > 0 && <section className="space-y-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Your library</p><h2 className="mt-1 text-xl font-semibold text-white">Matching playlists</h2></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{playlistMatches.slice(0, 10).map((playlist) => <button key={playlist.id} onClick={() => onSelectPlaylist(playlist)} className="group text-left"><div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><img src={playlist.coverArt} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover transition group-hover:scale-[1.03]" /></div><p className="mt-2 truncate text-sm font-semibold text-white">{playlist.title}</p><p className="text-xs text-zinc-600">{playlist.songIds.length} tracks</p></button>)}</div></section>}
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"><TrendingUp size={18} className="text-zinc-400" /><h3 className="mt-3 text-sm font-semibold text-white">Taste follows you</h3><p className="mt-1 text-xs leading-5 text-zinc-600">Cineosync can use your real listening trail to improve discovery over time.</p></div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"><Users size={18} className="text-zinc-400" /><h3 className="mt-3 text-sm font-semibold text-white">Public listening</h3><p className="mt-1 text-xs leading-5 text-zinc-600">Rooms become part of discovery without changing the way music playback works.</p></div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"><Sparkles size={18} className="text-zinc-400" /><h3 className="mt-3 text-sm font-semibold text-white">Explainable choices</h3><p className="mt-1 text-xs leading-5 text-zinc-600">Recommendations should tell you why they appeared instead of hiding behind generic AI labels.</p></div>
      </section>
    </div>
  );
};
