import type { Playlist, Song, UserProfile } from '../types';

const PREFIX = 'syncbeat:v2:';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Storage can be unavailable or full; playback must never depend on it.
  }
}

export interface ListeningHistoryItem {
  song: Song;
  playedAt: number;
  source: 'search' | 'queue' | 'playlist' | 'session' | 'unknown';
}

export interface SessionHistoryItem {
  roomId: string;
  roomName: string;
  joinedAt: number;
  durationSeconds: number;
}

export const persistenceService = {
  getLikedIds(): string[] {
    return read<string[]>('liked', []);
  },
  setLikedIds(ids: Iterable<string>): void {
    write('liked', Array.from(new Set(ids)));
  },
  getPlaylists(): Playlist[] {
    return read<Playlist[]>('playlists', []);
  },
  setPlaylists(playlists: Playlist[]): void {
    write('playlists', playlists);
  },
  getProfile(): UserProfile | null {
    return read<UserProfile | null>('profile', null);
  },
  setProfile(profile: UserProfile): void {
    write('profile', profile);
  },
  getHistory(limit = 100): ListeningHistoryItem[] {
    return read<ListeningHistoryItem[]>('history', []).slice(0, limit);
  },
  addHistory(item: ListeningHistoryItem): void {
    const existing = read<ListeningHistoryItem[]>('history', []);
    const deduped = existing.filter((entry) => !(entry.song.id === item.song.id && entry.playedAt > item.playedAt - 30000));
    write('history', [item, ...deduped].slice(0, 100));
  },
  clearHistory(): void {
    write('history', []);
  },
  getSessionHistory(limit = 50): SessionHistoryItem[] {
    return read<SessionHistoryItem[]>('sessions', []).slice(0, limit);
  },
  addSessionHistory(item: SessionHistoryItem): void {
    const existing = read<SessionHistoryItem[]>('sessions', []);
    write('sessions', [item, ...existing.filter((entry) => entry.roomId !== item.roomId)].slice(0, 50));
  },
  clearAllUserData(): void {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(PREFIX))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage failures.
    }
  },
};
