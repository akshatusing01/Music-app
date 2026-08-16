import React from 'react';
import { Home, Compass, Library, Users, User } from 'lucide-react';
import { MainNavTab } from '../types';

interface MobileNavProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
}

const items: { id: MainNavTab; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Discover', icon: Compass },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'sessions', label: 'Rooms', icon: Users },
  { id: 'profile', label: 'You', icon: User },
];

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => (
  <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/[0.08]">
    <div className="max-w-lg mx-auto grid grid-cols-5 gap-1">
      {items.map(({ id, label, icon: Icon }) => {
        const active = currentTab === id;
        return (
          <button
            key={id}
            onClick={() => onSelectTab(id)}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 min-h-12 rounded-xl transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}
          >
            {active && <span className="absolute top-0 w-7 h-0.5 rounded-full bg-violet-400" />}
            <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
            <span className="text-[9px] font-semibold tracking-wide">{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
