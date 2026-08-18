import React from 'react';
import { Home, Compass, Library, Users, Timer, Heart, Sparkles, Music2, Settings2, Wifi, WifiOff, ListMusic, Clock3 } from 'lucide-react';
import { MainNavTab, RoomState, Playlist } from '../types';

interface SidebarProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  activeRoom?: RoomState | null;
  latencyMs?: number;
  isOfflineMode?: boolean;
  onToggleOfflineMode?: () => void;
  focusTimerRunning?: boolean;
  onOpenAiGenerator: () => void;
  onOpenEqualizer?: () => void;
  playlists?: Playlist[];
  onSelectPlaylist?: (playlist: Playlist) => void;
  onOpenImporter?: () => void;
  likedSongsCount?: number;
}

const NavItem = ({ active, icon: Icon, label, badge, onClick }: any) => (
  <button onClick={onClick} className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? 'bg-[var(--cine-accent-soft)] text-white border border-[rgba(214,182,138,.16)]' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[.035]'}`}>
    <Icon size={17} strokeWidth={active ? 2.1 : 1.7} className={active ? 'text-[var(--cine-accent)]' : 'text-zinc-500 group-hover:text-zinc-300'} />
    <span className="flex-1 text-left truncate">{label}</span>
    {badge && <span className="text-[9px] font-bold text-emerald-300">{badge}</span>}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, activeRoom, latencyMs = 12, isOfflineMode = false, onToggleOfflineMode, focusTimerRunning, onOpenAiGenerator, playlists = [], onSelectPlaylist, onOpenImporter, likedSongsCount = 0 }) => (
  <aside className="hidden lg:flex flex-col w-[224px] shrink-0 h-[calc(100vh-68px)] sticky top-[68px] py-5 pr-3 select-none overflow-hidden">
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
      <section>
        <div className="sb-kicker px-3 mb-2">Your space</div>
        <nav className="space-y-0.5">
          <NavItem active={currentTab === 'home'} icon={Home} label="Home" onClick={() => onSelectTab('home')} />
          <NavItem active={currentTab === 'search'} icon={Compass} label="Discover" onClick={() => onSelectTab('search')} />
          <NavItem active={currentTab === 'sessions'} icon={Users} label="Sessions" badge={activeRoom ? `${activeRoom.participants.length}` : undefined} onClick={() => onSelectTab('sessions')} />
          <NavItem active={currentTab === 'library'} icon={Library} label="Library" onClick={() => onSelectTab('library')} />
          <NavItem active={currentTab === 'profile'} icon={() => <span className="text-xs font-bold">@</span>} label="Profile" onClick={() => onSelectTab('profile')} />
        </nav>
      </section>

      <section>
        <div className="sb-kicker px-3 mb-2">Listen your way</div>
        <button onClick={() => onSelectTab('focus')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${currentTab === 'focus' ? 'bg-white/[.055] text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[.035]'}`}>
          <Timer size={17} className={focusTimerRunning ? 'text-emerald-300' : 'text-zinc-500'} />
          <span className="flex-1 text-left">Focus</span>{focusTimerRunning && <span className="text-[9px] font-bold text-emerald-300">LIVE</span>}
        </button>
      </section>

      <section>
        <div className="flex items-center justify-between px-3 mb-2"><div className="sb-kicker">Your collection</div><span className="text-[10px] text-zinc-600">{playlists.length}</span></div>
        <div className="space-y-0.5">
          <button onClick={() => onSelectTab('library')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/[.035] transition-colors"><span className="w-8 h-8 rounded-lg bg-white/[.06] border border-white/[.07] flex items-center justify-center shrink-0 text-[var(--cine-accent)]"><Heart size={15} fill="currentColor" /></span><span className="min-w-0"><span className="block text-sm text-zinc-200 truncate">Liked Music</span><span className="block text-[10px] text-zinc-500">{likedSongsCount} songs</span></span></button>
          <button onClick={() => onSelectTab('library')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-zinc-400 hover:text-white hover:bg-white/[.035] transition-colors"><Clock3 size={16} className="text-zinc-500" /><span className="text-sm">Recently Played</span></button>
          <button onClick={() => onSelectTab('library')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-zinc-400 hover:text-white hover:bg-white/[.035] transition-colors"><ListMusic size={16} className="text-zinc-500" /><span className="text-sm">Playlists</span></button>
          {playlists.slice(0, 5).map((pl) => <button key={pl.id} onClick={() => onSelectPlaylist?.(pl)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-white/[.035] transition-colors"><img src={pl.coverArt} alt="" className="w-7 h-7 rounded-md object-cover opacity-80" /><span className="min-w-0"><span className="block text-xs text-zinc-400 truncate">{pl.title}</span><span className="block text-[9px] text-zinc-600 truncate">{pl.songIds.length} tracks</span></span></button>)}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
        <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-lg bg-[var(--cine-accent-soft)] border border-white/[.06] flex items-center justify-center"><Sparkles size={14} className="text-[var(--cine-accent)]" /></div><div><div className="text-xs font-semibold text-zinc-100">Smart listening</div><div className="text-[9px] text-zinc-500">Create a personal mix</div></div></div>
        <button onClick={onOpenAiGenerator} className="w-full py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors">Create Smart Mix</button>
      </section>
    </div>

    <div className="pt-3 mt-2 border-t border-white/[.06] space-y-1">
      {onOpenImporter && <button onClick={onOpenImporter} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/[.04]"><Music2 size={15} /> Import music</button>}
      <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/[.04]"><Settings2 size={15} /> Settings</button>
      {onToggleOfflineMode && <button onClick={onToggleOfflineMode} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] text-zinc-500 hover:bg-white/[.04]"><span className="flex items-center gap-2">{isOfflineMode ? <WifiOff size={13} /> : <Wifi size={13} />} {isOfflineMode ? 'Offline Vault' : 'Connected'}</span><span className={isOfflineMode ? 'text-amber-300' : 'text-emerald-300'}>{isOfflineMode ? 'SAVED' : `${latencyMs}ms`}</span></button>}
    </div>
  </aside>
);
