import { audioEngine } from './audioEngine';
import { wsClient } from './websocketClient';

let installed = false;

/**
 * Keeps end-of-track behavior deterministic in a listening room.
 * The room host is the only client allowed to advance the authoritative room.
 * Non-host clients wait for the resulting PLAYBACK_SYNC event already handled by App.tsx.
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

      // In a room, the host advances the authoritative queue. Other clients
      // wait for the resulting PLAYBACK_SYNC instead of independently skipping.
      if (wsClient.isHost()) {
        const advanced = wsClient.requestNextTrack();
        if (!advanced) callback();
      }
    });
  };
}
