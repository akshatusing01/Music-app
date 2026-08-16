import React from 'react';
import {
  Home, Compass, Library, Users, Timer, Heart, Sparkles, Plus,
  Wifi, WifiOff, ListMusic, Clock3, Music2, Settings2, Radio,
} from 'lucide-react';
import { MainNavTab, ExperienceMode, RoomState, SupportedLanguage, Playlist } from '../types';

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

const NavItem = ({ active, icon: Icon, label, badge, onClick }: any) => (
  <button
    onClick={onClick}
    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
      active
        ? 'bg-white/[0.085] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.045]'
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-violet-300' : 'text-zinc-500 group-hover:text-zinc-300'} />
    <span className="flex-1 text-left truncate">{label}</span>
    {badge && <span className="text-[9px] font-bold text-emerald-300">{badge}</span>}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeRoom,
  latencyMs = 12,
  isOfflineMode = false,
  onToggleOfflineMode,
  focusTimerRunning,
  onOpenAiGenerator,
  playlists = [],
  onSelectPlaylist,
  onOpenImporter,
  likedSongsCount = 0,
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-[248px] shrink-0 h-[calc(100vh-5.25rem)] sticky top-[4.75rem] py-1 pr-2 select-none overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
        <section>
          <div className="sb-kicker px-3 mb-2">Your space</div>
          <nav className="space-y-0.5">
            <NavItem active={currentTab === 'home'} icon={Home} label="Home" onClick={() => onSelectTab('home')} />
            <NavItem active={currentTab === 'search'} icon={Compass} label="Discover" onClick={() => onSelectTab('search')} />
            <NavItem active={currentTab === 'library'} icon={Library} label="Your Library" onClick={() => onSelectTab('library')} />
          </nav>
        </section>

        <section>
          <div className="sb-kicker px-3 mb-2">Listen together</div>
          <nav className="space-y-0.5">
            <NavItem active={currentTab === 'sessions'} icon={Users} label="Listening Rooms" badge={activeRoom ? `${activeRoom.participants.length}` : undefined} onClick={() => onSelectTab('sessions')} />
            <NavItem active={currentTab === 'focus'} icon={Timer} label="Focus" badge={focusTimerRunning ? 'LIVE' : undefined} onClick={() => onSelectTab('focus')} />
          </nav>
        </section>

        <section>
          <div className="flex items-center justify-between px-3 mb-2">
            <div className="sb-kicker">Your collection</div>
            <span className="text-[10px] text-zinc-600">{playlists.length}</span>
          </div>
          <div className="space-y-0.5">
            <button onClick={() => onSelectTab('library')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/[0.045] transition-colors">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-700 flex items-center justify-center shrink-0">
                <Heart size={15} fill="currentColor" />
              </span>
              <span className="min-w-0"><span className="block text-sm text-zinc-200 truncate">Liked Music</span><span className="block text-[10px] text-zinc-500">{likedSongsCount} songs</span></span>
            </button>
            <button onClick={() => onSelectTab('library')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-zinc-400 hover:text-white hover:bg-white/[0.045] transition-colors">
              <Clock3 size={17} className="text-zinc-500" /><span className="text-sm">Recently Played</span>
            </button>
            <button onClick={() => onSelectTab('library')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-zinc-400 hover:text-white hover:bg-white/[0.045] transition-colors">
              <ListMusic size={17} className="text-zinc-500" /><span className="text-sm">Playlists</span>
            </button>
          </div>

          {playlists.length > 0 && (
            <div className="mt-2 pl-2 space-y-0.5">
              {playlists.slice(0, 6).map((pl) => (
                <button key={pl.id} onClick={() => onSelectPlaylist?.(pl)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-white/[0.04] transition-colors group">
                  <img src={pl.coverArt} alt="" className="w-7 h-7 rounded-md object-cover opacity-80 group-hover:opacity-100" />
                  <span className="min-w-0"><span className="block text-xs text-zinc-400 group-hover:text-zinc-200 truncate">{pl.title}</span><span className="block text-[9px] text-zinc-600 truncate">{pl.songIds.length} tracks</span></span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="sb-surface rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-400/15 flex items-center justify-center"><Sparkles size={14} className="text-violet-300" /></div>
            <div><div className="text-xs font-semibold text-zinc-100">Make a moment</div><div className="text-[9px] text-zinc-500">AI-powered listening</div></div>
          </div>
          <button onClick={onOpenAiGenerator} className="w-full py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors">Create AI Mix</button>
        </section>
      </div>

      <div className="pt-3 mt-2 border-t border-white/[0.06] space-y-1">
        {onOpenImporter && <button onClick={onOpenImporter} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"><Music2 size={15} /> Import music</button>}
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"><Settings2 size={15} /> Settings</button>
        {onToggleOfflineMode && (
          <button onClick={onToggleOfflineMode} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] text-zinc-500 hover:bg-white/[0.04] transition-colors">
            <span className="flex items-center gap-2">{isOfflineMode ? <WifiOff size={13} /> : <Wifi size={13} />} {isOfflineMode ? 'Offline Vault' : 'Connected'}</span>
            <span className={isOfflineMode ? 'text-amber-300' : 'text-emerald-300'}>{isOfflineMode ? 'SAVED' : `${latencyMs}ms`}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
