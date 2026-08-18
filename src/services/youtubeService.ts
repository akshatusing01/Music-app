import { Playlist, Song } from '../types';

export const YOUTUBE_SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
export interface YouTubeUser { email?: string | null; displayName?: string | null; }
export interface YouTubeAuthResult { user: YouTubeUser; accessToken: string; }
export interface YouTubePlaylistMeta { id: string; title: string; description: string; thumbnailUrl: string; itemCount: number; privacyStatus: string; channelTitle: string; }
export interface YouTubePlaylistItem { id: string; videoId: string; title: string; artist: string; thumbnailUrl: string; durationSeconds?: number; }

let cachedAccessToken: string | null = null;
const getApiKey = () => (import.meta.env.VITE_YOUTUBE_API_KEY || '').trim();

export const initYouTubeAuth = (onAuthSuccess?: (user: YouTubeUser, token: string) => void, onAuthFailure?: () => void) => {
  if (cachedAccessToken) onAuthSuccess?.({ email: null, displayName: 'YouTube user' }, cachedAccessToken);
  else onAuthFailure?.();
  return () => undefined;
};

export const signInWithYouTubeGoogle = async (): Promise<YouTubeAuthResult | null> => {
  throw new Error('YouTube account import requires an official Google/YouTube OAuth client configuration. Public playlist links do not require sign-in.');
};
export const getYouTubeAccessToken = () => cachedAccessToken;
export const setYouTubeAccessToken = (token: string | null) => { cachedAccessToken = token; };
export const logoutYouTube = async () => { cachedAccessToken = null; };

export const extractYouTubePlaylistId = (urlOrId: string): string | null => {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;
  if (/^[A-Za-z0-9_-]{10,64}$/.test(trimmed) && !trimmed.includes('http') && !trimmed.includes('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    const list = parsed.searchParams.get('list');
    if (list) return list;
    const parts = parsed.pathname.split('/');
    const idx = parts.indexOf('playlist');
    return idx >= 0 ? parts[idx + 1] || null : null;
  } catch { return trimmed.match(/[?&]list=([A-Za-z0-9_-]+)/)?.[1] || null; }
};

const youtubeFetch = async (url: string, accessToken?: string | null) => {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `YouTube API Error (${res.status})`);
  }
  return res.json();
};

export const fetchPublicYouTubePlaylist = async (playlistId: string): Promise<{ meta: YouTubePlaylistMeta; tracks: YouTubePlaylistItem[] }> => {
  const key = getApiKey();
  if (!key) throw new Error('YouTube playlist import needs VITE_YOUTUBE_API_KEY.');
  const metaData = await youtubeFetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails,status&id=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(key)}`);
  const metaItem = metaData.items?.[0];
  if (!metaItem) throw new Error('YouTube playlist was not found or is private.');
  const meta: YouTubePlaylistMeta = {
    id: metaItem.id, title: metaItem.snippet?.title || 'Untitled YouTube Playlist', description: metaItem.snippet?.description || '',
    thumbnailUrl: metaItem.snippet?.thumbnails?.high?.url || metaItem.snippet?.thumbnails?.medium?.url || metaItem.snippet?.thumbnails?.default?.url || '',
    itemCount: metaItem.contentDetails?.itemCount || 0, privacyStatus: metaItem.status?.privacyStatus || 'public', channelTitle: metaItem.snippet?.channelTitle || 'YouTube',
  };
  const tracks: YouTubePlaylistItem[] = [];
  let pageToken = '';
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails'); url.searchParams.set('playlistId', playlistId); url.searchParams.set('maxResults', '50'); url.searchParams.set('key', key);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const data = await youtubeFetch(url.toString());
    for (const item of data.items || []) {
      const title = item.snippet?.title; const videoId = item.contentDetails?.videoId;
      if (!title || !videoId || ['Private video', 'Deleted video'].includes(title)) continue;
      const channel = (item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || 'YouTube').replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim();
      const parts = title.split(' - ');
      tracks.push({ id: item.id, videoId, title: parts.length > 1 ? parts.slice(1).join(' - ').trim() : title, artist: parts.length > 1 ? parts[0].trim() : channel,
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '' });
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  if (!tracks.length) throw new Error('This YouTube playlist contains no playable public videos.');
  return { meta, tracks };
};

export const fetchUserPlaylists = async (accessToken: string): Promise<YouTubePlaylistMeta[]> => {
  const data = await youtubeFetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails,status&mine=true&maxResults=50', accessToken);
  return (data.items || []).map((item: any) => ({ id: item.id, title: item.snippet?.title || 'Untitled YouTube Playlist', description: item.snippet?.description || '', thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '', itemCount: item.contentDetails?.itemCount || 0, privacyStatus: item.status?.privacyStatus || 'public', channelTitle: item.snippet?.channelTitle || 'YouTube Music' }));
};

export const fetchPlaylistTracks = async (accessToken: string, playlistId: string): Promise<YouTubePlaylistItem[]> => {
  const data = await youtubeFetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(playlistId)}&maxResults=50`, accessToken);
  return (data.items || []).filter((item: any) => item.snippet?.title && !['Private video', 'Deleted video'].includes(item.snippet.title) && item.contentDetails?.videoId).map((item: any) => {
    const title = item.snippet.title; const channel = (item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || 'YouTube Music').replace(/ - Topic$/i, '').replace(/VEVO$/i, ''); const parts = title.split(' - ');
    return { id: item.id, videoId: item.contentDetails.videoId, title: parts.length > 1 ? parts.slice(1).join(' - ').trim() : title, artist: parts.length > 1 ? parts[0].trim() : channel, thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '' };
  });
};

export const playlistItemToSong = (item: YouTubePlaylistItem): Song => ({ id: item.videoId, title: item.title, artist: item.artist, duration: item.durationSeconds ?? 0, coverArt: item.thumbnailUrl, language: 'en', languageLabel: 'English', mood: 'chill', tags: ['YouTube'], youtubeVideoId: item.videoId, sourceProvider: 'YouTube', lyrics: [] });
export const convertYouTubeTracksToSongs = (tracks: YouTubePlaylistItem[]): Song[] => tracks.map(playlistItemToSong);
export const playlistMetaToPlaylist = (meta: YouTubePlaylistMeta, tracks: YouTubePlaylistItem[]): Playlist => ({ id: `imported-youtube-${meta.id}`, title: meta.title, description: meta.description, coverArt: meta.thumbnailUrl, songIds: tracks.map((track) => track.videoId), mood: 'all', isCurated: false, creatorName: meta.channelTitle, platformSource: 'YouTube' });
