          const { action, songId, position, isPlaying, playbackRate } = payload;
          if (action === 'PLAY_PAUSE') { room.isPlaying = Boolean(isPlaying); if (typeof position === 'number') room.playbackPosition = position; }
          if (action === 'SEEK') { if (typeof position === 'number') room.playbackPosition = Math.max(0, position); }
          if (action === 'CHANGE_SONG') {
            if (!songId || typeof songId !== 'string') return;
            room.currentSongId = songId; room.playbackPosition = 0; room.isPlaying = isPlaying !== false;
            if (!room.queue.includes(songId)) room.queue = [songId, ...room.queue];
          }
          if (action === 'SET_RATE' && typeof playbackRate === 'number') room.playbackRate = Math.max(0.25, Math.min(2, playbackRate));
          room.lastStateUpdate = Date.now();
          broadcast(room.roomId, { type: 'PLAYBACK_SYNC', payload: { currentSongId: room.currentSongId, songId: room.currentSongId, isPlaying: room.isPlaying, playbackPosition: room.playbackPosition, position: room.playbackPosition, playbackRate: room.playbackRate, lastStateUpdate: room.lastStateUpdate, actionBy: payload.senderName || 'Listener' } });
          return;
        }

        if (type === 'QUEUE_UPDATE') {
          if (!Array.isArray(payload.queue)) return;
          const queueIds: string[] = payload.queue.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);
          room.queue = Array.from(new Set<string>(queueIds));
          broadcast(room.roomId, { type: 'QUEUE_SYNC', payload: { queue: room.queue } });
          return;
        }

        if (type === 'SEND_CHAT') {
          const msg: ChatMessage = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, senderId: payload.senderId || info?.participantId || 'listener', senderName: payload.senderName || 'Listener', senderAvatar: payload.senderAvatar || '', text: String(payload.text || '').slice(0, 1000), type: payload.type || 'text', timestamp: Date.now(), reactionEmoji: payload.reactionEmoji, soundName: payload.soundName };
          if (!msg.text.trim()) return;
          room.chatMessages.push(msg); room.chatMessages = room.chatMessages.slice(-80);
          broadcast(room.roomId, { type: 'NEW_CHAT_MESSAGE', payload: msg });