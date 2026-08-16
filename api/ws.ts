import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

type Participant = { id: string; name: string; avatar: string; isHost: boolean; joinedAt: number };
type FocusMode = { active: boolean; timerType: 'pomodoro' | 'stopwatch' | 'idle'; duration: number; remaining: number; isRunning: boolean; startedAt: number | null };
type Room = {
  roomId: string; roomName: string; moodTheme: string; hostId: string; isPublic: boolean;
  currentSongId: string | null; isPlaying: boolean; playbackPosition: number; playbackRate: number; lastStateUpdate: number;
  queue: string[]; participants: Map<string, Participant>; clients: Map<WebSocket, string>; chatMessages: any[]; focusMode: FocusMode;
};

const rooms = new Map<string, Room>();
function createRoom(roomId: string, participant: Participant, options: any = {}): Room {
  return { roomId, roomName: String(options.roomName || `Sync Room ${roomId}`).slice(0, 80), moodTheme: String(options.moodTheme || 'vibe').slice(0, 30), hostId: participant.id, isPublic: options.isPublic !== false, currentSongId: typeof options.initialSongId === 'string' ? options.initialSongId : null, isPlaying: false, playbackPosition: 0, playbackRate: 1, lastStateUpdate: Date.now(), queue: options.initialSongId ? [options.initialSongId] : [], participants: new Map(), clients: new Map(), chatMessages: [], focusMode: { active: false, timerType: 'idle', duration: 1500, remaining: 1500, isRunning: false, startedAt: null } };
}
function currentPosition(room: Room) { return room.isPlaying ? Math.max(0, room.playbackPosition + ((Date.now() - room.lastStateUpdate) / 1000) * room.playbackRate) : room.playbackPosition; }
function serializeRoom(room: Room) { return { roomId: room.roomId, roomName: room.roomName, moodTheme: room.moodTheme, hostId: room.hostId, currentSongId: room.currentSongId, isPlaying: room.isPlaying, playbackPosition: currentPosition(room), playbackRate: room.playbackRate, lastStateUpdate: room.lastStateUpdate, queue: room.queue, participants: [...room.participants.values()], chatMessages: room.chatMessages.slice(-50), focusMode: room.focusMode, isPublic: room.isPublic }; }
function send(ws: WebSocket, type: string, payload: unknown) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, payload })); }
function broadcast(room: Room, type: string, payload: unknown, except?: WebSocket) { for (const ws of room.clients.keys()) if (ws !== except) send(ws, type, payload); }

const server = http.createServer((_req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ status: 'ok', service: 'syncbeat-session-websocket' })); });
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (request, socket, head) => { const pathname = new URL(request.url || '/', 'http://localhost').pathname; if (pathname !== '/api/ws' && pathname !== '/ws') { socket.destroy(); return; } wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request)); });

