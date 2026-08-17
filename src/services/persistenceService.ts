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
    // Persistence is best-effort; playback must never depend on storage.
  }
}

function migrateLegacy<T>(legacyKey: string, key: string, fallback: T): T {
  const current = read<T | null>(key, null);
  if (current !== null) return current as T;
  try {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    write(key, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

export interface ListeningHistoryItem {
  song: Song;
  playedAt: number;
  source: 'search' | 'queue' | 'playlist' | 'session' | 'app' | 'unknown';
}

export interface SessionHistoryItem {
  roomId: string;
  roomName: string;
  joinedAt: number;
  durationSeconds: number;
}

function notify(name: string): void {
  try { window.dispatchEvent(new CustomEvent(name)); } catch { /* non-browser */ }
}

export const persistenceService = {
  getLikedIds(): string[] {
    return migrateLegacy<string[]>('syncbeat_liked_songs', 'liked', []);
  },
  setLikedIds(ids: Iterable<string>): void {
    write('liked', Array.from(new Set(ids)));
    notify('syncbeat:library-updated');
  },
  toggleLikedId(id: string): boolean {
    const ids = new Set(this.getLikedIds());
    const liked = !ids.has(id);
    liked ? ids.add(id) : ids.delete(id);
    this.setLikedIds(ids);
    return liked;
  },
  getPlaylists(): Playlist[] {
    return migrateLegacy<Playlist[]>('syncbeat_custom_playlists', 'playlists', []);
  },
  setPlaylists(playlists: Playlist[]): void {
    write('playlists', playlists);
    notify('syncbeat:playlists-updated');
  },
  createPlaylist(input: Omit<Playlist, 'id'>): Playlist {
    const playlist: Playlist = { ...input, id: `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    this.setPlaylists([playlist, ...this.getPlaylists()]);
    return playlist;
  },
  updatePlaylist(id: string, patch: Partial<Playlist>): Playlist | null {
    let result: Playlist | null = null;
    const playlists = this.getPlaylists().map((playlist) => {
      if (playlist.id !== id) return playlist;
      result = { ...playlist, ...patch, id: playlist.id };
      return result;
    });
    if (result) this.setPlaylists(playlists);
    return result;
  },
  deletePlaylist(id: string): void {
    this.setPlaylists(this.getPlaylists().filter((playlist) => playlist.id !== id));
  },
  addSongToPlaylist(id: string, songId: string): Playlist | null {
    const playlist = this.getPlaylists().find((item) => item.id === id);
    if (!playlist) return null;
    return this.updatePlaylist(id, { songIds: playlist.songIds.includes(songId) ? playlist.songIds : [...playlist.songIds, songId] });
  },
  removeSongFromPlaylist(id: string, songId: string): Playlist | null {
    const playlist = this.getPlaylists().find((item) => item.id === id);
    if (!playlist) return null;
    return this.updatePlaylist(id, { songIds: playlist.songIds.filter((item) => item !== songId) });
  },
  getProfile(): UserProfile | null {
    return migrateLegacy<UserProfile | null>('syncbeat_user_profile', 'profile', null);
  },
  setProfile(profile: UserProfile): void {
    write('profile', profile);
    notify('syncbeat:profile-updated');
  },
  getHistory(limit = 100): ListeningHistoryItem[] {
    return read<ListeningHistoryItem[]>('history', []).slice(0, Math.max(1, limit));
  },
  addHistory(item: ListeningHistoryItem): void {
    const existing = read<ListeningHistoryItem[]>('history', []);
    const deduped = existing.filter((entry) => !(entry.song.id === item.song.id && entry.playedAt > item.playedAt - 30000));
    write('history', [item, ...deduped].slice(0, 100));
    notify('syncbeat:history-updated');
  },
  clearHistory(): void {
    write('history', []);
    notify('syncbeat:history-updated');
  },
  getSessionHistory(limit = 50): SessionHistoryItem[] {
    return read<SessionHistoryItem[]>('sessions', []).slice(0, Math.max(1, limit));
  },
  addSessionHistory(item: SessionHistoryItem): void {
    const existing = read<SessionHistoryItem[]>('sessions', []);
    write('sessions', [item, ...existing.filter((entry) => entry.roomId !== item.roomId)].slice(0, 50));
    notify('syncbeat:sessions-updated');
  },
  clearAllUserData(): void {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(PREFIX) || key.startsWith('syncbeat_'))
        .forEach((key) => localStorage.removeItem(key));
      notify('syncbeat:library-updated');
      notify('syncbeat:playlists-updated');
      notify('syncbeat:profile-updated');
      notify('syncbeat:history-updated');
      notify('syncbeat:sessions-updated');
    } catch {
      // Ignore storage failures.
    }
  },
};
