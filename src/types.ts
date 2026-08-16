export type SupportedLanguage =
  | 'en'
  | 'hi'
  | 'ta'
  | 'te'
  | 'pa'
  | 'bn'
  | 'mr'
  | 'kn'
  | 'ml'
  | 'gu'
  | 'ur';

export type AppTheme =
  | 'neon-obsidian'
  | 'bollywood-ruby'
  | 'focus-emerald'
  | 'sapphire-gym'
  | 'chill-violet'
  | 'glass-light';

export type ExperienceMode =
  | 'standard'
  | 'love'
  | 'focus'
  | 'gym'
  | 'friends'
  | 'chill'
  | 'bollywood'
  | 'regional'
  | 'custom';

export type AudioQuality = 'data-saver-64k' | 'normal-128k' | 'high-320k';

export type SyncState = 'SYNCED' | 'SYNCING' | 'RECONNECTING' | 'OFFLINE';

export type MoodCategory =
  | 'all'
  | 'romance'
  | 'gym'
  | 'study'
  | 'party'
  | 'devotional'
  | 'indie'
  | 'chill'
  | 'regional'
  | 'bollywood';

export interface LyricLine {
  time: number; // in seconds
  text: string;
  transliteration?: string; // Romanized Hinglish/English script for regional songs
  translation?: string; // English translation of meaning
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  coverArt: string;
  language: SupportedLanguage | 'en' | 'hi' | 'ta' | 'te' | 'pa' | 'bn' | 'mr' | 'multi';
  languageLabel: string;
  mood: 'romance' | 'gym' | 'study' | 'party' | 'devotional' | 'indie' | 'chill';
  bpm?: number;
  tags: string[];
  audioUrl?: string;
  audioSynthPreset?: 'bollywood-strings' | 'lofi-rhodes' | 'gym-bass' | 'acoustic-guitar' | 'edm-synth' | 'ambient-flute' | 'tamil-kuthu';
  lyrics: LyricLine[];
  isDownloaded?: boolean;
  fileSizeBytes?: number;
  sourceProvider?: 'SyncBeat' | 'Spotify' | 'YouTube Music' | 'Apple Music' | 'Amazon Music';
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverArt: string;
  mood: MoodCategory;
  songIds: string[];
  isAiGenerated?: boolean;
  themeGradient?: string;
  isCurated?: boolean;
  creatorName?: string;
  platformSource?: 'Spotify' | 'YouTube' | 'Apple' | 'Amazon' | 'SyncBeat' | string;
  experienceMode?: ExperienceMode;
}

export interface RoomParticipant {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  joinedAt: number;
  lastPing: number;
  deviceType?: 'phone' | 'desktop' | 'tablet' | 'headphones';
  currentStatus?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  type: 'text' | 'reaction' | 'system' | 'sound' | 'moment';
  timestamp: number;
  reactionEmoji?: string;
  soundName?: string;
  trackPosition?: number; // e.g. 102 seconds -> "❤️ at 01:42"
  songTitle?: string;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  x: number; // 0 to 1 position
  createdAt: number;
}

export interface FocusTimerState {
  active: boolean;
  timerType: 'pomodoro' | 'stopwatch' | 'idle';
  duration: number; // total seconds (e.g. 1500 for 25m)
  remaining: number; // seconds left
  isRunning: boolean;
  startedAt: number | null;
  mode: 'work' | 'shortBreak' | 'longBreak';
  completedSessions: number;
  presetName?: '25/5' | '50/10' | '90min' | 'custom';
}

export interface StopwatchLap {
  lapNumber: number;
  lapTime: number; // in seconds
  overallTime: number; // in seconds
}

export interface AmbientSounds {
  rain: number; // 0 to 1 volume
  cafe: number;
  fire: number;
  templeBell: number;
  waves: number;
  whiteNoise: number;
}

export interface EqualizerPreset {
  name: string;
  gains: number[]; // 10 bands: 32Hz to 16kHz (-12dB to +12dB)
}

export interface RoomState {
  roomId: string;
  roomName: string;
  moodTheme: string;
  hostId: string;
  currentSongId: string | null;
  isPlaying: boolean;
  playbackPosition: number;
  playbackRate: number;
  lastStateUpdate: number;
  queue: string[];
  participants: RoomParticipant[];
  chatMessages: ChatMessage[];
  focusMode: {
    active: boolean;
    timerType: 'pomodoro' | 'stopwatch' | 'idle';
    duration: number;
    remaining: number;
    isRunning: boolean;
    startedAt: number | null;
  };
  isPublic: boolean;
  experienceMode?: ExperienceMode;
}

export interface ConnectedService {
  id: 'spotify' | 'youtube' | 'apple' | 'amazon' | 'jiosaavn';
  name: string;
  iconColor: string;
  isConnected: boolean;
  accountEmail?: string;
  importedPlaylistsCount: number;
  supportsPlaybackSync: boolean;
  supportsMetadataImport: boolean;
  note: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  statusMessage: string;
  presenceMode: 'listening-now' | 'in-focus' | 'available-to-join' | 'invisible';
  language: SupportedLanguage;
  theme: AppTheme;
  quality: AudioQuality;
  isWifiOnlyDownloads: boolean;
  favoriteGenres: string[];
  stats: {
    minutesListened: number;
    sessionsJoined: number;
    focusHours: number;
    streakDays: number;
  };
}

export type MainNavTab =
  | 'home'
  | 'search'
  | 'library'
  | 'sessions'
  | 'focus'
  | 'lyrics'
  | 'profile'
  | 'importer';
