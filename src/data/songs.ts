import type { Song, Playlist } from '../types';

/**
 * Remove state created by the old AI-generated demo catalog without touching
 * real YouTube imports (which use yt-* ids). This runs once before App state
 * is initialized because App imports this module first.
 */
function migrateAwayFromDemoCatalog() {
  if (typeof window === 'undefined') return;
  const isDemoSongId = (id: string) => id.startsWith('song-');

  try {
    const imported = JSON.parse(localStorage.getItem('syncbeat_imported_songs') || '[]') as Song[];
    const realImported = imported.filter((song) => !isDemoSongId(song.id));
    localStorage.setItem('syncbeat_imported_songs', JSON.stringify(realImported));
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
    const cleaned = playlists.map((playlist) => ({
      ...playlist,
      songIds: playlist.songIds.filter((id) => !isDemoSongId(id)),
    }));
    localStorage.setItem('syncbeat_custom_playlists', JSON.stringify(cleaned));
  } catch {}
}

migrateAwayFromDemoCatalog();

/** No bundled/demo music. Real tracks come from YouTube search/import flows. */
export const initialSongs: Song[] = [];

/** No bundled/demo playlists. */
export const defaultPlaylists: Playlist[] = [];
