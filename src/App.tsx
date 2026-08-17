import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MainNavTab, ExperienceMode, SupportedLanguage, AppTheme, Song, Playlist,
  RoomState, AudioQuality, FocusTimerState, AmbientSounds, ChatMessage, UserProfile,
} from './types';
import { initialSongs, defaultPlaylists } from './data/songs';
import { translations } from './data/translations';
import { audioEngine } from './services/audioEngine';
import { wsClient } from './services/websocketClient';
import { persistenceService } from './services/persistenceService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RightContextPanel } from './components/RightContextPanel';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { HomeView } from './components/MainViews/HomeView';
import { SearchView } from './components/MainViews/SearchView';
import { SessionsView } from './components/MainViews/SessionsView';
import { FocusView } from './components/MainViews/FocusView';
import { LibraryView } from './components/MainViews/LibraryView';
import { ProfileView } from './components/MainViews/ProfileView';
import { LyricsView } from './components/MainViews/LyricsView';
import { PlaylistImporterView } from './components/MainViews/PlaylistImporterView';
import { EqualizerModal } from './components/Modals/EqualizerModal';
import { ShareModal } from './components/Modals/ShareModal';
import { AIGeneratorModal } from './components/Modals/AIGeneratorModal';
import confetti from 'canvas-confetti';

