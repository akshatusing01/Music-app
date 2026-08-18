import React, { useState } from 'react';
import { Compass, Home, Languages, Menu, Search, Sparkles, Users, X, SlidersHorizontal, Library, UserRound, Timer } from 'lucide-react';
import { SupportedLanguage, AppTheme, MainNavTab, RoomState, ExperienceMode } from '../types';
import { translations } from '../data/translations';

interface NavbarProps {
  currentTab: MainNavTab; onSelectTab: (tab: MainNavTab) => void; experienceMode?: ExperienceMode; onSelectExperience?: (mode: ExperienceMode) => void;
  language: SupportedLanguage; onLanguageChange: (lang: SupportedLanguage) => void; theme: AppTheme; onThemeChange: (theme: AppTheme) => void;
  searchQuery: string; onSearchChange: (query: string) => void; activeRoom: RoomState | null; latencyMs: number; isOfflineMode: boolean;
  onToggleOfflineMode: () => void; focusTimerRunning: boolean; onOpenAiGenerator: () => void; onOpenEqualizer?: () => void;
}
const nav = [
  { id: 'home' as MainNavTab, label: 'Home', icon: Home },
  { id: 'search' as MainNavTab, label: 'Discover', icon: Compass },
  { id: 'sessions' as MainNavTab, label: 'Sessions', icon: Users },
  { id: 'library' as MainNavTab, label: 'Library', icon: Library },
  { id: 'profile' as MainNavTab, label: 'Profile', icon: UserRound },
];

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, language, onLanguageChange, searchQuery, onSearchChange, activeRoom, latencyMs, focusTimerRunning, onOpenAiGenerator, onOpenEqualizer }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languages = [['en','English'],['hi','हिन्दी'],['ta','தமிழ்'],['te','తెలుగు'],['bn','বাংলা'],['mr','मराठी'],['pa','ਪੰਜਾਬੀ'],['gu','ગુજરાતી'],['kn','ಕನ್ನಡ'],['ml','മലയാളം'],['ur','اردو']] as [SupportedLanguage,string][];
  const go = (tab: MainNavTab) => { onSelectTab(tab); setMenuOpen(false); };
  return <>
    <header className="cine-header">
      <div className="cine-header-inner">
        <div className="cine-nav-left">
          <button className="cine-menu-button" onClick={() => setMenuOpen(v => !v)} aria-label="Open navigation">{menuOpen ? <X size={19}/> : <Menu size={19}/>}</button>
          <button onClick={() => go('home')} className="cine-brand" aria-label="Cineosync Music home"><span className="cine-brand-mark"><span/></span><span className="cine-brand-copy"><strong>Cineosync</strong><small>Music</small></span></button>
        </div>
        <div className="cine-search-wrap"><Search size={16}/><input value={searchQuery} onFocus={() => go('search')} onChange={e => { onSearchChange(e.target.value); onSelectTab('search'); }} placeholder="Search artists, moods, music" aria-label="Search" />{searchQuery && <button onClick={() => onSearchChange('')} aria-label="Clear search"><X size={14}/></button>}</div>
        <div className="cine-nav-actions">
          {activeRoom && <button className="cine-live-chip" onClick={() => go('sessions')}><span/> {activeRoom.participants.length} listening</button>}
          <button className="cine-nav-utility" onClick={onOpenAiGenerator} aria-label="Create a smart mix" title="Create a smart mix"><Sparkles size={17}/></button>
          {onOpenEqualizer && <button className="cine-nav-utility cine-desktop-only" onClick={onOpenEqualizer} aria-label="Equalizer" title="Equalizer"><SlidersHorizontal size={17}/></button>}
          <div className="cine-language-wrap cine-desktop-only"><button className="cine-language" onClick={() => setLanguageOpen(v => !v)} aria-label="Language"><Languages size={14}/>{language.toUpperCase()}</button>{languageOpen && <div className="cine-popover right-0 top-11 w-48"><p className="cine-popover-label">Language</p>{languages.map(([code,label]) => <button key={code} onClick={() => { onLanguageChange(code); setLanguageOpen(false); }} className={language === code ? 'is-selected' : ''}><span>{label}</span><span>{code.toUpperCase()}</span></button>)}</div>}</div>
          <button onClick={() => go('profile')} className="cine-avatar-button" aria-label="Profile"><span>CS</span></button>
        </div>
      </div>
    </header>
    {menuOpen && <div className="cine-mobile-drawer"><div className="cine-mobile-search"><Search size={16}/><input value={searchQuery} onChange={e => { onSearchChange(e.target.value); go('search'); }} placeholder="Search music"/></div><div className="cine-mobile-nav-grid">{nav.map(({id,label,icon:Icon}) => <button key={id} onClick={() => go(id)} className={currentTab===id?'is-active':''}><Icon size={17}/><span>{label}</span></button>)}</div><button className="cine-mobile-mode" onClick={() => go('focus')}><Timer size={16}/><span>Focus</span>{focusTimerRunning && <b>LIVE</b>}</button></div>}
    <nav className="cine-bottom-nav" aria-label="Primary navigation">{nav.map(({id,label,icon:Icon}) => { const active=currentTab===id; return <button key={id} onClick={() => go(id)} className={active?'is-active':''} aria-current={active?'page':undefined}><span className="cine-bottom-icon"><Icon size={18} strokeWidth={active?2.25:1.7}/></span><span>{label}</span>{id==='sessions'&&activeRoom&&<i/>}</button>; })}</nav>
  </>;
};
