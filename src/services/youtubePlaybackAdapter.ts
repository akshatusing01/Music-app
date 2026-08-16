import type { Song } from '../types';
import { audioEngine } from './audioEngine';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let installed = false;
let player: any = null;
let apiPromise: Promise<void> | null = null;
let playerReady = false;
let activeSong: Song | null = null;
let activeYoutubeId: string | null = null;
let playing = false;
let rate = 1;
let position = 0;
let ticker: number | null = null;

const positionListeners = new Set<(position: number) => void>();
const endedListeners = new Set<() => void>();

const original = {
  playSong: audioEngine.playSong.bind(audioEngine),
  pause: audioEngine.pause.bind(audioEngine),
  resume: audioEngine.resume.bind(audioEngine),
  seek: audioEngine.seek.bind(audioEngine),
  getCurrentPosition: audioEngine.getCurrentPosition.bind(audioEngine),
  setPlaybackRate: audioEngine.setPlaybackRate.bind(audioEngine),
  setVolume: audioEngine.setVolume.bind(audioEngine),
  onPositionChange: audioEngine.onPositionChange.bind(audioEngine),
  onEnded: audioEngine.onEnded.bind(audioEngine),
};

function isYouTubeSong(song: Song | null): boolean {
  return Boolean(song?.youtubeVideoId || song?.id.match(/^yt(?:-search)?-[A-Za-z0-9_-]{11}(?:-\d+)?$/));
}

function getVideoId(song: Song): string | null {
  if (song.youtubeVideoId) return song.youtubeVideoId;
  const match = song.id.match(/^yt-search-([A-Za-z0-9_-]{11})$/) || song.id.match(/^yt-([A-Za-z0-9_-]{11})-\d+$/);
  return match?.[1] || null;
}

function loadApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('YouTube playback requires a browser.'));
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(); };
    const script = document.querySelector('script[data-syncbeat-youtube-api]');
    if (script) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.dataset.syncbeatYoutubeApi = 'true';
    tag.onerror = () => reject(new Error('Unable to load the YouTube IFrame API.'));
    document.head.appendChild(tag);
  });
  return apiPromise;
}

function ensureVisibleContainer(): HTMLElement {
  let container = document.getElementById('syncbeat-youtube-player');
  if (container) return container;
  container = document.createElement('div');
  container.id = 'syncbeat-youtube-player';
  container.setAttribute('aria-label', 'YouTube music player');
  Object.assign(container.style, {
    position: 'fixed', right: '16px', bottom: '82px',
    width: 'min(360px, calc(100vw - 32px))', aspectRatio: '16 / 9',
    background: '#000', borderRadius: '14px', overflow: 'hidden',
    border: '1px solid rgba(255,255,255,.14)',
    boxShadow: '0 20px 60px rgba(0,0,0,.55)', zIndex: '55',
  });
  document.body.appendChild(container);
  return container;
}

function stopTicker() {
  if (ticker !== null) window.clearInterval(ticker);
  ticker = null;
}

function startTicker() {
  stopTicker();
  ticker = window.setInterval(() => {
    if (!playing || !player || !playerReady || !activeSong) return;
    try {
      position = Number(player.getCurrentTime?.() || 0);
      positionListeners.forEach((listener) => listener(position));
    } catch {}
  }, 200);
}

async function ensurePlayer(videoId: string) {
  await loadApi();

  if (!player) {
    player = new window.YT!.Player(ensureVisibleContainer(), {
      width: '100%', height: '100%', videoId,
      playerVars: { controls: 1, playsinline: 1, rel: 1, fs: 1, modestbranding: 1, origin: window.location.origin },
      events: {
        onReady: () => { playerReady = true; },
        onStateChange: (event: any) => {
          if (event.data === window.YT!.PlayerState.PLAYING) {
            playing = true;
            startTicker();
          } else if (event.data === window.YT!.PlayerState.PAUSED) {
            playing = false;
            stopTicker();
          } else if (event.data === window.YT!.PlayerState.ENDED) {
            playing = false;
            stopTicker();
            if (activeSong) position = activeSong.duration;
            positionListeners.forEach((listener) => listener(position));
            endedListeners.forEach((listener) => listener());
          }
        },
        onError: (event: any) => {
          playing = false;
          stopTicker();
          console.warn('YouTube embedded playback error:', event?.data);
        },
      },
    });
    await new Promise<void>((resolve) => {
      const wait = () => playerReady ? resolve() : window.setTimeout(wait, 50);
      wait();
    });
  } else if (activeYoutubeId !== videoId) {
    playerReady = true;
  }

  activeYoutubeId = videoId;
  return player;
}

export function installYouTubePlaybackAdapter() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  audioEngine.playSong = async (song: Song, startFromSeconds = 0, playbackRate = 1) => {
    if (!isYouTubeSong(song)) {
      activeSong = null;
      return original.playSong(song, startFromSeconds, playbackRate);
    }

    const videoId = getVideoId(song);
    if (!videoId) return;
    activeSong = song;
    rate = playbackRate;
    position = Math.max(0, startFromSeconds);
    const yt = await ensurePlayer(videoId);
    activeYoutubeId = videoId;
    yt.setPlaybackRate?.(playbackRate);
    yt.loadVideoById({ videoId, startSeconds: position });
    playing = true;
    startTicker();
    positionListeners.forEach((listener) => listener(position));
  };

  audioEngine.pause = () => {
    if (!isYouTubeSong(activeSong) || !player) return original.pause();
    position = Number(player.getCurrentTime?.() || position);
    player.pauseVideo?.();
    playing = false;
    stopTicker();
  };

  audioEngine.resume = () => {
    if (!isYouTubeSong(activeSong) || !player) return original.resume();
    player.playVideo?.();
    player.setPlaybackRate?.(rate);
    playing = true;
    startTicker();
  };

  audioEngine.seek = (seconds: number) => {
    if (!isYouTubeSong(activeSong) || !player) return original.seek(seconds);
    position = Math.max(0, Math.min(seconds, activeSong?.duration || seconds));
    player.seekTo?.(position, true);
    positionListeners.forEach((listener) => listener(position));
  };

  audioEngine.getCurrentPosition = () => {
    if (!isYouTubeSong(activeSong) || !player) return original.getCurrentPosition();
    try { position = Number(player.getCurrentTime?.() || position); } catch {}
    return position;
  };

  audioEngine.setPlaybackRate = (newRate: number) => {
    rate = newRate;
    if (!isYouTubeSong(activeSong) || !player) return original.setPlaybackRate(newRate);
    player.setPlaybackRate?.(newRate);
  };

  audioEngine.setVolume = (volume: number) => {
    if (!isYouTubeSong(activeSong) || !player) return original.setVolume(volume);
    player.setVolume?.(Math.round(Math.max(0, Math.min(1, volume)) * 100));
  };

  audioEngine.onPositionChange = (listener: (position: number) => void) => {
    positionListeners.add(listener);
    return () => positionListeners.delete(listener);
  };

  audioEngine.onEnded = (listener: () => void) => {
    endedListeners.add(listener);
    return () => endedListeners.delete(listener);
  };

  void loadApi().catch(() => {});
}
