import type { RoomState, Song, UserProfile } from '../types';
import { audioEngine } from './audioEngine';
import { youtubePlayer } from './youtubePlayer';

export type WebSocketEventListener = (event: { type: string; payload: any }) => void;
function getLocalProfile(): UserProfile | null { try { return JSON.parse(localStorage.getItem('syncbeat:v2:profile') || 'null') as UserProfile | null; } catch { return null; } }
function getStoredSong(songId: string): Song | null { try { const songs = JSON.parse(localStorage.getItem('syncbeat_imported_songs') || '[]') as Song[]; return songs.find((song) => song.id === songId) || null; } catch { return null; } }

export class WebSocketClient {
  private static instance: WebSocketClient;
  private ws: WebSocket | null = null; private listeners = new Set<WebSocketEventListener>(); private reconnectTimeout: number | null = null;
  private currentRoomId: string | null = null; private currentParticipant: { id: string; name: string; avatar: string } | null = null;
  private currentRoomOptions: { roomName?: string; moodTheme?: string; initialSongId?: string; initialSong?: Song; isPublic?: boolean } | undefined;
  private roomQueue: string[] = []; private roomState: Partial<RoomState> | null = null; private isExplicitlyClosed = false;
  private latencyMs = 0; private pingInterval: number | null = null; private reconnectAttempts = 0;
  private constructor() {}
  public static getInstance(): WebSocketClient { if (!WebSocketClient.instance) WebSocketClient.instance = new WebSocketClient(); return WebSocketClient.instance; }

