import { RoomState, ChatMessage } from '../types';

export type WebSocketEventListener = (event: { type: string; payload: any }) => void;

export class WebSocketClient {
  private static instance: WebSocketClient;
  private ws: WebSocket | null = null;
  private listeners: Set<WebSocketEventListener> = new Set();
  private reconnectTimeout: number | null = null;
  private currentRoomId: string | null = null;
  private currentParticipant: { id: string; name: string; avatar: string } | null = null;
  private currentRoomOptions: { roomName?: string; moodTheme?: string; initialSongId?: string; isPublic?: boolean } | undefined;
  private isExplicitlyClosed = false;
  private latencyMs = 0;
  private pingInterval: number | null = null;

  private constructor() {}

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) WebSocketClient.instance = new WebSocketClient();
    return WebSocketClient.instance;
  }

  public connect(roomId: string, participant: { id: string; name: string; avatar: string }, options?: { roomName?: string; moodTheme?: string; initialSongId?: string; isPublic?: boolean }) {
    this.currentRoomId = roomId;
    this.currentParticipant = participant;
    this.currentRoomOptions = options;
    this.isExplicitlyClosed = false;

    if (this.ws) {
      try { this.ws.close(); } catch {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        this.send('JOIN_ROOM', {
          roomId,
          payload: {
            participant,
            roomName: options?.roomName,
            moodTheme: options?.moodTheme,
            initialSongId: options?.initialSongId,
            isPublic: options?.isPublic,
          },
        });
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PONG') {
            this.latencyMs = Math.max(8, Date.now() - data.timestamp);
            return;
          }

          // The server calls this field currentSongId; the existing app shell expects songId.
          if (data.type === 'PLAYBACK_SYNC' && data.payload) {
            data.payload.songId = data.payload.songId || data.payload.currentSongId;
          }

          this.listeners.forEach((listener) => listener(data));
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        this.stopPing();
        if (!this.isExplicitlyClosed) {
          if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = window.setTimeout(() => {
            if (this.currentRoomId && this.currentParticipant) {
              this.connect(this.currentRoomId, this.currentParticipant, this.currentRoomOptions);
            }
          }, 1500);
        }
      };

      this.ws.onerror = (err) => console.warn('WebSocket connection notice:', err);
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.currentRoomId = null;
    this.currentRoomOptions = undefined;
  }

  public addListener(listener: WebSocketEventListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type,
        roomId: this.currentRoomId,
        payload: data.payload !== undefined ? data.payload : data,
      }));
    }
  }

  public broadcastPlayback(action: 'PLAY_PAUSE' | 'SEEK' | 'CHANGE_SONG' | 'SET_RATE', params: {
    songId?: string;
    position?: number;
    isPlaying?: boolean;
    playbackRate?: number;
    senderName?: string;
  }) {
    this.send('PLAYBACK_ACTION', { action, ...params });
  }

  public updateQueue(queue: string[]) {
    this.send('QUEUE_UPDATE', { queue });
  }

  public sendChatMessage(text: string, options?: { type?: 'text' | 'reaction' | 'sound'; reactionEmoji?: string; soundName?: string }) {
    if (!this.currentParticipant) return;
    this.send('SEND_CHAT', {
      senderId: this.currentParticipant.id,
      senderName: this.currentParticipant.name,
      senderAvatar: this.currentParticipant.avatar,
      text,
      type: options?.type || 'text',
      reactionEmoji: options?.reactionEmoji,
      soundName: options?.soundName,
    });
  }

  public burstReaction(emoji: string, soundEffect?: string) {
    if (!this.currentParticipant) return;
    this.send('BURST_REACTION', {
      emoji,
      senderId: this.currentParticipant.id,
      senderName: this.currentParticipant.name,
      x: 0.2 + Math.random() * 0.6,
      soundEffect,
    });
  }

  public syncFocusTimer(action: 'SET_TIMER' | 'TOGGLE_TIMER' | 'RESET_TIMER', payload: {
    timerType?: 'pomodoro' | 'stopwatch' | 'idle';
    duration?: number;
    remaining?: number;
    isRunning?: boolean;
  }) {
    this.send('FOCUS_TIMER_ACTION', { action, ...payload });
  }

  public getLatency(): number { return this.latencyMs || 24; }

  public createRoom(roomName: string, hostName: string, moodTheme = 'love', isPrivate = false) {
    const roomId = 'room-' + Math.random().toString(36).substring(2, 8);
    const participant = {
      id: this.currentParticipant?.id || 'host-' + Math.random().toString(36).substring(2, 6),
      name: hostName,
      avatar: this.currentParticipant?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    };
    this.connect(roomId, participant, { roomName, moodTheme, isPublic: !isPrivate });
  }

  public joinRoom(roomId: string, name: string, avatar: string) {
    const participant = {
      id: this.currentParticipant?.id || 'guest-' + Math.random().toString(36).substring(2, 6),
      name,
      avatar,
    };
    this.connect(roomId, participant);
  }

  public leaveRoom() { this.disconnect(); }

  private startPing() {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
    }, 10000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const wsClient = WebSocketClient.getInstance();
