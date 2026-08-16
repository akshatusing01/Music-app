import { audioEngine } from './audioEngine';
import type { Song } from '../types';

/** Official embedded YouTube playback adapter. No downloading, extraction, or proxying. */
declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void; }
}

const OFFICIAL_VIDEO_IDS: Record<string, string> = {
  'song-tum-hi-ho': 'Umqb9KENgmk',
  'song-kesariya': 'BddP6PYo2gs',
  'song-perfect': '2Vv-BfVoq4g',
  'song-until-i-found-you': 'GxldQ9eX2wo',
};

let installed = false;
let player: any = null;
let playerReady = false;
let playerPromise: Promise<void> | null = null;
let activeSong: Song | null = null;
let activeYoutubeId: string | null = null;
let isYoutubePlaying = false;
let playbackRate = 1;
let positionTimer: number | null = null;
let originalMethods: any = null;

function getYoutubeId(song: Song): string | null {
  if (song.youtubeVideoId) return song.youtubeVideoId;
  if (OFFICIAL_VIDEO_IDS[song.id]) return OFFICIAL_VIDEO_IDS[song.id];
  // YouTube playlist imports created by youtubeService use yt-{videoId}-{index} IDs.
  const imported = song.id.match(/^yt-([A-Za-z0-9_-]{11})-\d+$/);
  if (imported?.[1]) return imported[1];
  // Live search results use yt-search-{videoId} IDs.
  const searched = song.id.match(/^yt-search-([A-Za-z0-9_-]{11})$/);
  return searched?.[1] || null;
}

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (playerPromise) return playerPromise;

  playerPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(); };
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return playerPromise;
}

function ensureContainer(): HTMLElement {
  let container = document.getElementById('syncbeat-youtube-player');
  if (container) return container;
  container = document.createElement('div');
  container.id = 'syncbeat-youtube-player';
  Object.assign(container.style, {
    position: 'fixed', left: '-10000px', top: '0', width: '200px', height: '200px',
    opacity: '0.01', pointerEvents: 'none', zIndex: '-1',
  });
  document.body.appendChild(container);
  return container;
}

function stopPositionTimer() {
  if (positionTimer !== null) { window.clearInterval(positionTimer); positionTimer = null; }
}

function startPositionTimer() {
  stopPositionTimer();
  positionTimer = window.setInterval(() => {
    if (!player || !playerReady || !isYoutubePlaying) return;
  }, 100);
}

async function ensurePlayer(videoId: string): Promise<any> {
  await loadYouTubeAPI();
  if (!player) {
    player = new window.YT!.Player(ensureContainer(), {
      width: '200', height: '200', videoId,
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: () => {
          playerReady = true;
          if (activeYoutubeId) player.cueVideoById(activeYoutubeId);
        },
        onStateChange: (event: any) => {
          const state = event.data;
          isYoutubePlaying = state === window.YT.PlayerState.PLAYING;
          if (state === window.YT.PlayerState.ENDED) {
            isYoutubePlaying = false;
            stopPositionTimer();
            const originalPause = originalMethods?.pause;
            if (originalPause) originalPause.call(audioEngine);
          }
        },
        onError: (event: any) => { console.warn('YouTube embedded playback error:', event?.data); isYoutubePlaying = false; },
      },
    });
  } else if (activeYoutubeId !== videoId) {
    playerReady = false;
    player.loadVideoById(videoId);
  }
  activeYoutubeId = videoId;
  return player;
}

export function installYouTubePlaybackAdapter() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  originalMethods = {
    playSong: audioEngine.playSong,
    pause: audioEngine.pause,
    resume: audioEngine.resume,
    seek: audioEngine.seek,
    getCurrentPosition: audioEngine.getCurrentPosition,
    setPlaybackRate: audioEngine.setPlaybackRate,
    setVolume: audioEngine.setVolume,
  };

  audioEngine.playSong = async function (song: Song, startFromSeconds = 0, rate = 1) {
    const videoId = getYoutubeId(song);
    if (!videoId) {
      activeSong = null;
      isYoutubePlaying = false;
      stopPositionTimer();
      return originalMethods.playSong.call(audioEngine, song, startFromSeconds, rate);
    }

    activeSong = song;
    playbackRate = rate;
    isYoutubePlaying = true;
    const yt = await ensurePlayer(videoId);
    playerReady = true;
    yt.setPlaybackRate?.(rate);
    yt.loadVideoById({ videoId, startSeconds: Math.max(0, startFromSeconds) });
    activeYoutubeId = videoId;
    startPositionTimer();
  };

  audioEngine.pause = function () {
    if (!activeSong || !getYoutubeId(activeSong) || !player || !playerReady) return originalMethods.pause.call(audioEngine);
    try { player.pauseVideo(); isYoutubePlaying = false; stopPositionTimer(); } catch {}
  };

  audioEngine.resume = function () {
    if (!activeSong || !getYoutubeId(activeSong) || !player || !playerReady) return originalMethods.resume.call(audioEngine);
    try { player.playVideo(); player.setPlaybackRate?.(playbackRate); isYoutubePlaying = true; startPositionTimer(); } catch {}
  };

  audioEngine.seek = function (seconds: number) {
    if (!activeSong || !getYoutubeId(activeSong) || !player || !playerReady) return originalMethods.seek.call(audioEngine, seconds);
    player.seekTo(Math.max(0, Math.min(seconds, activeSong.duration)), true);
  };

  audioEngine.getCurrentPosition = function () {
    if (!activeSong || !getYoutubeId(activeSong) || !player || !playerReady) return originalMethods.getCurrentPosition.call(audioEngine);
    try { return Math.max(0, Math.min(Number(player.getCurrentTime?.() || 0), activeSong.duration)); } catch { return 0; }
  };

  audioEngine.setPlaybackRate = function (rate: number) {
    playbackRate = rate;
    if (!activeSong || !getYoutubeId(activeSong) || !player || !playerReady) return originalMethods.setPlaybackRate.call(audioEngine, rate);
    player.setPlaybackRate?.(rate);
  };

  audioEngine.setVolume = function (volume: number) {
    if (!activeSong || !getYoutubeId(activeSong) || !player || !playerReady) return originalMethods.setVolume.call(audioEngine, volume);
    player.setVolume(Math.max(0, Math.min(1, volume)) * 100);
  };

  void loadYouTubeAPI();
}

export { OFFICIAL_VIDEO_IDS };
