import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Playlist, Song } from '../types';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
];

const provider = new GoogleAuthProvider();
YOUTUBE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface YouTubePlaylistMeta {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  itemCount: number;
  privacyStatus: string;
  channelTitle: string;
}

export interface YouTubePlaylistItem {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationSeconds?: number;
}

// Subscribe to Auth State
export const initYouTubeAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google to get YouTube OAuth Access Token
export const signInWithYouTubeGoogle = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain YouTube OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const code = error?.code || '';
    // If the user deliberately closed or cancelled the popup, return null gracefully without console error
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/user-cancelled' ||
      error?.message?.includes('popup-closed-by-user')
    ) {
      console.info('Google sign-in popup was closed by user.');
      return null;
    }

    if (code === 'auth/popup-blocked') {
      throw new Error(
        'The Google sign-in popup was blocked by your browser. Please allow popups for this site or use the direct playlist URL importer below.'
      );
    }

    console.warn('YouTube sign-in notification:', error?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getYouTubeAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setYouTubeAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutYouTube = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Extract Playlist ID from standard YouTube or YouTube Music links
export const extractYouTubePlaylistId = (urlOrId: string): string | null => {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Direct ID check (e.g. PL..., RDCLAK..., OLAK5...)
  if (/^[A-Za-z0-9_-]{10,64}$/.test(trimmed) && !trimmed.includes('http') && !trimmed.includes('/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const listParam = parsed.searchParams.get('list');
    if (listParam) return listParam;

    // Path patterns
    const pathParts = parsed.pathname.split('/');
    const listIdx = pathParts.indexOf('playlist');
    if (listIdx !== -1 && pathParts[listIdx + 1]) {
      return pathParts[listIdx + 1];
    }
  } catch {
    // If not standard URL, search regex for list=
    const match = trimmed.match(/[?&]list=([A-Za-z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }

  return null;
};

// Fetch Current User's YouTube Playlists
export const fetchUserPlaylists = async (
  accessToken: string
): Promise<YouTubePlaylistMeta[]> => {
  try {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails,status&mine=true&maxResults=50',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || `YouTube API Error (${res.status})`
      );
    }

    const data = await res.json();
    const items = data.items || [];

    return items.map((item: any) => ({
      id: item.id,
      title: item.snippet?.title || 'Untitled YouTube Playlist',
      description: item.snippet?.description || 'Curated on YouTube / YouTube Music',
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      itemCount: item.contentDetails?.itemCount || 0,
      privacyStatus: item.status?.privacyStatus || 'public',
      channelTitle: item.snippet?.channelTitle || 'YouTube Music',
    }));
  } catch (err: any) {
    console.error('Error fetching user playlists:', err);
    throw err;
  }
};

// Fetch Items for a specific playlist
export const fetchPlaylistTracks = async (
  accessToken: string,
  playlistId: string
): Promise<YouTubePlaylistItem[]> => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
        playlistId
      )}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || `Failed to fetch playlist tracks (${res.status})`
      );
    }

    const data = await res.json();
    const items = data.items || [];

    return items
      .filter((item: any) => {
        // filter out deleted/private videos
        const title = item.snippet?.title;
        return title && title !== 'Private video' && title !== 'Deleted video';
      })
      .map((item: any) => {
        const title = item.snippet?.title || 'Unknown Track';
        const channel = item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || 'YouTube Music';

        // Parse artist from title like "Artist - Track" if available
        let parsedArtist = channel.replace(/ - Topic$/i, '').replace(/VEVO$/i, '');
        let parsedTitle = title;
        if (title.includes(' - ')) {
          const parts = title.split(' - ');
          parsedArtist = parts[0].trim();
          parsedTitle = parts.slice(1).join(' - ').trim();
        }

        // Clean out (Official Video), (Lyric Video), [4K], etc.
        parsedTitle = parsedTitle
          .replace(/\(Official (Music )?Video\)/gi, '')
          .replace(/\[Official (Music )?Video\]/gi, '')
          .replace(/\(Lyric Video\)/gi, '')
          .replace(/\[Audio\]/gi, '')
          .replace(/\(Audio\)/gi, '')
          .trim();

        return {
          id: item.id,
          videoId: item.snippet?.resourceId?.videoId || item.contentDetails?.videoId || item.id,
          title: parsedTitle || title,
          artist: parsedArtist || 'YouTube Artist',
          thumbnailUrl:
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
          durationSeconds: 210, // Standard default duration estimate
        };
      });
  } catch (err: any) {
    console.error('Error fetching playlist tracks:', err);
    throw err;
  }
};

// Convert YouTube items into SurSync Song models
export const convertYouTubeTracksToSongs = (
  ytTracks: YouTubePlaylistItem[],
  playlistCategory: string = 'all'
): Song[] => {
  const synthPresets: ('bollywood-strings' | 'lofi-rhodes' | 'gym-bass' | 'acoustic-guitar' | 'edm-synth' | 'ambient-flute' | 'tamil-kuthu')[] = [
    'bollywood-strings',
    'lofi-rhodes',
    'acoustic-guitar',
    'edm-synth',
    'gym-bass',
    'ambient-flute',
  ];

  return ytTracks.map((track, idx) => {
    const preset = synthPresets[idx % synthPresets.length];
    return {
      id: `yt-${track.videoId || track.id}-${idx}`,
      title: track.title,
      artist: track.artist,
      duration: track.durationSeconds || 215,
      coverArt: track.thumbnailUrl,
      language: 'multi',
      languageLabel: 'YouTube Music Sync',
      mood:
        playlistCategory === 'gym'
          ? 'gym'
          : playlistCategory === 'study'
          ? 'study'
          : playlistCategory === 'party'
          ? 'party'
          : 'romance',
      tags: ['YouTube Music', 'Imported', 'HD Audio', 'Synchronized'],
      audioSynthPreset: preset,
      sourceProvider: 'YouTube Music',
      fileSizeBytes: 6400000,
      lyrics: [
        {
          time: 0,
          text: `[YouTube Music Stream] ${track.title}`,
          transliteration: `By ${track.artist}`,
          translation: 'Synchronized live playback across connected devices',
        },
        {
          time: 15,
          text: '♪ Harmonious acoustics & synced spatial fidelity ♪',
          transliteration: 'Synced in SurSync Virtual Listening Room',
          translation: 'Real-time multi-listener room sync enabled',
        },
        {
          time: 45,
          text: '♪ Enjoy lossless stereo clarity and responsive visualizer ♪',
          transliteration: 'Streamed directly from your connected YouTube account',
          translation: 'High Dynamic Range Web Audio Engine',
        },
      ],
    };
  });
};
