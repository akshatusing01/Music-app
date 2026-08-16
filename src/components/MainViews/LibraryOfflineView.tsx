import React, { useState } from 'react';
import {
  FolderDown,
  Heart,
  WifiOff,
  Wifi,
  Trash2,
  Play,
  Pause,
  Plus,
  Music,
  Clock,
  Disc,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { Song, Playlist, SupportedLanguage } from '../../types';
import { translations } from '../../data/translations';

interface LibraryOfflineViewProps {
  allSongs: Song[];
  downloadedSongIds: Set<string>;
  likedSongIds: Set<string>;
  customPlaylists: Playlist[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onTogglePlay: () => void;
  onToggleDownload: (song: Song) => void;
  onToggleLike: (songId: string) => void;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  onClearOfflineCache: () => void;
  onSelectPlaylist: (pl: Playlist) => void;
  language: SupportedLanguage;
}

export const LibraryOfflineView: React.FC<LibraryOfflineViewProps> = ({
  allSongs,
  downloadedSongIds,
  likedSongIds,
  customPlaylists,
  currentSong,
  isPlaying,
  onPlaySong,
  onTogglePlay,
  onToggleDownload,
  onToggleLike,
  isOfflineMode,
  onToggleOfflineMode,
  onClearOfflineCache,
  onSelectPlaylist,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'liked' | 'playlists'>('downloads');
  const t = translations[language] || translations.en;

  const downloadedSongs = allSongs.filter((s) => downloadedSongIds.has(s.id));
  const likedSongs = allSongs.filter((s) => likedSongIds.has(s.id));

  const totalStorageMb = (downloadedSongs.length * 3.8).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 border border-white/15 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            <FolderDown size={14} />
            <span>Personal Library & Offline Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Your Sound Vault
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300">
            Downloaded songs are cached locally in your browser storage for full offline playback without internet.
          </p>
        </div>

        {/* Offline Mode Switcher Card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4 shrink-0">
          <div className={`p-3 rounded-xl ${isOfflineMode ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isOfflineMode ? <WifiOff size={22} /> : <Wifi size={22} />}
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              {isOfflineMode ? 'Offline Mode Active' : 'Online Sync Mode'}
            </div>
            <div className="text-[11px] text-zinc-400">
              {isOfflineMode ? 'Zero network data used' : 'Connected to WebSocket'}
            </div>
          </div>
          <button
            onClick={onToggleOfflineMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isOfflineMode
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isOfflineMode ? 'Go Online' : 'Go Offline'}
          </button>
        </div>
      </div>

      {/* Storage Management Bar */}
      <div className="rounded-2xl p-4 border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <HardDrive size={16} className="text-rose-400" />
          <span>
            Offline Storage: <strong className="text-white">{totalStorageMb} MB</strong> / 500 MB ({downloadedSongs.length} songs cached)
          </span>
        </div>

        {downloadedSongs.length > 0 && (
          <button
            onClick={onClearOfflineCache}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
            <span>Clear Download Cache</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('downloads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'downloads'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderDown size={16} />
          <span>Downloaded ({downloadedSongs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('liked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'liked'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Heart size={16} />
          <span>Liked Songs ({likedSongs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'playlists'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Disc size={16} />
          <span>Playlists ({customPlaylists.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'downloads' && (
        <div className="space-y-3">
          {downloadedSongs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {downloadedSongs.map((song) => {
                const isThisPlaying = currentSong?.id === song.id && isPlaying;
                return (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all gap-3"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => onPlaySong(song)}
                    >
                      <img
                        src={song.coverArt}
                        alt={song.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                        <span className="text-[10px] text-emerald-400 font-mono">💾 3.8 MB Offline</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPlaySong(song)}
                        className="p-2.5 rounded-xl bg-rose-500 text-white"
                      >
                        {isThisPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                      </button>
                      <button
                        onClick={() => onToggleDownload(song)}
                        title="Remove from Downloads"
                        className="p-2 rounded-xl text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-zinc-400 space-y-2">
              <FolderDown size={36} className="mx-auto opacity-40 text-rose-400" />
              <p className="text-base font-semibold text-white">No Downloaded Songs</p>
              <p className="text-xs">Tap the download icon on any song to save it for offline listening.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'liked' && (
        <div className="space-y-3">
          {likedSongs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {likedSongs.map((song) => {
                const isThisPlaying = currentSong?.id === song.id && isPlaying;
                return (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all gap-3"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => onPlaySong(song)}
                    >
                      <img
                        src={song.coverArt}
                        alt={song.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPlaySong(song)}
                        className="p-2.5 rounded-xl bg-rose-500 text-white"
                      >
                        {isThisPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                      </button>
                      <button
                        onClick={() => onToggleLike(song.id)}
                        className="p-2 rounded-xl text-rose-500 bg-rose-500/10"
                      >
                        <Heart size={16} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-zinc-400 space-y-2">
              <Heart size={36} className="mx-auto opacity-40 text-rose-400" />
              <p className="text-base font-semibold text-white">No Liked Songs Yet</p>
              <p className="text-xs">Tap the heart on any song to save it to your favorites.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {customPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl)}
              className="cursor-pointer rounded-2xl p-4 border border-white/10 bg-zinc-900/60 hover:bg-zinc-900/90 backdrop-blur-xl transition-all hover:scale-105 shadow-xl flex gap-3 items-center"
            >
              <img
                src={pl.coverArt}
                alt={pl.title}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-white truncate">{pl.title}</h4>
                <p className="text-xs text-zinc-400 truncate">{pl.description}</p>
                <span className="text-[10px] text-zinc-500 mt-1 block">{pl.songIds.length} Songs</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
