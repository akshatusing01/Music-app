import type { Song, Playlist } from '../types';

/**
 * The application intentionally ships without demo music.
 * Real tracks are discovered through the YouTube Data API and imported
 * through the supported playlist/import flows.
 */
export const initialSongs: Song[] = [];

/** No fake/demo playlists are bundled with the product. */
export const defaultPlaylists: Playlist[] = [];
