import React, { useState } from 'react';
import {
  User,
  Shield,
  Radio,
  Sliders,
  Wifi,
  Sparkles,
  Link,
  CheckCircle,
  ExternalLink,
  Flame,
  Clock,
  Heart,
  Timer,
  Globe,
  Palette,
  HardDrive,
  Music,
} from 'lucide-react';
import { UserProfile, ConnectedService, AudioQuality, SupportedLanguage, AppTheme } from '../../types';
import { translations } from '../../data/translations';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onOpenEqualizer: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onOpenEqualizer,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [statusInput, setStatusInput] = useState(profile.statusMessage);

  const t = translations[language] || translations.en;

  const connectedServicesList: ConnectedService[] = [
    {
      id: 'spotify',
      name: 'Spotify',
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      isConnected: true,
      accountEmail: 'aarav.sharma@gmail.com',
      importedPlaylistsCount: 4,
      supportsPlaybackSync: true,
      supportsMetadataImport: true,
      note: 'Playback sync and playlist import active',
    },
    {
      id: 'youtube',
      name: 'YouTube Music',
      iconColor: 'text-red-400 bg-red-500/10 border-red-500/30',
      isConnected: true,
      accountEmail: 'aarav.sharma@gmail.com',
      importedPlaylistsCount: 2,
      supportsPlaybackSync: true,
      supportsMetadataImport: true,
      note: 'Indian Bollywood and Regional charts synchronized',
    },
    {
      id: 'apple',
      name: 'Apple Music',
      iconColor: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      isConnected: false,
      importedPlaylistsCount: 0,
      supportsPlaybackSync: false,
      supportsMetadataImport: true,
      note: 'Metadata & playlist matching supported',
    },
    {
      id: 'amazon',
      name: 'Amazon Prime Music',
      iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      isConnected: false,
      importedPlaylistsCount: 0,
      supportsPlaybackSync: false,
      supportsMetadataImport: true,
      note: 'Tracklist import supported',
    },
  ];

  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  ];

  const handleSaveProfile = () => {
    onUpdateProfile({
      name: nameInput.trim() || profile.name,
      statusMessage: statusInput.trim() || profile.statusMessage,
    });
    setEditingName(false);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-950/40 via-zinc-950/60 to-purple-950/40 border border-white/10 backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-rose-500/50 shadow-xl"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-zinc-950 shadow-sm" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{profile.name}</h1>
              <button
                onClick={() => setEditingName(!editingName)}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                {editingName ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <p className="text-xs text-zinc-300">{profile.statusMessage}</p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-emerald-400">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                ● Status: {profile.presenceMode.replace('-', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Listening Analytics Quick Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-center min-w-[80px]">
            <p className="text-base font-bold font-mono text-rose-400">{profile.stats.minutesListened}m</p>
            <p className="text-[9px] uppercase font-bold text-zinc-400">Listened</p>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-center min-w-[80px]">
            <p className="text-base font-bold font-mono text-purple-400">{profile.stats.sessionsJoined}</p>
            <p className="text-[9px] uppercase font-bold text-zinc-400">Sessions</p>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-center min-w-[80px]">
            <p className="text-base font-bold font-mono text-emerald-400">{profile.stats.focusHours}h</p>
            <p className="text-[9px] uppercase font-bold text-zinc-400">Focus Time</p>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-center min-w-[80px]">
            <p className="text-base font-bold font-mono text-amber-400">{profile.stats.streakDays}d</p>
            <p className="text-[9px] uppercase font-bold text-zinc-400">Streak 🔥</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Panel */}
      {editingName && (
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-white">Customize Identity & Avatar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Display Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-rose-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Vibe Status Message</label>
              <input
                type="text"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-rose-500/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 block">Choose Avatar</label>
            <div className="flex items-center gap-3">
              {avatars.map((av, idx) => (
                <img
                  key={idx}
                  src={av}
                  alt={`Avatar ${idx}`}
                  onClick={() => onUpdateProfile({ avatar: av })}
                  className={`w-12 h-12 rounded-2xl object-cover cursor-pointer transition-all border-2 ${
                    profile.avatar === av ? 'border-rose-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            className="px-5 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-md hover:bg-rose-600 transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Grid: Presence & Privacy (Left) + Connected Services (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Presence & Privacy Settings (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield size={18} className="text-emerald-400" />
              <span>Social Presence & Status</span>
            </h2>
            <p className="text-xs text-zinc-400">Control what friends see when you are listening</p>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'listening-now', label: 'Listening Now 🎵', desc: 'Broadcast currently playing track to friends' },
              { id: 'in-focus', label: 'In Focus Session ☕', desc: 'Show active Pomodoro / deep study status' },
              { id: 'available-to-join', label: 'Available to Join ✨', desc: 'Friends can tap to instantly join your stream' },
              { id: 'invisible', label: 'Invisible Mode 👻', desc: 'Listen privately without appearing in live lobbies' },
            ].map((pMode) => (
              <div
                key={pMode.id}
                onClick={() => onUpdateProfile({ presenceMode: pMode.id as any })}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  profile.presenceMode === pMode.id
                    ? 'bg-rose-500/15 border-rose-500/40 text-white'
                    : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">{pMode.label}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{pMode.desc}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    profile.presenceMode === pMode.id ? 'border-rose-500 bg-rose-500' : 'border-white/30'
                  }`}
                >
                  {profile.presenceMode === pMode.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            ))}
          </div>

          {/* Streaming Quality Selector */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Wifi size={14} className="text-rose-400" />
              <span>Audio Streaming Quality</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'data-saver-64k', label: 'Data Saver', sub: '64kbps Opus' },
                { id: 'normal-128k', label: 'Standard', sub: '128kbps AAC' },
                { id: 'high-320k', label: 'Studio Hi-Res', sub: '320kbps FLAC' },
              ].map((q) => (
                <button
                  key={q.id}
                  onClick={() => onUpdateProfile({ quality: q.id as AudioQuality })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    profile.quality === q.id
                      ? 'bg-rose-500 text-white border-rose-500 font-bold'
                      : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-bold">{q.label}</p>
                  <p className="text-[10px] text-zinc-400">{q.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Connected Music Services (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Link size={18} className="text-purple-400" />
              <span>Connected Music Services</span>
            </h2>
            <p className="text-xs text-zinc-400">Connect platforms to import playlists and metadata</p>
          </div>

          <div className="space-y-3">
            {connectedServicesList.map((service) => (
              <div
                key={service.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${service.iconColor} font-bold text-xs`}>
                    {service.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">{service.name}</h4>
                      {service.isConnected && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          CONNECTED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">{service.note}</p>
                  </div>
                </div>

                <button
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    service.isConnected
                      ? 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      : 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                  }`}
                >
                  {service.isConnected ? 'Manage' : 'Connect'}
                </button>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 text-xs text-zinc-300">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              SyncBeat connects securely via client OAuth tokens to mirror playlist tracklists into synchronized listen-together rooms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
