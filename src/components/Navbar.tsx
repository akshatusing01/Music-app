import React, { useState } from 'react';
import { Compass, Home, Languages, Menu, Search, Sparkles, Users, X, SlidersHorizontal, Library, UserRound, Timer } from 'lucide-react';
import { SupportedLanguage, AppTheme, MainNavTab, RoomState, ExperienceMode } from '../types';
import { translations } from '../data/translations';

interface NavbarProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  experienceMode?: ExperienceMode;
  onSelectExperience?: (mode: ExperienceMode) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeRoom: RoomState | null;
  latencyMs: number;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  focusTimerRunning: boolean;
  onOpenAiGenerator: () => void;
  onOpenEqualizer?: () => void;
}

const nav = [
  { id: 'home' as MainNavTab, label: 'Home', icon: Home },
  { id: 'search' as MainNavTab, label: 'Discover', icon: Compass },
  { id: 'sessions' as MainNavTab, label: 'Sessions', icon: Users },
  { id: 'library' as MainNavTab, label: 'Library', icon: Library },
  { id: 'profile' as MainNavTab, label: 'Profile', icon: UserRound },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  language,
  onLanguageChange,
  searchQuery,
  onSearchChange,
  activeRoom,
  latencyMs,
  focusTimerRunning,
  onOpenAiGenerator,
  onOpenEqualizer,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const t = translations[language] || translations.en;
  const languages = [
    ['en', 'English'], ['hi', 'हिन्दी'], ['ta', 'தமிழ்'], ['te', 'తెలుగు'], ['bn', 'বাংলা'],
    ['mr', 'मराठी'], ['pa', 'ਪੰਜਾਬੀ'], ['gu', 'ગુજરાતી'], ['kn', 'ಕನ್ನಡ'], ['ml', 'മലയാളം'], ['ur', 'اردو'],
  ] as [SupportedLanguage, string][];

  const go = (tab: MainNavTab) => {
    onSelectTab(tab);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="cine-header">
        <div className="cine-header-inner">
          <div className="flex items-center gap-3 min-w-0">
            <button className="cine-icon-button lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Open menu">
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            <button onClick={() => go('home')} className="cine-brand" aria-label="Cineosync Music home">
              <span className="cine-brand-mark" aria-hidden="true"><span /></span>
              <span className="cine-brand-copy"><strong>Cineosync</strong><small>Music</small></span>
            </button>
          </div>

          <div className="cine-search-wrap">
            <Search size={17} aria-hidden="true" />
            <input
              id="global-search-input"
              value={searchQuery}
              onFocus={() => go('search')}
              onChange={(e) => { onSearchChange(e.target.value); if (currentTab !== 'search') onSelectTab('search'); }}
              placeholder="Search music, artists, moods…"
              aria-label="Search music, artists, moods"
            />
            {searchQuery && <button onClick={() => onSearchChange('')} aria-label="Clear search"><X size={15} /></button>}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button className={`cine-status hidden md:flex ${activeRoom ? 'is-live' : ''}`} onClick={() => go('sessions')} title="Listening session status">
              <span className="cine-status-dot" />
              {activeRoom ? `${activeRoom.participants.length} listening` : `${latencyMs}ms`}
            </button>
            <button className="cine-icon-button hidden sm:flex" onClick={onOpenAiGenerator} aria-label="Create smart mix" title="Smart Mix"><Sparkles size={17} /></button>
            {onOpenEqualizer && <button className="cine-icon-button hidden sm:flex" onClick={onOpenEqualizer} aria-label="Equalizer" title="Equalizer"><SlidersHorizontal size={17} /></button>}
            <div className="relative hidden sm:block">
              <button className="cine-language" onClick={() => setLanguageOpen((v) => !v)} aria-label="Language"><Languages size={15} /><span>{language.toUpperCase()}</span></button>
              {languageOpen && (
                <div className="cine-popover right-0 top-11 w-48">
                  <p className="cine-popover-label">Language</p>
                  {languages.map(([code, label]) => (
                    <button key={code} onClick={() => { onLanguageChange(code); setLanguageOpen(false); }} className={language === code ? 'is-selected' : ''}>
                      <span>{label}</span><span className="text-[10px] opacity-45">{code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => go('profile')} className={`cine-avatar-button ${currentTab === 'profile' ? 'is-active' : ''}`} aria-label="Profile">
              <span>CS</span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="cine-mobile-drawer lg:hidden">
          <div className="cine-mobile-search">
            <Search size={16} />
            <input value={searchQuery} onChange={(e) => { onSearchChange(e.target.value); go('search'); }} placeholder="Search music…" aria-label="Search" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {nav.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => go(id)} className={`cine-mobile-nav-card ${currentTab === id ? 'is-active' : ''}`}>
                <Icon size={17} /><span>{label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => go('focus')} className="cine-mode-row"><Timer size={16} /><span>Focus mode</span>{focusTimerRunning && <span className="ml-auto text-xs text-emerald-300">LIVE</span>}</button>
        </div>
      )}

      <nav className="cine-bottom-nav lg:hidden" aria-label="Primary navigation">
        {nav.map(({ id, label, icon: Icon }) => {
          const active = currentTab === id;
          return <button key={id} onClick={() => go(id)} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>
            <span className="cine-bottom-icon"><Icon size={19} strokeWidth={active ? 2.3 : 1.7} /></span>
            <span>{label}</span>
            {id === 'sessions' && activeRoom && <i />}
          </button>;
        })}
      </nav>
    </>
  );
};
