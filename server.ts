import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import type { Song } from './src/types';

dotenv.config();

interface RoomParticipant { id: string; name: string; avatar: string; isHost: boolean; joinedAt: number; lastPing: number; }
interface ChatMessage { id: string; senderId: string; senderName: string; senderAvatar: string; text: string; type: 'text'|'reaction'|'system'|'sound'|'moment'; timestamp: number; reactionEmoji?: string; soundName?: string; }
interface RoomState {
  roomId: string; roomName: string; moodTheme: string; hostId: string; currentSongId: string|null; currentSong: Song|null;
  isPlaying: boolean; playbackPosition: number; playbackRate: number; lastStateUpdate: number;
  queue: string[]; participants: Map<string, RoomParticipant>; chatMessages: ChatMessage[];
  focusMode: { active: boolean; timerType: 'pomodoro'|'stopwatch'|'idle'; duration: number; remaining: number; isRunning: boolean; startedAt: number|null; };
  isPublic: boolean;
}

const rooms = new Map<string, RoomState>();
let genAiClient: GoogleGenAI | null = null;
const getGeminiClient = () => { if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured'); if (!genAiClient) genAiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); return genAiClient; };

function createRoom(roomId: string, participant: RoomParticipant, options: any = {}): RoomState {
  return {
    roomId,
    roomName: options.roomName || `Jam Room #${roomId}`,
    moodTheme: options.moodTheme || 'vibe',
    hostId: participant.id,
    currentSongId: options.initialSongId || null,
    currentSong: options.initialSong || null,
    isPlaying: false,
    playbackPosition: 0,
    playbackRate: 1,
    lastStateUpdate: Date.now(),
    queue: options.initialSongId ? [options.initialSongId] : [],
    participants: new Map(),
    chatMessages: [],
    focusMode: { active: false, timerType: 'idle', duration: 1500, remaining: 1500, isRunning: false, startedAt: null },
    isPublic: options.isPublic ?? false,
  };
}

function authoritativePosition(room: RoomState) {
  if (!room.isPlaying) return Math.max(0, room.playbackPosition);
  return Math.max(0, room.playbackPosition + ((Date.now() - room.lastStateUpdate) / 1000) * room.playbackRate);
}

function serializeRoom(room: RoomState) {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    moodTheme: room.moodTheme,
    hostId: room.hostId,
    currentSongId: room.currentSongId,
    currentSong: room.currentSong,
    isPlaying: room.isPlaying,
    playbackPosition: authoritativePosition(room),
    playbackRate: room.playbackRate,
    lastStateUpdate: room.lastStateUpdate,
    queue: room.queue,
    participants: Array.from(room.participants.values()),
    chatMessages: room.chatMessages.slice(-80),
    focusMode: room.focusMode,
    isPublic: room.isPublic,
  };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT || 3000);
  app.use(express.json({ limit: '256kb' }));
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clientRoomMap = new Map<WebSocket, { roomId: string; participantId: string }>();

  const broadcast = (roomId: string, message: object, exclude?: WebSocket) => {
    const data = JSON.stringify(message);
    for (const [client, info] of clientRoomMap) {
      if (info.roomId === roomId && client !== exclude && client.readyState === WebSocket.OPEN) client.send(data);
    }
  };
  const broadcastAll = (roomId: string, message: object) => {
    const data = JSON.stringify(message);
    for (const [client, info] of clientRoomMap) if (info.roomId === roomId && client.readyState === WebSocket.OPEN) client.send(data);
  };
  const isHost = (room: RoomState, info?: { participantId: string }) => Boolean(info && room.hostId === info.participantId);

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      try {
        const { type, roomId, payload = {} } = JSON.parse(raw.toString());
        if (type === 'JOIN_ROOM') {
          const participant = payload.participant || { id: `guest-${Date.now()}`, name: 'Listener', avatar: '' };
          let room = rooms.get(roomId);
          if (!room) { room = createRoom(roomId, participant, payload); rooms.set(roomId, room); }
          const existing = room.participants.get(participant.id);
          if (existing) { existing.lastPing = Date.now(); clientRoomMap.set(ws, { roomId, participantId: existing.id }); ws.send(JSON.stringify({ type: 'ROOM_SYNC_STATE', payload: serializeRoom(room) })); return; }
          const isFirst = room.participants.size === 0;
          const p: RoomParticipant = { id: String(participant.id), name: participant.name || 'Listener', avatar: participant.avatar || '', isHost: isFirst || participant.id === room.hostId, joinedAt: Date.now(), lastPing: Date.now() };
          if (isFirst) room.hostId = p.id;
          room.participants.forEach((member) => { member.isHost = member.id === room.hostId; });
          room.participants.set(p.id, p);
          clientRoomMap.set(ws, { roomId, participantId: p.id });
          ws.send(JSON.stringify({ type: 'ROOM_SYNC_STATE', payload: serializeRoom(room) }));
          const msg: ChatMessage = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, senderId: 'system', senderName: 'SyncBeat', senderAvatar: '', text: `${p.name} joined the room.`, type: 'system', timestamp: Date.now() };
          room.chatMessages.push(msg);
          broadcast(roomId, { type: 'PARTICIPANT_JOINED', payload: { participant: p, participants: Array.from(room.participants.values()), systemMessage: msg } }, ws);
          return;
        }

        if (type === 'PING') { ws.send(JSON.stringify({ type: 'PONG', payload: { timestamp: payload.timestamp } })); return; }
        const info = clientRoomMap.get(ws);
        const effectiveRoomId = info?.roomId || roomId;
        const room = effectiveRoomId ? rooms.get(effectiveRoomId) : undefined;
        if (!room) return;

        if (type === 'PLAYBACK_ACTION') {
          if (!isHost(room, info)) return;
          const { action, songId, song, position, isPlaying, playbackRate } = payload;
          if (action === 'PLAY_PAUSE') { room.playbackPosition = authoritativePosition(room); room.isPlaying = Boolean(isPlaying); }
          if (action === 'SEEK') { room.playbackPosition = Math.max(0, Number(position) || 0); }
          if (action === 'CHANGE_SONG') {
            if (!songId || typeof songId !== 'string') return;
            room.currentSongId = songId;
            room.currentSong = song && typeof song === 'object' ? song : room.currentSong;
            room.playbackPosition = Math.max(0, Number(position) || 0);
            room.isPlaying = isPlaying !== false;
            if (!room.queue.includes(songId)) room.queue = [songId, ...room.queue];
          }
          if (action === 'SET_RATE' && typeof playbackRate === 'number') { room.playbackRate = Math.max(0.25, Math.min(2, playbackRate)); }
          room.lastStateUpdate = Date.now();
          broadcastAll(room.roomId, { type: 'PLAYBACK_SYNC', payload: { currentSongId: room.currentSongId, songId: room.currentSongId, song: room.currentSong, isPlaying: room.isPlaying, playbackPosition: authoritativePosition(room), position: authoritativePosition(room), playbackRate: room.playbackRate, lastStateUpdate: room.lastStateUpdate, actionBy: payload.senderName || 'Host' } });
          return;
        }

        if (type === 'QUEUE_UPDATE') {
          if (!isHost(room, info)) return;
          if (!Array.isArray(payload.queue)) return;
          room.queue = Array.from(new Set(payload.queue.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)));
          broadcastAll(room.roomId, { type: 'QUEUE_SYNC', payload: { queue: room.queue } });
          return;
        }

        if (type === 'TRANSFER_HOST') {
          if (!isHost(room, info)) return;
          const target = room.participants.get(String(payload.participantId || ''));
          if (!target) return;
          room.hostId = target.id;
          room.participants.forEach((member) => { member.isHost = member.id === room.hostId; });
          const msg: ChatMessage = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, senderId: 'system', senderName: 'SyncBeat', senderAvatar: '', text: `${target.name} is now the host.`, type: 'system', timestamp: Date.now() };
          room.chatMessages.push(msg);
          broadcastAll(room.roomId, { type: 'HOST_CHANGED', payload: { hostId: room.hostId, participants: Array.from(room.participants.values()), systemMessage: msg } });
          return;
        }

        if (type === 'SEND_CHAT') {
          const msg: ChatMessage = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, senderId: payload.senderId || info?.participantId || 'listener', senderName: payload.senderName || 'Listener', senderAvatar: payload.senderAvatar || '', text: String(payload.text || '').slice(0, 1000), type: payload.type || 'text', timestamp: Date.now(), reactionEmoji: payload.reactionEmoji, soundName: payload.soundName };
          if (!msg.text.trim()) return;
          room.chatMessages.push(msg); room.chatMessages = room.chatMessages.slice(-80);
          broadcastAll(room.roomId, { type: 'NEW_CHAT_MESSAGE', payload: msg });
          return;
        }

        if (type === 'BURST_REACTION') { broadcastAll(room.roomId, { type: 'REACTION_BURST', payload: { emoji: payload.emoji, senderId: payload.senderId, senderName: payload.senderName, x: payload.x || 0.5, soundEffect: payload.soundEffect } }); return; }
        if (type === 'FOCUS_TIMER_ACTION') {
          if (!isHost(room, info)) return;
          const f = room.focusMode; const { action, timerType, duration, remaining, isRunning } = payload;
          if (action === 'SET_TIMER') { f.timerType = timerType || 'pomodoro'; f.duration = Math.max(0, Number(duration) || 0); f.remaining = Math.max(0, Number(remaining) || f.duration); f.isRunning = Boolean(isRunning); f.active = true; f.startedAt = f.isRunning ? Date.now() : null; }
          else if (action === 'TOGGLE_TIMER') { f.isRunning = Boolean(isRunning); f.startedAt = f.isRunning ? Date.now() : null; }
          else if (action === 'RESET_TIMER') { f.remaining = f.duration; f.isRunning = false; f.startedAt = null; }
          broadcastAll(room.roomId, { type: 'FOCUS_TIMER_SYNC', payload: f });
          return;
        }
      } catch (error) { console.warn('WebSocket message rejected:', error); }
    });

    ws.on('close', () => {
      const info = clientRoomMap.get(ws); if (!info) return;
      const room = rooms.get(info.roomId); if (!room) return;
      const leaving = room.participants.get(info.participantId);
      room.participants.delete(info.participantId);
      if (room.hostId === info.participantId && room.participants.size) {
        const next = Array.from(room.participants.values()).sort((a,b) => a.joinedAt - b.joinedAt)[0];
        room.hostId = next.id;
        room.participants.forEach((p) => { p.isHost = p.id === next.id; });
      }
      const systemMessage: ChatMessage | undefined = leaving ? { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, senderId: 'system', senderName: 'SyncBeat', senderAvatar: '', text: `${leaving.name} left the room.`, type: 'system', timestamp: Date.now() } : undefined;
      if (systemMessage) room.chatMessages.push(systemMessage);
      broadcastAll(info.roomId, { type: 'PARTICIPANT_LEFT', payload: { participantId: info.participantId, participantName: leaving?.name || 'Listener', participants: Array.from(room.participants.values()), newHostId: room.hostId, systemMessage } });
      if (room.participants.size === 0) setTimeout(() => { const r = rooms.get(info.roomId); if (r && r.participants.size === 0) rooms.delete(info.roomId); }, 60_000);
      clientRoomMap.delete(ws);
    });
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', activeRooms: rooms.size, catalog: 'external-only', timestamp: Date.now() }));
  app.get('/api/songs', (_req, res) => res.json({ success: true, count: 0, songs: [], source: 'youtube' }));
  app.get('/api/songs/:id', (_req, res) => res.status(404).json({ error: 'Track is not part of a bundled catalog. Search YouTube for the real track.' }));
  app.get(['/api/audio/stream/:songId', '/api/stream/:songId', '/api/songs/:songId/stream'], (_req, res) => res.status(410).json({ error: 'Synthetic/bundled audio streaming has been removed. Use the official YouTube embedded player.' }));
  app.get('/api/rooms', (_req, res) => res.json({ rooms: Array.from(rooms.values()).filter((r) => r.isPublic || r.participants.size > 0).map((r) => ({ roomId: r.roomId, roomName: r.roomName, moodTheme: r.moodTheme, currentSongId: r.currentSongId, participantCount: r.participants.size, isPlaying: r.isPlaying })) }));
  app.get('/api/rooms/:id', (req, res) => { const room = rooms.get(req.params.id); if (!room) return res.status(404).json({ error: 'Room not found' }); res.json({ room: serializeRoom(room) }); });

  const handleGeneratePlaylist = async (req: express.Request, res: express.Response) => {
    const { mood = 'chill', prompt = 'music session', currentLanguage = 'Hindi / English' } = req.body || {};
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ success: false, error: 'AI playlist generation is not configured. Search real tracks on YouTube instead.' });
    try { const ai = getGeminiClient(); const response = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: `Suggest 6-10 REAL, well-known songs for mood=${mood}, request=${prompt}, language=${currentLanguage}. Do not invent songs. Return JSON only: {"playlistTitle":"string","description":"string","tracks":[{"title":"string","artist":"string","mood":"string"}]}. These are recommendations only; the app must verify each track through YouTube search before making it playable.`, config: { responseMimeType: 'application/json' } }); const parsed = JSON.parse(response.text || '{}'); return res.json({ success: true, playlist: { title: parsed.playlistTitle || `${mood} mix`, description: parsed.description || `AI recommendations for ${prompt}`, tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [], source: 'gemini-recommendation-only', requiresVerification: true } }); } catch { return res.status(502).json({ success: false, error: 'AI recommendation service failed. Use YouTube search instead.' }); }
  };
  app.post('/api/gemini/generate-playlist', handleGeneratePlaylist); app.post('/api/ai/generate-playlist', handleGeneratePlaylist);

  const handleAnalyzeLyrics = async (req: express.Request, res: express.Response) => { const { songTitle = 'Song', artist = 'Artist', lyricsSnippet = '', targetLanguage = 'English' } = req.body || {}; if (!process.env.GEMINI_API_KEY) return res.status(503).json({ success: false, error: 'Lyrics AI is not configured.' }); try { const ai = getGeminiClient(); const response = await ai.models.generateContent({ model: 'gemini-3.7-flash', contents: `Explain the meaning and cultural context of ${songTitle} by ${artist}. User supplied snippet: ${lyricsSnippet}. Target language: ${targetLanguage}. Do not fabricate lyrics.` }); return res.json({ success: true, analysis: response.text || '' }); } catch { return res.status(502).json({ success: false, error: 'Lyrics analysis failed.' }); } };
  app.post('/api/gemini/analyze-lyrics', handleAnalyzeLyrics); app.post('/api/lyrics/meaning', handleAnalyzeLyrics);
  app.post('/api/playlist/import', (req, res) => { const url = String(req.body?.url || ''); if (!/(?:youtube\.com|youtu\.be)/i.test(url)) return res.status(400).json({ success: false, error: 'Only YouTube playlist URLs are currently resolved automatically. Other providers require their official APIs/OAuth.' }); return res.json({ success: true, platform: 'YouTube', playlistTitle: 'YouTube playlist', importedCount: 0, sourceUrl: url, requiresYouTubeAuthOrDataApi: true }); });

  if (process.env.NODE_ENV !== 'production') { const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares); }
  else { const distPath = path.join(process.cwd(), 'dist'); app.use(express.static(distPath)); app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html'))); }
  server.listen(PORT, '0.0.0.0', () => console.log(`SyncBeat server running on port ${PORT}`));
}

startServer().catch((error) => { console.error('Failed to start SyncBeat server:', error); process.exit(1); });