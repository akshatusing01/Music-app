import type { Song } from '../types';
import { audioEngine } from './audioEngine';
import { youtubePlayer } from './youtubePlayer';

let installed = false;
let activeSong: Song | null = null;
let rate = 1;
const positionListeners = new Set<(position: number) => void>();
const endedListeners = new Set<() => void>();

function isYouTubeSong(song: Song | null): boolean {
  return Boolean(song?.youtubeVideoId || /^yt(?:-search)?-[A-Za-z0-9_-]{11}(?:-\d+)?$/.test(song?.id || ''));
}

function getVideoId(song: Song): string | null {
  if (song.youtubeVideoId) return song.youtubeVideoId;
  const match = song.id.match(/^yt-search-([A-Za-z0-9_-]{11})$/) || song.id.match(/^yt-([A-Za-z0-9_-]{11})-\d+$/);
  return match?.[1] || null;
}

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

export function installYouTubePlaybackAdapter() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('syncbeat:youtube-position', (event) => {
    const detail = (event as CustomEvent<{ currentTime?: number }>).detail;
    if (typeof detail?.currentTime === 'number') positionListeners.forEach((listener) => listener(detail.currentTime));
  });
  window.addEventListener('syncbeat:youtube-ended', () => endedListeners.forEach((listener) => listener()));

  audioEngine.playSong = async (song: Song, startFromSeconds = 0, playbackRate = 1) => {
    if (!isYouTubeSong(song)) {
      activeSong = null;
      return original.playSong(song, startFromSeconds, playbackRate);
    }
    const videoId = getVideoId(song);
    if (!videoId) return;
    activeSong = song;
    rate = Math.max(0.25, Math.min(2, playbackRate));
    await youtubePlayer.load(videoId, Math.max(0, startFromSeconds), true, rate);
    youtubePlayer.setRate(rate);
  };

  audioEngine.pause = () => {
    if (!isYouTubeSong(activeSong)) return original.pause();
    youtubePlayer.pause();
  };

  audioEngine.resume = () => {
    if (!isYouTubeSong(activeSong)) return original.resume();
    youtubePlayer.setRate(rate);
    youtubePlayer.play();
  };

  audioEngine.seek = (seconds: number) => {
    if (!isYouTubeSong(activeSong)) return original.seek(seconds);
    youtubePlayer.seek(Math.max(0, seconds));
  };

  audioEngine.getCurrentPosition = () => {
    if (!isYouTubeSong(activeSong)) return original.getCurrentPosition();
    return youtubePlayer.getCurrentTime();
  };

  audioEngine.setPlaybackRate = (newRate: number) => {
    rate = Math.max(0.25, Math.min(2, newRate));
    if (!isYouTubeSong(activeSong)) return original.setPlaybackRate(rate);
    youtubePlayer.setRate(rate);
  };

  audioEngine.setVolume = (volume: number) => {
    if (!isYouTubeSong(activeSong)) return original.setVolume(volume);
    youtubePlayer.setVolume(volume);
  };

  audioEngine.onPositionChange = (listener: (position: number) => void) => {
    positionListeners.add(listener);
    return () => positionListeners.delete(listener);
  };

  audioEngine.onEnded = (listener: () => void) => {
    endedListeners.add(listener);
    return () => endedListeners.delete(listener);
  };
}
