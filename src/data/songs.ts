import type { Song, Playlist, UserProfile } from '../types';

/**
 * Remove state created by the old AI-generated demo catalog without touching
 * real YouTube imports (which use yt-* ids). This runs before App initializes.
 */
function migrateAwayFromDemoCatalog() {
  if (typeof window === 'undefined') return;
  const isDemoSongId = (id: string) => id.startsWith('song-');

  try {
    const imported = JSON.parse(localStorage.getItem('syncbeat_imported_songs') || '[]') as Song[];
    localStorage.setItem('syncbeat_imported_songs', JSON.stringify(imported.filter((song) => !isDemoSongId(song.id))));
  } catch {}

  try {
    const liked = JSON.parse(localStorage.getItem('syncbeat_liked_songs') || '[]') as string[];
    localStorage.setItem('syncbeat_liked_songs', JSON.stringify(liked.filter((id) => !isDemoSongId(id))));
  } catch {}

  try {
    const downloaded = JSON.parse(localStorage.getItem('syncbeat_downloaded_songs') || '[]') as string[];
    localStorage.setItem('syncbeat_downloaded_songs', JSON.stringify(downloaded.filter((id) => !isDemoSongId(id))));
  } catch {}

  try {
    const playlists = JSON.parse(localStorage.getItem('syncbeat_custom_playlists') || '[]') as Playlist[];
    localStorage.setItem('syncbeat_custom_playlists', JSON.stringify(playlists.map((playlist) => ({
      ...playlist,
      songIds: playlist.songIds.filter((id) => !isDemoSongId(id)),
    }))));
  } catch {}

  try {
    const rawProfile = localStorage.getItem('syncbeat_user_profile');
    if (!rawProfile) {
      const cleanProfile: UserProfile = {
        id: 'user-' + Math.random().toString(36).slice(2, 9),
        name: 'You',
        avatar: '',
        statusMessage: '',
        presenceMode: 'available-to-join',
        language: 'en',
        theme: 'neon-obsidian',
        quality: 'high-320k',
        isWifiOnlyDownloads: false,
        favoriteGenres: [],
        stats: { minutesListened: 0, sessionsJoined: 0, focusHours: 0, streakDays: 0 },
      };
      localStorage.setItem('syncbeat_user_profile', JSON.stringify(cleanProfile));
    }
  } catch {}

  // Search starts empty rather than showing fabricated history.
  try { localStorage.setItem('syncbeat_recent_searches', '[]'); } catch {}
}

migrateAwayFromDemoCatalog();

/** No bundled/demo music. Real tracks come from YouTube search/import flows. */
export const initialSongs: Song[] = [];

/** No bundled/demo playlists. */
export const defaultPlaylists: Playlist[] = [];
