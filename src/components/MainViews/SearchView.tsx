import React, { useState, useMemo } from 'react';
import {
  Search as SearchIcon,
  X,
  Play,
  Pause,
  Plus,
  Heart,
  Download,
  Check,
  TrendingUp,
  Sparkles,
  Music,
  User,
  ListMusic,
  Radio,
  Clock,
  History,
} from 'lucide-react';
import { Song, Playlist, RoomState, SupportedLanguage } from '../../types';

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
  onJoinRoom,
  language,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'songs' | 'artists' | 'playlists' | 'lyrics'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Arijit Singh',
    'Kesariya',
    'Phonk Beast',
    'Arabic Kuthu',
    'Chai Lofi',
  ]);

  const trendingTags = [
    'Tum Hi Ho',
    'Naatu Naatu',
    'Kesariya',
    'KGF Monster',
    'Stephen Sanchez',
    'Ed Sheeran',
    'Kun Faya Kun',
    'Tamil Kuthu',
    'Monsoon Rain Sitar',
  ];

  // Multilingual & Transliteration Aware Search matching
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { songs: [], playlists: [], artists: [] };

    const q = searchQuery.toLowerCase().trim();

    const matchedSongs = songs.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchArtist = s.artist.toLowerCase().includes(q);
      const matchAlbum = s.album?.toLowerCase().includes(q);
      const matchTags = s.tags.some((t) => t.toLowerCase().includes(q));
      const matchLyrics = s.lyrics.some(
        (l) =>
          l.text.toLowerCase().includes(q) ||
          l.transliteration?.toLowerCase().includes(q) ||
          l.translation?.toLowerCase().includes(q)
      );

      return matchTitle || matchArtist || matchAlbum || matchTags || matchLyrics;
    });

    const matchedPlaylists = playlists.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.mood.toLowerCase().includes(q)
      );
    });

    // Unique artists matched
    const artistSet = new Set<string>();
    matchedSongs.forEach((s) => {
      s.artist.split('•').forEach((a) => artistSet.add(a.trim()));
    });

    return {
      songs: matchedSongs,
      playlists: matchedPlaylists,
      artists: Array.from(artistSet),
    };
  }, [searchQuery, songs, playlists]);

  const handleSelectRecent = (term: string) => {
    onSearchChange(term);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Search Input Hero Section */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-950/40 via-zinc-950/60 to-purple-950/40 border border-white/10 backdrop-blur-2xl space-y-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Search Music, Artists & Synced Lyrics
        </h1>
        <p className="text-xs text-zinc-400">
          Typo-tolerant transliterated search across Bollywood, South Indian, Punjabi, and International tracks
        </p>

        <div className="relative flex items-center max-w-2xl">
          <SearchIcon size={20} className="absolute left-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Try 'Arijit Singh', 'Kesariya', 'Arabic Kuthu', 'Gym Phonk'..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-black/60 hover:bg-black/80 focus:bg-black border border-white/15 focus:border-rose-500/60 text-sm text-white placeholder-zinc-400 outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 p-1 rounded-full text-zinc-400 hover:text-white bg-white/10"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 custom-scrollbar">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'songs', label: 'Songs' },
            { id: 'artists', label: 'Artists' },
            { id: 'playlists', label: 'Playlists' },
            { id: 'lyrics', label: 'Lyrics Transliteration' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                filterType === f.id
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* When no query is typed: Show Recent Searches & Trending Tags */}
      {!searchQuery.trim() ? (
        <div className="space-y-6">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <History size={14} />
                  Recent Searches
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSelectRecent(term)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-all flex items-center gap-2"
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Indian & Global Tags */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-rose-400" />
              Trending in India & Global
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {trendingTags.map((tag, idx) => (
                <div
                  key={tag}
                  onClick={() => onSearchChange(tag)}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-rose-400">#{idx + 1}</span>
                    <span className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors">
                      {tag}
                    </span>
                  </div>
                  <Sparkles size={13} className="text-zinc-400 group-hover:text-rose-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Results Section */
        <div className="space-y-6">
          {searchResults.songs.length === 0 && searchResults.playlists.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
              <Music size={40} className="mx-auto text-zinc-400 opacity-40" />
              <h3 className="text-base font-bold text-white">No exact match for "{searchQuery}"</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Try searching by artist name (e.g. Arijit, Pritam, Anirudh) or movie name (Brahmastra, Aashiqui 2).
              </p>
            </div>
          ) : (
            <>
              {/* Songs Results */}
              {(filterType === 'all' || filterType === 'songs' || filterType === 'lyrics') &&
                searchResults.songs.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Music size={16} className="text-rose-400" />
                      Matching Songs ({searchResults.songs.length})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {searchResults.songs.map((song) => {
                        const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
                        const isLiked = likedSongIds.has(song.id);
                        const isDownloaded = downloadedSongIds.has(song.id);

                        return (
                          <div
                            key={song.id}
                            className={`group flex items-center justify-between p-3 rounded-2xl transition-all border ${
                              isCurrentPlaying
                                ? 'bg-rose-500/15 border-rose-500/40'
                                : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10'
                            }`}
                          >
                            <div
                              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                              onClick={() => onPlaySong(song)}
                            >
                              <img
                                src={song.coverArt}
                                alt={song.title}
                                className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-white group-hover:text-rose-300 truncate transition-colors">
                                  {song.title}
                                </h4>
                                <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                                <span className="text-[9px] uppercase font-semibold px-1 py-0.2 rounded-md bg-white/10 text-zinc-400">
                                  {song.languageLabel}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onToggleLike(song.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isLiked ? 'text-rose-500 bg-rose-500/10' : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                onClick={() => onToggleDownload(song)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDownloaded ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                {isDownloaded ? <Check size={14} /> : <Download size={14} />}
                              </button>
                              <button
                                onClick={() => onAddToQueue(song)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Playlists Results */}
              {(filterType === 'all' || filterType === 'playlists') && searchResults.playlists.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ListMusic size={16} className="text-purple-400" />
                    Matching Playlists ({searchResults.playlists.length})
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    {searchResults.playlists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => onSelectPlaylist(pl)}
                        className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 cursor-pointer transition-all space-y-2"
                      >
                        <img
                          src={pl.coverArt}
                          alt={pl.title}
                          className="w-full aspect-square rounded-xl object-cover border border-white/15"
                        />
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-300">
                          {pl.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate">{pl.songIds.length} Songs</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