  public connect(roomId: string, participant: { id: string; name: string; avatar: string }, options?: { roomName?: string; moodTheme?: string; initialSongId?: string; initialSong?: Song; isPublic?: boolean }) {
    this.currentRoomId = roomId; this.currentParticipant = participant; this.currentRoomOptions = options; this.isExplicitlyClosed = false;
    if (this.ws) { try { this.ws.close(); } catch {} }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'; const configured = String(import.meta.env.VITE_SYNC_WS_URL || '').trim();
    const wsUrl = configured || `${protocol}//${window.location.host}${import.meta.env.PROD ? '/api/ws' : '/ws'}`;
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => { this.reconnectAttempts = 0; this.send('JOIN_ROOM', { roomId, payload: { participant, ...options } }); this.startPing(); this.emitStatus('SESSION_CONNECTED'); };
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PONG') { this.latencyMs = Math.max(1, Date.now() - Number(data.payload?.timestamp || Date.now())); return; }
          if (data.type === 'ROOM_SYNC_STATE' && data.payload) {
            this.roomState = data.payload as Partial<RoomState>; this.roomQueue = [...(data.payload.queue || [])]; this.listeners.forEach((listener) => listener(data));
            const state = data.payload;
            if (state.currentSong) void this.applyRemotePlayback(state.currentSong as Song, Boolean(state.isPlaying), Number(state.playbackPosition || 0), Number(state.playbackRate || 1), 'INITIAL_SYNC');
            else if (state.isPlaying === false) { audioEngine.pause(); youtubePlayer.pause(); }
            window.dispatchEvent(new CustomEvent('syncbeat:room-playback', { detail: { songId: state.currentSongId, song: state.currentSong || null, isPlaying: Boolean(state.isPlaying), position: Number(state.playbackPosition || 0), playbackPosition: Number(state.playbackPosition || 0), playbackRate: Number(state.playbackRate || 1), lastStateUpdate: state.lastStateUpdate } })); return;
          }
          if (data.type === 'QUEUE_SYNC' && data.payload?.queue) { this.roomQueue = [...data.payload.queue]; this.roomState = { ...(this.roomState || {}), queue: this.roomQueue }; this.listeners.forEach((listener) => listener(data)); return; }
          if (data.type === 'PLAYBACK_SYNC' && data.payload) {
            const songId = data.payload.songId || data.payload.currentSongId || null; const position = Number(data.payload.position ?? data.payload.playbackPosition ?? 0); const song = (data.payload.song as Song | null) || (songId ? getStoredSong(songId) : null);
            this.roomState = { ...(this.roomState || {}), currentSongId: songId, currentSong: song || this.roomState?.currentSong || null, isPlaying: Boolean(data.payload.isPlaying), playbackPosition: position, playbackRate: Number(data.payload.playbackRate ?? 1), lastStateUpdate: data.payload.lastStateUpdate ?? Date.now() };
            const isRemote = data.payload.actionBy && data.payload.actionBy !== this.currentParticipant?.id;
            if (isRemote) void this.applyRemotePlayback(song || this.roomState.currentSong as Song | null, Boolean(data.payload.isPlaying), position, Number(data.payload.playbackRate ?? 1), data.payload.action || 'PLAY_PAUSE');
            window.dispatchEvent(new CustomEvent('syncbeat:room-playback', { detail: { ...data.payload, songId, song: song || this.roomState.currentSong || null, position, playbackPosition: position } }));
            this.listeners.forEach((listener) => listener(data)); this.listeners.forEach((listener) => listener({ type: 'ROOM_SYNC_STATE', payload: this.roomState })); return;
          }
          if (data.type === 'PARTICIPANT_JOINED' && data.payload?.participants) this.roomState = { ...(this.roomState || {}), participants: data.payload.participants, chatMessages: data.payload.systemMessage ? [...(this.roomState?.chatMessages || []), data.payload.systemMessage].slice(-80) : this.roomState?.chatMessages };
          if (data.type === 'PARTICIPANT_LEFT' && data.payload?.participants) this.roomState = { ...(this.roomState || {}), participants: data.payload.participants, hostId: data.payload.newHostId || this.roomState?.hostId };
          if (data.type === 'HOST_CHANGED' && data.payload?.hostId) this.roomState = { ...(this.roomState || {}), hostId: data.payload.hostId, participants: data.payload.participants || this.roomState?.participants, chatMessages: data.payload.systemMessage ? [...(this.roomState?.chatMessages || []), data.payload.systemMessage].slice(-80) : this.roomState?.chatMessages };
          if ((data.type === 'NEW_CHAT_MESSAGE' || data.type === 'RECEIVE_CHAT') && data.payload) this.roomState = { ...(this.roomState || {}), chatMessages: [...(this.roomState?.chatMessages || []), data.payload].slice(-80) };
          if (data.type === 'REACTION_BURST' && data.payload) window.dispatchEvent(new CustomEvent('syncbeat:room-reaction', { detail: data.payload }));
          this.listeners.forEach((listener) => listener(data));
        } catch (err) { console.error('Error handling WebSocket message:', err); }
      };
      this.ws.onclose = () => { this.stopPing(); if (!this.isExplicitlyClosed) { const delay = Math.min(1500 * Math.pow(1.5, this.reconnectAttempts), 15000); this.reconnectAttempts += 1; if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout); this.reconnectTimeout = window.setTimeout(() => { if (this.currentRoomId && this.currentParticipant) this.connect(this.currentRoomId, this.currentParticipant, this.currentRoomOptions); }, delay); this.emitStatus('SESSION_RECONNECTING'); } };
      this.ws.onerror = () => this.emitStatus('SESSION_ERROR');
    } catch { this.emitStatus('SESSION_ERROR'); }
  }

  private async applyRemotePlayback(song: Song | null, playing: boolean, position: number, rate: number, action: string) {
    try {
      if (!song) return;
      if (song.youtubeVideoId) {
        if (action === 'CHANGE_SONG' || action === 'INITIAL_SYNC') {
          await youtubePlayer.load(song.youtubeVideoId, Math.max(0, position), playing, rate);
          if (!playing) youtubePlayer.pause();
          return;
        }
        if (action === 'SEEK') {
          youtubePlayer.setRate(rate);
          youtubePlayer.seek(position);
          if (playing) youtubePlayer.play(); else youtubePlayer.pause();
          return;
        }
        if (action === 'SET_RATE') { youtubePlayer.setRate(rate); return; }
        youtubePlayer.setRate(rate);
        if (Math.abs(youtubePlayer.getCurrentTime() - position) > 0.35) youtubePlayer.seek(position);
        if (playing) youtubePlayer.play(); else youtubePlayer.pause();
        return;
      }
      if (action === 'CHANGE_SONG' || action === 'INITIAL_SYNC') {
        await audioEngine.playSong(song, Math.max(0, position), rate);
        if (!playing) audioEngine.pause();
        return;
      }
      if (action === 'SEEK') { audioEngine.setPlaybackRate(rate); audioEngine.seek(position); if (playing) audioEngine.resume(); else audioEngine.pause(); return; }
      if (action === 'SET_RATE') { audioEngine.setPlaybackRate(rate); return; }
      if (playing) { audioEngine.setPlaybackRate(rate); audioEngine.seek(position); audioEngine.resume(); } else { audioEngine.seek(position); audioEngine.pause(); }
    } catch (error) { console.warn('Remote playback sync failed:', error); }
  }

  private emitStatus(type: string) { this.listeners.forEach((listener) => listener({ type, payload: { roomId: this.currentRoomId } })); }
  public disconnect() { this.isExplicitlyClosed = true; this.stopPing(); if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); this.reconnectTimeout = null; } if (this.ws) { try { this.ws.close(); } catch {} this.ws = null; } this.currentRoomId = null; this.currentRoomOptions = undefined; this.roomQueue = []; this.roomState = null; this.reconnectAttempts = 0; }
  public addListener(listener: WebSocketEventListener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  public send(type: string, data: any) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type, roomId: this.currentRoomId, payload: data.payload !== undefined ? data.payload : data })); }
  public broadcastPlayback(action: 'PLAY_PAUSE' | 'SEEK' | 'CHANGE_SONG' | 'SET_RATE', params: { songId?: string; song?: Song; position?: number; isPlaying?: boolean; playbackRate?: number; senderName?: string }) {
    const roomSong = params.song || this.roomState?.currentSong || (params.songId ? getStoredSong(params.songId) : null);
    const isYouTubeRoom = Boolean(roomSong?.youtubeVideoId);
    const effectivePosition = action === 'CHANGE_SONG' ? Number(params.position || 0) : (isYouTubeRoom ? youtubePlayer.getCurrentTime() : Number(params.position || 0));
    if (action === 'CHANGE_SONG' && params.songId && this.currentRoomId) { const song = params.song || getStoredSong(params.songId) || undefined; this.updateQueue([params.songId, ...this.roomQueue.filter((id) => id !== params.songId)]); this.send('PLAYBACK_ACTION', { action, ...params, position: effectivePosition, song }); return; }
    this.send('PLAYBACK_ACTION', { action, ...params, position: effectivePosition });
  }
  public updateQueue(queue: string[]) { this.roomQueue = [...new Set(queue)]; this.roomState = { ...(this.roomState || {}), queue: this.roomQueue }; this.send('QUEUE_UPDATE', { queue: this.roomQueue }); }
  public getQueue(): string[] { return [...this.roomQueue]; }
  public getRoomState(): Partial<RoomState> | null { return this.roomState ? { ...this.roomState, queue: [...(this.roomState.queue || this.roomQueue)] } : null; }
  public getRoomId(): string | null { return this.currentRoomId; }
  public getParticipantId(): string | null { return this.currentParticipant?.id || null; }
  public isHost(): boolean { return Boolean(this.roomState?.hostId && this.currentParticipant?.id && this.roomState.hostId === this.currentParticipant.id); }
  public requestNextTrack() { if (!this.currentRoomId || !this.isHost()) return false; const current = this.roomState?.currentSongId || null; const queue = this.roomQueue; if (!queue.length) return false; const index = current ? queue.indexOf(current) : -1; const next = queue[(index + 1 + queue.length) % queue.length]; if (!next || next === current) return false; this.broadcastPlayback('CHANGE_SONG', { songId: next, position: 0, isPlaying: true, senderName: this.currentParticipant?.name || 'Host' }); return true; }
  public transferHost(participantId: string) { if (!this.currentRoomId || !participantId || !this.isHost()) return; this.send('TRANSFER_HOST', { participantId }); }
  public sendChatMessage(text: string, options?: { type?: 'text' | 'reaction' | 'sound' | 'moment'; reactionEmoji?: string; soundName?: string }) { if (!this.currentParticipant) return; this.send('SEND_CHAT', { senderId: this.currentParticipant.id, senderName: this.currentParticipant.name, senderAvatar: this.currentParticipant.avatar, text, type: options?.type || 'text', reactionEmoji: options?.reactionEmoji, soundName: options?.soundName }); }
  public burstReaction(emoji: string, soundEffect?: string) { if (!this.currentParticipant) return; this.send('BURST_REACTION', { emoji, senderId: this.currentParticipant.id, senderName: this.currentParticipant.name, x: 0.2 + Math.random() * 0.6, soundEffect }); }
  public syncFocusTimer(action: 'SET_TIMER' | 'TOGGLE_TIMER' | 'RESET_TIMER', payload: { timerType?: 'pomodoro' | 'stopwatch' | 'idle'; duration?: number; remaining?: number; isRunning?: boolean }) { this.send('FOCUS_TIMER_ACTION', { action, ...payload }); }
  public getLatency(): number { return this.latencyMs || 24; }
  public createRoom(roomName: string, hostName: string, moodTheme = 'love', isPrivate = false) { const profile = getLocalProfile(); const participant = { id: profile?.id || `host-${Math.random().toString(36).substring(2, 6)}`, name: profile?.name || hostName, avatar: profile?.avatar || '' }; this.connect('room-' + Math.random().toString(36).substring(2, 8), participant, { roomName, moodTheme, isPublic: !isPrivate }); }
  public joinRoom(roomId: string, name: string, avatar: string) { const profile = getLocalProfile(); let cleanId = roomId.trim(); try { const url = new URL(cleanId, window.location.origin); cleanId = url.searchParams.get('room') || cleanId; } catch {} const participant = { id: profile?.id || `guest-${Math.random().toString(36).substring(2, 6)}`, name: profile?.name || name, avatar: profile?.avatar || avatar }; this.connect(cleanId, participant); }
  public leaveRoom() { this.disconnect(); }
  private startPing() { this.stopPing(); this.pingInterval = window.setInterval(() => { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'PING', roomId: this.currentRoomId, payload: { timestamp: Date.now() } })); }, 10000); }
  private stopPing() { if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; } }
}
export const wsClient = WebSocketClient.getInstance();