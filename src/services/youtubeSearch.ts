/// <reference types="vite/client" />

import type { Song, SupportedLanguage } from '../types';
import { initialSongs } from '../data/songs';

export interface YouTubeSearchResult {
  songs: Song[];
  nextPageToken?: string;
}

const API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey(): string {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
  if (!key) throw new Error('YouTube search is not configured. Add VITE_YOUTUBE_API_KEY to the environment.');
  return key;
}

function parseDuration(value: string): number {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function inferLanguage(title: string): { language: SupportedLanguage | 'multi'; label: string } {
  if (/[ऀ-ॿ]/.test(title)) return { language: 'hi', label: 'Hindi' };
  if (/[஀-௿]/.test(title)) return { language: 'ta', label: 'Tamil' };
  if (/[ఀ-౿]/.test(title)) return { language: 'te', label: 'Telugu' };
  if (/[਀-੿]/.test(title)) return { language: 'pa', label: 'Punjabi' };
  return { language: 'en', label: 'English / International' };
}

function rememberRealTracks(songs: Song[]) {
  const existing = new Set(initialSongs.map((song) => song.id));
  songs.forEach((song) => {
    if (!existing.has(song.id)) initialSongs.push(song);
  });

  try {
    const saved = JSON.parse(localStorage.getItem('syncbeat_imported_songs') || '[]') as Song[];
    const byId = new Map(saved.map((song) => [song.id, song]));
    songs.forEach((song) => byId.set(song.id, song));
    localStorage.setItem('syncbeat_imported_songs', JSON.stringify(Array.from(byId.values()).slice(-250)));
  } catch {}
}

export async function searchYouTubeMusic(query: string, maxResults = 15): Promise<YouTubeSearchResult> {
  const q = query.trim();
  if (!q) return { songs: [] };

  const key = getApiKey();
  const params = new URLSearchParams({
    part: 'snippet', q, type: 'video',
    maxResults: String(Math.min(Math.max(maxResults, 1), 25)),
    videoEmbeddable: 'true', videoSyndicated: 'true', videoDuration: 'any',
    safeSearch: 'moderate', regionCode: 'IN', key,
  });

  const searchResponse = await fetch(`${API_BASE}/search?${params.toString()}`);
  if (!searchResponse.ok) {
    const error = await searchResponse.json().catch(() => ({}));
    throw new Error(error?.error?.message || `YouTube search failed (${searchResponse.status})`);
  }

  const searchData = await searchResponse.json();
  const ids = (searchData.items || []).map((item: any) => item.id?.videoId).filter(Boolean);
  if (!ids.length) return { songs: [], nextPageToken: searchData.nextPageToken };

  const detailsParams = new URLSearchParams({ part: 'contentDetails,status,snippet', id: ids.join(','), key });
  const detailsResponse = await fetch(`${API_BASE}/videos?${detailsParams.toString()}`);
  if (!detailsResponse.ok) {
    const error = await detailsResponse.json().catch(() => ({}));
    throw new Error(error?.error?.message || `YouTube video metadata failed (${detailsResponse.status})`);
  }

  const detailsData = await detailsResponse.json();
  const detailsById = new Map((detailsData.items || []).map((item: any) => [item.id, item]));

  const songs: Song[] = ids
    .map((id: string) => detailsById.get(id))
    .filter((item: any) => item?.status?.embeddable !== false)
    .map((item: any) => {
      const title = item.snippet?.title || 'YouTube Track';
      const artist = item.snippet?.channelTitle || 'YouTube';
      const lang = inferLanguage(title);
      const duration = parseDuration(item.contentDetails?.duration || 'PT0S');
      const coverArt = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
      return {
        id: `yt-search-${item.id}`,
        title,
        artist,
        album: 'YouTube',
        duration: duration || 210,
        coverArt,
        language: lang.language,
        languageLabel: lang.label,
        mood: ['vibe'],
        genre: 'YouTube',
        source: 'youtube',
        sourceId: item.id,
      } as Song;
    });

  rememberRealTracks(songs);
  return { songs, nextPageToken: searchData.nextPageToken };
}