wss.on('connection', (ws) => {
  let room: Room | null = null; let participantId: string | null = null;
  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString()); const type = message.type; const payload = message.payload || {};
      if (type === 'PING') { send(ws, 'PONG', { timestamp: payload.timestamp || Date.now() }); return; }
      if (type === 'JOIN_ROOM') {
        const requestedId = String(message.roomId || '').trim(); if (!requestedId) return;
        const incoming = payload.participant || {}; participantId = String(incoming.id || `guest-${Math.random().toString(36).slice(2, 9)}`);
        const participant: Participant = { id: participantId, name: String(incoming.name || 'Listener').slice(0, 40), avatar: String(incoming.avatar || '').slice(0, 500), isHost: false, joinedAt: Date.now() };
        room = rooms.get(requestedId) || createRoom(requestedId, participant, payload); rooms.set(requestedId, room);
        participant.isHost = room.participants.size === 0 || room.hostId === participant.id; if (room.participants.size === 0) room.hostId = participant.id;
        room.participants.set(participant.id, participant); room.clients.set(ws, participant.id); send(ws, 'ROOM_SYNC_STATE', serializeRoom(room));
        const systemMessage = { id: `msg-${Date.now()}`, senderId: 'system', senderName: 'SyncBeat', senderAvatar: '', text: `${participant.name} joined the room.`, type: 'system', timestamp: Date.now() };
        room.chatMessages.push(systemMessage); broadcast(room, 'PARTICIPANT_JOINED', { participant, participants: [...room.participants.values()], systemMessage }, ws); return;
      }
      if (!room || !participantId) return;
      if (type === 'PLAYBACK_ACTION') {
        const action = payload.action;
        if (action === 'PLAY_PAUSE') { room.playbackPosition = Number(payload.position) >= 0 ? Number(payload.position) : currentPosition(room); room.isPlaying = Boolean(payload.isPlaying); }
        else if (action === 'SEEK') room.playbackPosition = Math.max(0, Number(payload.position) || 0);
        else if (action === 'CHANGE_SONG') { if (!payload.songId) return; room.currentSongId = String(payload.songId); room.playbackPosition = Math.max(0, Number(payload.position) || 0); room.isPlaying = payload.isPlaying !== false; if (!room.queue.includes(room.currentSongId)) room.queue = [room.currentSongId, ...room.queue]; }
        else if (action === 'SET_RATE') room.playbackRate = Math.max(0.25, Math.min(2, Number(payload.playbackRate) || 1));
        else return;
        room.lastStateUpdate = Date.now();
        broadcast(room, 'PLAYBACK_SYNC', { currentSongId: room.currentSongId, songId: room.currentSongId, isPlaying: room.isPlaying, playbackPosition: room.playbackPosition, position: room.playbackPosition, playbackRate: room.playbackRate, lastStateUpdate: room.lastStateUpdate, actionBy: participantId }); return;
      }
      if (type === 'QUEUE_UPDATE') {
        const rawQueue: unknown[] = Array.isArray(payload.queue) ? payload.queue : [];
        const queue: string[] = rawQueue.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0).slice(0, 100);
        room.queue = [...new Set(queue)]; broadcast(room, 'QUEUE_SYNC', { queue: room.queue }); return;
      }
      if (type === 'SEND_CHAT') {
        const text = String(payload.text || '').trim().slice(0, 1000); if (!text) return;
        const msg = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, senderId: participantId, senderName: String(payload.senderName || 'Listener').slice(0, 40), senderAvatar: String(payload.senderAvatar || '').slice(0, 500), text, type: payload.type || 'text', timestamp: Date.now(), reactionEmoji: payload.reactionEmoji, soundName: payload.soundName };
        room.chatMessages.push(msg); room.chatMessages = room.chatMessages.slice(-80); broadcast(room, 'NEW_CHAT_MESSAGE', msg); broadcast(room, 'RECEIVE_CHAT', msg); return;
      }
      if (type === 'BURST_REACTION') { broadcast(room, 'REACTION_BURST', { emoji: String(payload.emoji || '❤️').slice(0, 8), senderId: participantId, senderName: payload.senderName, x: Math.max(0, Math.min(1, Number(payload.x) || 0.5)), soundEffect: payload.soundEffect }); return; }
      if (type === 'FOCUS_TIMER_ACTION') {
        const f = room.focusMode;
        if (payload.action === 'SET_TIMER') { f.timerType = payload.timerType || 'pomodoro'; f.duration = Math.max(0, Number(payload.duration) || 0); f.remaining = Math.max(0, Number(payload.remaining ?? f.duration)); f.isRunning = Boolean(payload.isRunning); f.active = true; f.startedAt = f.isRunning ? Date.now() : null; }
        else if (payload.action === 'TOGGLE_TIMER') { f.isRunning = Boolean(payload.isRunning); f.startedAt = f.isRunning ? Date.now() : null; }
        else if (payload.action === 'RESET_TIMER') { f.remaining = f.duration; f.isRunning = false; f.startedAt = null; }
        broadcast(room, 'FOCUS_TIMER_SYNC', f); return;
      }
    } catch { /* malformed messages are ignored */ }
  });
  ws.on('close', () => {
    if (!room || !participantId) return; room.clients.delete(ws); const leaving = room.participants.get(participantId); room.participants.delete(participantId);
    if (room.hostId === participantId && room.participants.size > 0) { const next = [...room.participants.values()][0]; room.hostId = next.id; room.participants.forEach((p) => { p.isHost = p.id === next.id; }); }
    broadcast(room, 'PARTICIPANT_LEFT', { participantId, participantName: leaving?.name || 'Listener', participants: [...room.participants.values()], newHostId: room.hostId });
    if (room.participants.size === 0) rooms.delete(room.roomId);
  });
});

export default server;
