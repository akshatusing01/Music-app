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
  FileMusic,
  ArrowRight,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';
import { Song, Playlist, SupportedLanguage } from '../../types';
import { translations } from '../../data/translations';

interface LibraryViewProps {
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
  onOpenImporter: () => void;
  language: SupportedLanguage;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
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
  onOpenImporter,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'liked' | 'downloads' | 'playlists' | 'history'>('liked');
  const [isWifiOnly, setIsWifiOnly] = useState(true);
  const t = translations[language] || translations.en;

  const downloadedSongs = allSongs.filter((s) => downloadedSongIds.has(s.id));
  const likedSongs = allSongs.filter((s) => likedSongIds.has(s.id));
  const totalStorageMb = (downloadedSongs.length * 3.8).toFixed(1);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-950/40 via-zinc-950/60 to-purple-950/40 border border-white/10 backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            <FolderDown size={14} />
            <span>Personal Sound Vault & Library</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Tracks, Playlists & Offline Vault
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            All your favorited songs, downloaded offline tracks, and imported Spotify/YouTube Music playlists stored locally.
          </p>
        </div>

        {/* Offline & Data Saver Card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4 shrink-0">
          <div className={`p-3 rounded-xl ${isOfflineMode ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isOfflineMode ? <WifiOff size={22} /> : <Wifi size={22} />}
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              {isOfflineMode ? 'Offline Vault Mode' : 'Connected (320k Stream)'}
            </div>
            <div className="text-[11px] text-zinc-400">
              {isOfflineMode ? 'Zero cellular data used' : `${totalStorageMb} MB cached locally`}
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

      {/* Library Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'liked', label: `Liked Tracks (${likedSongs.length})`, icon: Heart },
            { id: 'downloads', label: `Offline Vault (${downloadedSongs.length})`, icon: Download },
            { id: 'playlists', label: `Playlists (${customPlaylists.length})`, icon: Disc },
            { id: 'history', label: 'History', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isActive
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenImporter}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold text-purple-300 transition-all"
        >
          <FileMusic size={14} />
          <span>Import from Spotify/YT</span>
        </button>
      </div>

      {/* TAB 1: LIKED SONGS */}
      {activeTab === 'liked' && (
        <div className="space-y-4">
          {likedSongs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
              <Heart size={36} className="mx-auto text-rose-500 opacity-40" />
              <h3 className="text-base font-bold text-white">No Liked Songs Yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Tap the heart icon on any song in Home, Search, or Listening Rooms to save them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {likedSongs.map((song) => {
                const isCurrent = currentSong?.id === song.id && isPlaying;
                return (
                  <div
                    key={song.id}
                    className={`group flex items-center justify-between p-3 rounded-2xl transition-all border ${
                      isCurrent
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
                        <h4 className="text-xs font-bold text-white group-hover:text-rose-300 truncate">
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                        <span className="text-[9px] uppercase font-semibold px-1 py-0.2 rounded-md bg-white/10 text-zinc-400">
                          {song.languageLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onToggleLike(song.id)}
                        className="p-1.5 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
                        title="Unlike"
                      >
                        <Heart size={14} fill="currentColor" />
                      </button>
                      <button
                        onClick={() => onToggleDownload(song)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OFFLINE VAULT */}
      {activeTab === 'downloads' && (
        <div className="space-y-6">
          {/* Storage Meter */}
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <HardDrive size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Browser Storage Vault</h3>
              </div>
              <p className="text-xs text-zinc-400">
                {downloadedSongs.length} Songs Downloaded • {totalStorageMb} MB storage occupied
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWifiOnly}
                  onChange={(e) => setIsWifiOnly(e.target.checked)}
                  className="rounded border-white/20 text-emerald-500"
                />
                <span>Wi-Fi Only Downloads</span>
              </label>

              <button
                onClick={onClearOfflineCache}
                disabled={downloadedSongs.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold disabled:opacity-30"
              >
                <Trash2 size={13} />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>

          {downloadedSongs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
              <Download size={36} className="mx-auto text-emerald-400 opacity-40" />
              <h3 className="text-base font-bold text-white">No Offline Downloads</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Download songs to listen seamlessly on slow 2G/3G mobile networks, flights, or metro commutes without using data.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {downloadedSongs.map((song) => (
                <div
                  key={song.id}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10"
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
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white group-hover:text-rose-300 truncate">
                          {song.title}
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          OFFLINE
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                      <p className="text-[10px] text-zinc-400">~3.8 MB • 320kbps Audio</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleDownload(song)}
                    className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Delete from Offline Vault"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PLAYLISTS */}
      {activeTab === 'playlists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {customPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl)}
              className="group p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-rose-500/40 cursor-pointer transition-all space-y-3"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/15">
                <img src={pl.coverArt} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-zinc-300 border border-white/20">
                  {pl.platformSource || 'SyncBeat'}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-300">{pl.title}</h4>
                <p className="text-[10px] text-zinc-400 truncate">{pl.songIds.length} Tracks</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: HISTORY */}
      {activeTab === 'history' && (
        <div className="p-8 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-2">
          <Clock size={32} className="mx-auto text-zinc-400 opacity-40" />
          <h3 className="text-sm font-bold text-white">Recent Listening Session History</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Your recent synced sessions with friends and study timer milestones are logged automatically.
          </p>
        </div>
      )}
    </div>
  );
};
