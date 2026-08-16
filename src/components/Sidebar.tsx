import React from 'react';
import {
  Home,
  Compass,
  FolderDown,
  Users,
  Timer,
  FileMusic,
  Plus,
  Heart,
  Radio,
  Sparkles,
  Flame,
  Dumbbell,
  Coffee,
  Moon,
  Music2,
  Sliders,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { MainNavTab, ExperienceMode, RoomState, SupportedLanguage, Playlist } from '../types';
import { translations } from '../data/translations';

interface SidebarProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  experienceMode?: ExperienceMode;
  onSelectExperience?: (mode: ExperienceMode) => void;
  activeRoom?: RoomState | null;
  latencyMs?: number;
  isOfflineMode?: boolean;
  onToggleOfflineMode?: () => void;
  language: SupportedLanguage;
  focusTimerRunning?: boolean;
  onOpenAiGenerator: () => void;
  onOpenEqualizer?: () => void;
  playlists?: Playlist[];
  onSelectPlaylist?: (playlist: Playlist) => void;
  onOpenImporter?: () => void;
  likedSongsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  experienceMode = 'love',
  onSelectExperience,
  activeRoom,
  latencyMs = 12,
  isOfflineMode = false,
  onToggleOfflineMode,
  language,
  focusTimerRunning,
  onOpenAiGenerator,
  onOpenEqualizer,
  playlists = [],
  onSelectPlaylist,
  onOpenImporter,
  likedSongsCount = 0,
}) => {
  const t = translations[language] || translations.en;

  const mainNav = [
    { id: 'home' as MainNavTab, label: 'Home', icon: Home },
    { id: 'search' as MainNavTab, label: 'Explore', icon: Compass },
    { id: 'library' as MainNavTab, label: 'Library', icon: FolderDown },
    {
      id: 'sessions' as MainNavTab,
      label: 'Live Rooms',
      icon: Users,
      badge: activeRoom ? `${activeRoom.participants.length} Live` : undefined,
    },
    {
      id: 'focus' as MainNavTab,
      label: 'Focus Beats',
      icon: Timer,
      badge: focusTimerRunning ? 'Active' : undefined,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-[calc(100vh-4.5rem)] sticky top-16 bg-[#030303] border-r border-white/[0.06] p-3 space-y-3 select-none overflow-y-auto custom-scrollbar">
      {/* Primary Navigation Rail */}
      <nav className="space-y-1">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-4">
                <Icon size={20} className={isActive ? 'text-white' : 'text-zinc-400'} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full bg-[#ff0000] text-white text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="h-[1px] bg-white/[0.08] mx-2" />

      {/* Action Buttons: New AI Playlist & Connect YT Music */}
      <div className="space-y-2 px-1">
        <button
          onClick={onOpenAiGenerator}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all shadow-xs"
        >
          <Sparkles size={14} className="text-red-400" />
          <span>New AI Playlist</span>
        </button>

        <button
          onClick={onOpenImporter || (() => onSelectTab('importer'))}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-[#ff0000]/10 hover:bg-[#ff0000]/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/20 transition-all"
        >
          <FileMusic size={14} />
          <span>Connect YT Music</span>
        </button>
      </div>

      <div className="h-[1px] bg-white/[0.08] mx-2" />

      {/* Liked Music Card */}
      <div className="space-y-1 px-1">
        <div
          onClick={() => onSelectTab('library')}
          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
            currentTab === 'library'
              ? 'bg-white/10 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Heart size={16} fill="white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">Liked Music</p>
            <p className="text-[10px] text-zinc-400 truncate">Auto playlist • {likedSongsCount} songs</p>
          </div>
        </div>

        {/* Playlists Shelf */}
        <div className="pt-2">
          <div className="px-2 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center justify-between">
            <span>Playlists</span>
            <span className="text-[10px] text-zinc-400">{playlists.length}</span>
          </div>

          <div className="space-y-0.5 max-h-52 overflow-y-auto custom-scrollbar">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => onSelectPlaylist?.(pl)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors group"
              >
                <img
                  src={pl.coverArt}
                  alt={pl.title}
                  className="w-7 h-7 rounded-md object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-200 group-hover:text-white truncate text-xs">{pl.title}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{pl.songIds.length} tracks</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sync & Storage Info */}
      <div className="mt-auto pt-2 border-t border-white/[0.08] space-y-1">
        {onToggleOfflineMode && (
          <button
            onClick={onToggleOfflineMode}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
              isOfflineMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2">
              {isOfflineMode ? <WifiOff size={14} /> : <Wifi size={14} />}
              <span className="truncate">{isOfflineMode ? 'Offline Vault' : 'Streaming 320k'}</span>
            </div>
            <span className="text-[9px] font-bold uppercase">{isOfflineMode ? 'Saved' : `${latencyMs}ms`}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
