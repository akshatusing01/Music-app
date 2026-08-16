import { audioEngine } from './audioEngine';
import { wsClient } from './websocketClient';
import { initialSongs } from '../data/songs';
import type { Song } from '../types';

let installed = false;

function getKnownSongs(): Song[] {
  const byId = new Map(initialSongs.map((song) => [song.id, song]));
  try {
    const raw = localStorage.getItem('syncbeat_imported_songs');
    if (raw) {
      const imported = JSON.parse(raw) as Song[];
      imported.forEach((song) => byId.set(song.id, song));
    }
  } catch {}
  return Array.from(byId.values());
}

/**
 * Keeps end-of-track behavior deterministic in a listening room.
 * The room host is the only client allowed to advance the authoritative room.
 * Non-host clients wait for the resulting PLAYBACK_SYNC event.
 */
export function installRoomPlaybackCoordinator() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalOnEnded = audioEngine.onEnded.bind(audioEngine);

  audioEngine.onEnded = (callback: () => void) => {
    return originalOnEnded(() => {
      const room = wsClient.getRoomState();
      if (!room?.roomId) {
        callback();
        return;
      }

      // In a room, the server/host decides what plays next.
      // This prevents every participant from independently changing the room.
      if (wsClient.isHost()) {
        const advanced = wsClient.requestNextTrack();
        if (!advanced) callback();
      }
    });
  };

  // When the authoritative room advances, make sure a locally known track is
  // immediately available to the audio engine. App.tsx also consumes the same
  // websocket event and updates React state, so this is a safe playback guard.
  wsClient.addListener((event) => {
    if (event.type !== 'PLAYBACK_SYNC') return;
    const payload = event.payload || {};
    const songId = payload.songId || payload.currentSongId;
    if (!songId) return;

    const song = getKnownSongs().find((item) => item.id === songId);
    if (!song) return;

    if (payload.isPlaying) {
      void audioEngine.playSong(song, Number(payload.playbackPosition || 0), Number(payload.playbackRate || 1));
    }
  });
}