export function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => persistenceService.getProfile() ?? {
    id: 'local-' + Math.random().toString(36).slice(2, 9), name: 'Listener', avatar: '',
    statusMessage: 'Listening on SyncBeat', presenceMode: 'available-to-join', language: 'en',
    theme: 'neon-obsidian', quality: 'high-320k', isWifiOnlyDownloads: true, favoriteGenres: [],
    stats: { minutesListened: 0, sessionsJoined: 0, focusHours: 0, streakDays: 0 },
  });
  const [currentTab, setCurrentTab] = useState<MainNavTab>('home');
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>('standard');
  const [language, setLanguage] = useState<SupportedLanguage>(userProfile.language || 'en');
  const [theme, setTheme] = useState<AppTheme>(userProfile.theme || 'neon-obsidian');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [songs, setSongs] = useState<Song[]>(() => initialSongs);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = persistenceService.getPlaylists();
    return saved.length ? saved : defaultPlaylists;
  });
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(() => new Set(persistenceService.getLikedIds()));
  const [downloadedSongIds, setDownloadedSongIds] = useState<Set<string>>(() => new Set());
  const [activeRoom, setActiveRoom] = useState<RoomState | null>(null);
  const [timerState, setTimerState] = useState<FocusTimerState>({ mode: 'work', duration: 1500, remaining: 1500, isRunning: false, completedSessions: 0 });
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [ambientSounds, setAmbientSounds] = useState<AmbientSounds>({ rain: 0, cafe: 0, fire: 0, templeBell: 0, waves: 0, whiteNoise: 0 });
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const t = translations[language] || translations.en;

  useEffect(() => { persistenceService.setLikedIds(likedSongIds); }, [likedSongIds]);
  useEffect(() => { persistenceService.setPlaylists(playlists); }, [playlists]);
  useEffect(() => { persistenceService.setProfile({ ...userProfile, language, theme }); }, [userProfile, language, theme]);

  useEffect(() => {
    const unsubPosition = audioEngine.onPositionChange(setPlaybackPosition);
    const unsubEnded = audioEngine.onEnded(() => handleNextTrack());
    return () => { unsubPosition(); unsubEnded(); };
  }, [currentSong, queue, repeatMode, isShuffle]);

  useEffect(() => {
    const unsubWs = wsClient.addListener((event) => {
      if (event.type === 'ROOM_SYNC_STATE') setActiveRoom(event.payload as RoomState);
      else if (event.type === 'PLAYBACK_SYNC') {
        const payload = event.payload;
        if (payload.songId && currentSong?.id !== payload.songId) {
          const matched = songs.find((s) => s.id === payload.songId);
          if (matched) { setCurrentSong(matched); audioEngine.playSong(matched, payload.position || 0, payload.playbackRate || 1); setIsPlaying(!!payload.isPlaying); }
        } else if (currentSong) {
          const drift = Math.abs(audioEngine.getCurrentPosition() - (payload.position || 0));
          if (drift > 0.35) audioEngine.seek(payload.position || 0);
          if (payload.isPlaying !== isPlaying) { payload.isPlaying ? audioEngine.resume() : audioEngine.pause(); setIsPlaying(!!payload.isPlaying); }
        }
      } else if (event.type === 'RECEIVE_CHAT') {
        const chat: ChatMessage = event.payload;
        setActiveRoom((prev) => prev ? { ...prev, chatMessages: [...prev.chatMessages, chat] } : prev);
      } else if (event.type === 'FOCUS_TIMER_SYNC') {
        const p = event.payload;
        if (p.timerType === 'pomodoro') setTimerState((prev) => ({ ...prev, duration: p.duration ?? prev.duration, remaining: p.remaining ?? prev.remaining, isRunning: p.isRunning ?? prev.isRunning }));
      }
    });
    return () => unsubWs();
  }, [songs, currentSong, isPlaying]);

  useEffect(() => {
    if (!timerState.isRunning || timerState.remaining <= 0) return;
    const interval = window.setInterval(() => setTimerState((prev) => prev.remaining <= 1 ? { ...prev, remaining: 0, isRunning: false, completedSessions: prev.completedSessions + 1 } : { ...prev, remaining: prev.remaining - 1 }), 1000);
    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.remaining]);
  useEffect(() => { if (!isStopwatchRunning) return; const interval = window.setInterval(() => setStopwatchSeconds((p) => p + 1), 1000); return () => clearInterval(interval); }, [isStopwatchRunning]);
  useEffect(() => { const id = window.setInterval(() => setLatencyMs(wsClient.getLatency()), 4000); return () => clearInterval(id); }, []);

  const handlePlaySong = useCallback((song: Song) => {
    setCurrentSong(song); setPlaybackPosition(0); audioEngine.playSong(song, 0); setIsPlaying(true);
    persistenceService.addHistory({ song, playedAt: Date.now(), source: activeRoom ? 'session' : 'unknown' });
    window.dispatchEvent(new Event('syncbeat:history-updated'));
    if (activeRoom) wsClient.broadcastPlayback('CHANGE_SONG', { songId: song.id, position: 0, isPlaying: true, senderName: userProfile.name });
  }, [activeRoom, userProfile.name]);

  const handleTogglePlay = useCallback(() => {
    if (!currentSong) return;
    const position = audioEngine.getCurrentPosition();
    if (isPlaying) { audioEngine.pause(); setIsPlaying(false); if (activeRoom) wsClient.broadcastPlayback('PLAY_PAUSE', { isPlaying: false, position, senderName: userProfile.name }); }
    else { audioEngine.resume(); setIsPlaying(true); if (activeRoom) wsClient.broadcastPlayback('PLAY_PAUSE', { isPlaying: true, position, senderName: userProfile.name }); }
  }, [currentSong, isPlaying, activeRoom, userProfile.name]);

  const handleNextTrack = useCallback(() => {
    if (!queue.length) return; const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);
    const nextIndex = isShuffle ? Math.floor(Math.random() * queue.length) : repeatMode === 'one' ? Math.max(currentIndex, 0) : (currentIndex + 1) % queue.length;
    if (queue[nextIndex]) handlePlaySong(queue[nextIndex]);
  }, [queue, currentSong, isShuffle, repeatMode, handlePlaySong]);
  const handlePrevTrack = useCallback(() => { if (!queue.length) return; const i = queue.findIndex((s) => s.id === currentSong?.id); handlePlaySong(queue[(i - 1 + queue.length) % queue.length]); }, [queue, currentSong, handlePlaySong]);
  const handleSeek = (seconds: number) => { audioEngine.seek(seconds); setPlaybackPosition(seconds); if (activeRoom) wsClient.broadcastPlayback('SEEK', { position: seconds, isPlaying, senderName: userProfile.name }); };
  const handleAddToQueue = (song: Song) => setQueue((prev) => prev.some((s) => s.id === song.id) ? prev : [...prev, song]);
  const handleRemoveFromQueue = (index: number) => setQueue((prev) => prev.filter((_, i) => i !== index));
  const handleToggleLike = (songId: string) => setLikedSongIds((prev) => { const next = new Set(prev); next.has(songId) ? next.delete(songId) : next.add(songId); return next; });
  const handleToggleDownload = (_song: Song) => setIsOfflineMode(false);
  const handleCreateRoom = (name: string, mood: string, isPrivate = false) => { wsClient.createRoom(name, userProfile.name, mood, isPrivate); setCurrentTab('sessions'); };
  const handleJoinRoom = (roomId: string) => { wsClient.joinRoom(roomId, userProfile.name, userProfile.avatar); setCurrentTab('sessions'); };
  const handleLeaveRoom = () => { wsClient.leaveRoom(); setActiveRoom(null); };
  const handleSendChatMessage = (text: string, _type: 'text' | 'reaction' | 'moment' | 'sound' = 'text', _emoji?: string, soundName?: string) => { if (activeRoom) { wsClient.sendChatMessage(text); if (soundName) audioEngine.playReactionSound(soundName); } };
  const handleTriggerFloatingReaction = (emoji: string) => { if (activeRoom) wsClient.burstReaction(emoji); };
  const handleSelectPlaylist = (playlist: Playlist) => { const plSongs = songs.filter((s) => playlist.songIds.includes(s.id)); if (plSongs.length) { setQueue(plSongs); handlePlaySong(plSongs[0]); } };
  const handleImportPlaylist = (newPl: Playlist, newSongs?: Song[]) => { if (newSongs?.length) setSongs((prev) => [...newSongs.filter((s) => !prev.some((x) => x.id === s.id)), ...prev]); setPlaylists((prev) => [newPl, ...prev]); };
  const handleExperienceChange = (mode: ExperienceMode) => { setExperienceMode(mode); const nextTheme: AppTheme = mode === 'love' ? 'bollywood-ruby' : mode === 'focus' ? 'focus-emerald' : mode === 'gym' ? 'sapphire-gym' : 'neon-obsidian'; setTheme(nextTheme); };
  const handleToggleTimer = () => setTimerState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  const handleResetTimer = () => setTimerState((prev) => ({ ...prev, remaining: prev.duration, isRunning: false }));

  const commonProps = useMemo(() => ({ currentSong, isPlaying, playbackPosition, queue, onPlaySong: handlePlaySong, onTogglePlay: handleTogglePlay, onNext: handleNextTrack, onPrev: handlePrevTrack, onSeek: handleSeek, onAddToQueue: handleAddToQueue, onRemoveFromQueue: handleRemoveFromQueue }), [currentSong, isPlaying, playbackPosition, queue, handlePlaySong, handleTogglePlay, handleNextTrack, handlePrevTrack]);

  return <div className="min-h-screen bg-zinc-950 text-white">
    <Navbar currentTab={currentTab} onTabChange={setCurrentTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
    <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
    <main className="min-h-screen px-4 pb-32 pt-20 lg:pl-64 lg:pr-80">
      {currentTab === 'home' && <HomeView {...commonProps} songs={songs} onSelectExperience={handleExperienceChange} experienceMode={experienceMode} onOpenAiGenerator={() => setIsAiGeneratorOpen(true)} />}
      {currentTab === 'search' && <SearchView {...commonProps} songs={songs} searchQuery={searchQuery} onSearchChange={setSearchQuery} onToggleLike={handleToggleLike} likedSongIds={likedSongIds} />}
      {currentTab === 'sessions' && <SessionsView activeRoom={activeRoom} userProfile={userProfile} latencyMs={latencyMs} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onLeaveRoom={handleLeaveRoom} onPlaySong={handlePlaySong} onTogglePlay={handleTogglePlay} onSeek={handleSeek} onSendChatMessage={handleSendChatMessage} onTriggerReaction={handleTriggerFloatingReaction} />}
      {currentTab === 'focus' && <FocusView timerState={timerState} onToggleTimer={handleToggleTimer} onResetTimer={handleResetTimer} stopwatchSeconds={stopwatchSeconds} isStopwatchRunning={isStopwatchRunning} onToggleStopwatch={() => setIsStopwatchRunning((p) => !p)} ambientSounds={ambientSounds} onAmbientSoundsChange={setAmbientSounds} />}
      {currentTab === 'library' && <LibraryView allSongs={songs} downloadedSongIds={downloadedSongIds} likedSongIds={likedSongIds} customPlaylists={playlists} currentSong={currentSong} isPlaying={isPlaying} onPlaySong={handlePlaySong} onTogglePlay={handleTogglePlay} onToggleDownload={handleToggleDownload} onToggleLike={handleToggleLike} isOfflineMode={isOfflineMode} onToggleOfflineMode={() => setIsOfflineMode((p) => !p)} onClearOfflineCache={() => setDownloadedSongIds(new Set())} onSelectPlaylist={handleSelectPlaylist} onOpenImporter={() => setCurrentTab('importer')} language={language} />}
      {currentTab === 'profile' && <ProfileView userProfile={userProfile} onUpdateProfile={setUserProfile} language={language} onLanguageChange={(l) => { setLanguage(l); setUserProfile((p) => ({ ...p, language: l })); }} theme={theme} onThemeChange={(v) => { setTheme(v); setUserProfile((p) => ({ ...p, theme: v })); }} />}
      {currentTab === 'lyrics' && <LyricsView currentSong={currentSong} playbackPosition={playbackPosition} />}
      {currentTab === 'importer' && <PlaylistImporterView onImport={handleImportPlaylist} />}
    </main>
    <RightContextPanel activeRoom={activeRoom} latencyMs={latencyMs} onSelectPlaylist={handleSelectPlaylist} onOpenShare={() => setIsShareOpen(true)} />
    <AudioPlayerBar {...commonProps} onToggleLike={() => currentSong && handleToggleLike(currentSong.id)} isLiked={!!currentSong && likedSongIds.has(currentSong.id)} onToggleShuffle={() => setIsShuffle((p) => !p)} isShuffle={isShuffle} repeatMode={repeatMode} onCycleRepeat={() => setRepeatMode((p) => p === 'off' ? 'all' : p === 'all' ? 'one' : 'off')} onOpenEqualizer={() => setIsEqualizerOpen(true)} onOpenShare={() => setIsShareOpen(true)} />
    {isEqualizerOpen && <EqualizerModal onClose={() => setIsEqualizerOpen(false)} />}
    {isShareOpen && <ShareModal onClose={() => setIsShareOpen(false)} song={currentSong} />}
    {isAiGeneratorOpen && <AIGeneratorModal onClose={() => setIsAiGeneratorOpen(false)} onAddToQueue={handleAddToQueue} />}
  </div>;
}
