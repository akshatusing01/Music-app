import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GlassIconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  glowColor?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'amber' | 'cyan' | 'coral' | 'violet';
}

export const GlassIcon: React.FC<GlassIconProps> = ({
  icon: Icon,
  size = 20,
  className = '',
  variant = 'primary',
}) => {
  const variantStyles = {
    primary: 'from-rose-500/15 via-rose-500/10 to-pink-600/15 text-rose-300 border-rose-500/25 shadow-rose-500/10',
    secondary: 'from-indigo-500/15 via-purple-500/10 to-indigo-600/15 text-indigo-300 border-indigo-500/25 shadow-indigo-500/10',
    accent: 'from-amber-500/15 via-orange-500/10 to-amber-600/15 text-amber-300 border-amber-500/25 shadow-amber-500/10',
    danger: 'from-red-500/15 via-rose-600/10 to-red-600/15 text-red-300 border-red-500/25 shadow-red-500/10',
    success: 'from-emerald-500/15 via-teal-500/10 to-emerald-600/15 text-emerald-300 border-emerald-500/25 shadow-emerald-500/10',
    amber: 'from-yellow-500/15 via-amber-600/10 to-yellow-600/15 text-yellow-300 border-yellow-500/25 shadow-yellow-500/10',
    cyan: 'from-cyan-500/15 via-blue-500/10 to-cyan-600/15 text-cyan-300 border-cyan-500/25 shadow-cyan-500/10',
    coral: 'from-orange-500/15 via-rose-500/10 to-orange-600/15 text-orange-300 border-orange-500/25 shadow-orange-500/10',
    violet: 'from-violet-500/15 via-purple-500/10 to-fuchsia-600/15 text-violet-300 border-violet-500/25 shadow-violet-500/10',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center p-2 rounded-xl backdrop-blur-md bg-gradient-to-br border shadow-sm transition-all duration-300 ${variantStyles[variant]} ${className}`}
    >
      <div className="absolute inset-0 rounded-xl bg-white/[0.03] pointer-events-none" />
      <Icon size={size} className="relative z-10 drop-shadow-sm shrink-0" />
    </div>
  );
};
