import React, { useState } from 'react';
import {
  Radio,
  Search,
  Languages,
  Palette,
  Wifi,
  WifiOff,
  Users,
  Timer,
  FolderDown,
  ChevronDown,
  Sparkles,
  Home,
  User,
  Sliders,
  X,
  Menu,
  Heart,
  Compass,
  Cast,
  Play,
} from 'lucide-react';
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

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  experienceMode = 'love',
  onSelectExperience,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  searchQuery,
  onSearchChange,
  activeRoom,
  latencyMs,
  isOfflineMode,
  onToggleOfflineMode,
  focusTimerRunning,
  onOpenAiGenerator,
  onOpenEqualizer,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language] || translations.en;

  const languagesList: { code: SupportedLanguage; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'ur', label: 'Urdu', native: 'اردو' },
  ];

  const primaryNavItems: { id: MainNavTab; label: string; icon: any }[] = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'search', label: t.search, icon: Search },
    { id: 'sessions', label: t.sessions, icon: Users },
    { id: 'focus', label: t.focus, icon: Timer },
    { id: 'library', label: t.library, icon: FolderDown },
    { id: 'profile', label: t.profile, icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030303]/95 backdrop-blur-xl border-b border-white/[0.08] transition-colors">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 md:gap-6">
        {/* Left: YouTube Music Logo & Branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div
            id="nav-brand-logo"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 cursor-pointer group shrink-0 select-none"
          >
            {/* YouTube Music Icon (Red Circle with Play Triangle) */}
            <div className="w-8 h-8 rounded-full bg-[#ff0000] flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
              <div className="w-6 h-6 rounded-full border-[1.5px] border-white/90 flex items-center justify-center">
                <Play size={10} fill="#ffffff" className="text-white translate-x-[1px]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white flex items-center">
                Music
              </span>
              <span className="text-[10px] uppercase font-semibold text-zinc-400">
                SyncBeat
              </span>
            </div>
          </div>
        </div>

        {/* Center: YouTube Music Pill Search Bar */}
        <div className="flex-1 max-w-xl relative hidden sm:block">
          <div className="relative flex items-center">
            <Search size={17} className="absolute left-4 text-zinc-400 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (currentTab !== 'search') onSelectTab('search');
              }}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (currentTab !== 'search') onSelectTab('search');
              }}
              placeholder="Search songs, albums, artists, podcasts, lyrics..."
              className="w-full pl-11 pr-10 py-2.5 text-sm rounded-full bg-[#212121] hover:bg-[#282828] focus:bg-[#121212] border border-white/[0.08] focus:border-white/30 text-white placeholder-zinc-400 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Icons: Live Sync, AI Mix, Equalizer, Cast, Language, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Real-Time Sync Status Chip */}
          <button
            onClick={() => onSelectTab('sessions')}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
              activeRoom
                ? 'bg-red-500/15 border-red-500/40 text-red-300 shadow-sm shadow-red-500/20'
                : 'bg-white/[0.05] border-white/[0.08] text-zinc-300 hover:bg-white/10'
            }`}
            title="Real-Time Sync Engine"
          >
            <span className={`w-2 h-2 rounded-full ${activeRoom ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="font-semibold">{activeRoom ? `${activeRoom.participants.length} Synced` : `${latencyMs}ms`}</span>
          </button>

          {/* AI Generator Button */}
          <button
            onClick={onOpenAiGenerator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600/20 to-purple-600/20 hover:from-red-600/30 hover:to-purple-600/30 border border-red-500/30 text-xs font-semibold text-red-200 transition-all"
            title="Gemini AI Smart Mix Generator"
          >
            <Sparkles size={14} className="text-red-400" />
            <span className="hidden lg:inline">AI Mix</span>
          </button>

          {/* Equalizer Quick Button */}
          <button
            onClick={onOpenEqualizer}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            title="10-Band Equalizer"
          >
            <Sliders size={18} />
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setThemeMenuOpen(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs text-zinc-200 transition-colors"
              title={t.languageSelect}
            >
              <Languages size={14} className="text-zinc-400" />
              <span className="font-semibold">{languagesList.find((l) => l.code === language)?.native || 'EN'}</span>
              <ChevronDown size={12} className="text-zinc-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#1e1e1e] border border-white/15 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-zinc-400 border-b border-white/10">
                  {t.languageSelect} (Regional)
                </div>
                <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
                  {languagesList.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors ${
                        language === lang.code
                          ? 'bg-red-500/20 text-red-300 font-bold'
                          : 'text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{lang.native}</span>
                      <span className="text-[10px] text-zinc-400">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <button
            onClick={() => onSelectTab('profile')}
            className={`p-0.5 rounded-full border-2 transition-all ${
              currentTab === 'profile'
                ? 'border-red-500 ring-2 ring-red-500/30'
                : 'border-transparent hover:border-white/40'
            }`}
            title="Account & Profile"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 py-3 bg-[#0f0f0f] border-b border-white/10 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-3 gap-2">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-semibold gap-1 transition-all ${
                    isActive
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-red-500' : 'text-zinc-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Experience Pills in Mobile Menu */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'love', label: 'Romance 💕' },
              { id: 'focus', label: 'Focus ☕' },
              { id: 'gym', label: 'Workout ⚡' },
              { id: 'friends', label: 'Party 🪩' },
              { id: 'chill', label: 'Relax 🌙' },
              { id: 'bollywood', label: 'Bollywood 🎙️' },
            ].map((exp) => (
              <button
                key={exp.id}
                onClick={() => {
                  onSelectExperience?.(exp.id as ExperienceMode);
                  if (exp.id === 'focus') onSelectTab('focus');
                  else onSelectTab('home');
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  experienceMode === exp.id
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {exp.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
