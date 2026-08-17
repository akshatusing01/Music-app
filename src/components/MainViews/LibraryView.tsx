import React, { useEffect, useMemo, useState } from 'react';
import {
  FolderDown,
  Heart,
  Wifi,
  WifiOff,
  Trash2,
  Play,
  Plus,
  FileMusic,
  Clock,
  Disc,
  History,
  Sparkles,
  Share2,
} from 'lucide-react';
import { Song, Playlist, SupportedLanguage } from '../../types';
import { translations } from '../../data/translations';
import { persistenceService, ListeningHistoryItem } from '../../services/persistenceService';

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
  likedSongIds,
  customPlaylists,
  currentSong,
  isPlaying,
  onPlaySong,
  onTogglePlay,
  onToggleLike,
  isOfflineMode,
  onToggleOfflineMode,
  onSelectPlaylist,
  onOpenImporter,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'liked' | 'playlists' | 'history'>('liked');
  const [history, setHistory] = useState<ListeningHistoryItem[]>(() => persistenceService.getHistory());
  const t = translations[language] || translations.en;

  const likedSongs = useMemo(() => allSongs.filter((s) => likedSongIds.has(s.id)), [allSongs, likedSongIds]);

  useEffect(() => {
    const refreshHistory = () => setHistory(persistenceService.getHistory());
    window.addEventListener('syncbeat:history-updated', refreshHistory);
    window.addEventListener('storage', refreshHistory);
    return () => {
      window.removeEventListener('syncbeat:history-updated', refreshHistory);
      window.removeEventListener('storage', refreshHistory);
    };
  }, []);

  const clearHistory = () => {
    persistenceService.clearHistory();
    setHistory([]);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-950/40 via-zinc-950/60 to-purple-950/40 border border-white/10 backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            <FolderDown size={14} />
            <span>Personal Library</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Music, Playlists & History</h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Your saved songs, playlists and real listening history. YouTube tracks stream online; SyncBeat does not pretend they are downloadable files.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4 shrink-0">
          <div className={`p-3 rounded-xl ${isOfflineMode ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isOfflineMode ? <WifiOff size={22} /> : <Wifi size={22} />}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{isOfflineMode ? 'Offline UI mode' : 'Online streaming'}</div>
            <div className="text-[11px] text-zinc-400">YouTube playback requires an internet connection</div>
          </div>
          <button onClick={onToggleOfflineMode} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all">
            {isOfflineMode ? 'Go Online' : 'Offline Info'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'liked', label: `Liked (${likedSongs.length})`, icon: Heart },
            { id: 'playlists', label: `Playlists (${customPlaylists.length})`, icon: Disc },
            { id: 'history', label: `History (${history.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${isActive ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20' : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'}`}>
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <button onClick={onOpenImporter} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold text-purple-300 transition-all">
          <FileMusic size={14} />
          <span>Import playlists</span>
        </button>
      </div>

      {activeTab === 'liked' && (
        <div className="space-y-4">
          {likedSongs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
              <Heart size={36} className="mx-auto text-rose-500 opacity-40" />
              <h3 className="text-base font-bold text-white">No Liked Songs Yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">Tap the heart icon on any song in Home, Search, or a Listening Room to save it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {likedSongs.map((song) => {
                const isCurrent = currentSong?.id === song.id && isPlaying;
                return (
                  <div key={song.id} className={`group flex items-center justify-between p-3 rounded-2xl transition-all border ${isCurrent ? 'bg-rose-500/15 border-rose-500/40' : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10'}`}>
                    <button className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={() => onPlaySong(song)}>
                      <img src={song.coverArt} alt={song.title} className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-rose-300 truncate">{song.title}</h4>
                        <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                        <span className="text-[9px] uppercase font-semibold px-1 py-0.2 rounded-md bg-white/10 text-zinc-400">{song.languageLabel}</span>
                      </div>
                    </button>
                    <button onClick={() => onToggleLike(song.id)} className="p-2 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500/20" title="Unlike">
                      <Heart size={14} fill="currentColor" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'playlists' && (
        <div>
          {customPlaylists.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
              <Disc size={36} className="mx-auto text-purple-400 opacity-40" />
              <h3 className="text-base font-bold text-white">No Playlists Yet</h3>
              <p className="text-xs text-zinc-400">Create a playlist from a song's queue/menu. Your playlists are stored locally and survive refreshes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {customPlaylists.map((pl) => (
                <button key={pl.id} onClick={() => onSelectPlaylist(pl)} className="group p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-rose-500/40 text-left transition-all space-y-3">
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/15">
                    <img src={pl.coverArt} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-300">{pl.title}</h4>
                    <p className="text-[10px] text-zinc-400 truncate">{pl.songIds.length} tracks</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Recently played</h3>
              <p className="text-xs text-zinc-400">Your actual listening history on this device.</p>
            </div>
            <button onClick={clearHistory} disabled={!history.length} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-xs font-semibold text-zinc-300 hover:text-red-300 disabled:opacity-30">
              <Trash2 size={13} /> Clear
            </button>
          </div>
          {history.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
              <Clock size={32} className="mx-auto text-zinc-400 opacity-40" />
              <h3 className="text-sm font-bold text-white">No listening history yet</h3>
              <p className="text-xs text-zinc-400">Play a real track and it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <button key={`${item.song.id}-${item.playedAt}`} onClick={() => onPlaySong(item.song)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left">
                  <img src={item.song.coverArt} alt={item.song.title} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{item.song.title}</div>
                    <div className="text-[11px] text-zinc-400 truncate">{item.song.artist}</div>
                  </div>
                  <div className="text-[10px] text-zinc-500 shrink-0">{new Date(item.playedAt).toLocaleDateString()}</div>
                  <Play size={14} className="text-zinc-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};