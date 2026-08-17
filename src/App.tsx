import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MainNavTab, ExperienceMode, SupportedLanguage, AppTheme, Song, Playlist, RoomState, AudioQuality, FocusTimerState, AmbientSounds, UserProfile } from './types';
import { initialSongs, defaultPlaylists } from './data/songs';
import { translations } from './data/translations';
import { audioEngine } from './services/audioEngine';
import { wsClient } from './services/websocketClient';
import { persistenceService } from './services/persistenceService';
import { cloudPersistenceService } from './services/cloudPersistenceService';
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
import { AuthController } from './components/AuthController';

const defaultProfile = (): UserProfile => ({ id: `local-${Math.random().toString(36).slice(2, 9)}`, name: 'Listener', avatar: '', statusMessage: 'Listening on SyncBeat', presenceMode: 'available-to-join', language: 'en', theme: 'neon-obsidian', quality: 'high-320k', isWifiOnlyDownloads: true, favoriteGenres: [], stats: { minutesListened: 0, sessionsJoined: 0, focusHours: 0, streakDays: 0 } });

export function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => persistenceService.getProfile() ?? defaultProfile());
  const [currentTab, setCurrentTab] = useState<MainNavTab>('home');
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>('standard');
  const [language, setLanguage] = useState<SupportedLanguage>(userProfile.language || 'en');
  const [theme, setTheme] = useState<AppTheme>(userProfile.theme || 'neon-obsidian');
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => { const saved = persistenceService.getPlaylists(); return saved.length ? saved : defaultPlaylists; });
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(() => new Set(persistenceService.getLikedIds()));
  const [downloadedSongIds, setDownloadedSongIds] = useState<Set<string>>(new Set());
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [activeRoom, setActiveRoom] = useState<RoomState | null>(null);
  const [latencyMs, setLatencyMs] = useState(0);
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
  useEffect(() => { const profile = { ...userProfile, language, theme }; persistenceService.setProfile(profile); cloudPersistenceService.saveProfile(profile).catch(() => undefined); }, [userProfile, language, theme]);

  useEffect(() => {
    const onCloudRestored = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (!data) return;
      if (Array.isArray(data.likedIds)) setLikedSongIds(new Set(data.likedIds));
      if (Array.isArray(data.playlists)) setPlaylists(data.playlists);
      if (data.profile) {
        setUserProfile((prev) => ({ ...prev, name: data.profile.display_name ?? prev.name, avatar: data.profile.avatar_url ?? prev.avatar, statusMessage: data.profile.status_message ?? prev.statusMessage, presenceMode: data.profile.presence_mode ?? prev.presenceMode, language: data.profile.language ?? prev.language, theme: data.profile.theme ?? prev.theme, quality: data.profile.audio_quality ?? prev.quality, favoriteGenres: data.profile.favorite_genres ?? prev.favoriteGenres }));
      }
    };
    window.addEventListener('syncbeat:cloud-restored', onCloudRestored);
    return () => window.removeEventListener('syncbeat:cloud-restored', onCloudRestored);
  }, []);

  useEffect(() => { const unsub = audioEngine.onPositionChange(setPlaybackPosition); return () => unsub(); }, []);
  useEffect(() => { const unsub = audioEngine.onEnded(() => handleNextTrack()); return () => unsub(); }, [queue, currentSong, isShuffle, repeatMode]);
  useEffect(() => { const unsub = wsClient.addListener((event) => { if (event.type === 'ROOM_SYNC_STATE') setActiveRoom(event.payload as RoomState); }); return () => unsub(); }, []);
  useEffect(() => { if (!timerState.isRunning) return; const i = window.setInterval(() => setTimerState((p) => p.remaining <= 1 ? { ...p, remaining: 0, isRunning: false, completedSessions: p.completedSessions + 1 } : { ...p, remaining: p.remaining - 1 }), 1000); return () => clearInterval(i); }, [timerState.isRunning]);
  useEffect(() => { if (!isStopwatchRunning) return; const i = window.setInterval(() => setStopwatchSeconds((p) => p + 1), 1000); return () => clearInterval(i); }, [isStopwatchRunning]);
  useEffect(() => { const i = window.setInterval(() => setLatencyMs(wsClient.getLatency()), 4000); return () => clearInterval(i); }, []);

  const handlePlaySong = useCallback((song: Song) => {
    setCurrentSong(song); setPlaybackPosition(0); setIsPlaying(true); void audioEngine.playSong(song, 0);
    setQueue((prev) => prev.some((s) => s.id === song.id) ? prev : [song, ...prev]);
    const source = activeRoom ? 'session' : 'app';
    persistenceService.addHistory({ song, playedAt: Date.now(), source });
    cloudPersistenceService.recordHistory(song, source).catch(() => undefined);
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
    if (!queue.length) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);
    const nextIndex = repeatMode === 'one' ? Math.max(currentIndex, 0) : isShuffle ? Math.floor(Math.random() * queue.length) : (currentIndex + 1) % queue.length;
    if (queue[nextIndex]) handlePlaySong(queue[nextIndex]);
  }, [queue, currentSong, isShuffle, repeatMode, handlePlaySong]);
  const handlePrevTrack = useCallback(() => { if (!queue.length) return; const i = queue.findIndex((s) => s.id === currentSong?.id); handlePlaySong(queue[(i - 1 + queue.length) % queue.length]); }, [queue, currentSong, handlePlaySong]);
  const handleSeek = useCallback((seconds: number) => { audioEngine.seek(seconds); setPlaybackPosition(seconds); if (activeRoom) wsClient.broadcastPlayback('SEEK', { position: seconds, isPlaying, senderName: userProfile.name }); }, [activeRoom, isPlaying, userProfile.name]);
  const handleAddToQueue = useCallback((song: Song) => setQueue((prev) => prev.some((s) => s.id === song.id) ? prev : [...prev, song]), []);
  const handleRemoveFromQueue = useCallback((index: number) => setQueue((prev) => prev.filter((_, i) => i !== index)), []);
  const handleToggleLike = useCallback((songId: string) => { const song = songs.find((s) => s.id === songId) ?? currentSong ?? undefined; setLikedSongIds((prev) => { const next = new Set(prev); const liked = !next.has(songId); liked ? next.add(songId) : next.delete(songId); if (song) cloudPersistenceService.setLiked(song, liked).catch(() => undefined); return next; }); }, [songs, currentSong]);
  const handleToggleDownload = useCallback((song: Song) => setDownloadedSongIds((prev) => { const next = new Set(prev); if (next.has(song.id)) next.delete(song.id); else next.add(song.id); return next; }), []);
  const handleCreateRoom = useCallback((name: string, mood: string, isPrivate = false) => { wsClient.createRoom(name, userProfile.name, mood, isPrivate); setCurrentTab('sessions'); }, [userProfile.name]);
  const handleJoinRoom = useCallback((roomId: string) => { const id = roomId.includes('?room=') ? new URL(roomId).searchParams.get('room') || roomId : roomId; wsClient.joinRoom(id, userProfile.name, userProfile.avatar); setCurrentTab('sessions'); }, [userProfile.name, userProfile.avatar]);
  const handleLeaveRoom = useCallback(() => { wsClient.leaveRoom(); setActiveRoom(null); }, []);
  const handleSendChatMessage = useCallback((text: string, _type?: 'text' | 'reaction' | 'moment' | 'sound', _emoji?: string, soundName?: string) => { if (activeRoom) { wsClient.sendChatMessage(text); if (soundName) audioEngine.playReactionSound(soundName); } }, [activeRoom]);
  const handleTriggerFloatingReaction = useCallback((emoji: string) => { if (activeRoom) wsClient.burstReaction(emoji); }, [activeRoom]);
  const handleSelectPlaylist = useCallback((playlist: Playlist) => { const plSongs = songs.filter((s) => playlist.songIds.includes(s.id)); if (plSongs.length) { setQueue(plSongs); handlePlaySong(plSongs[0]); } }, [songs, handlePlaySong]);
  const handleImportPlaylist = useCallback((newPl: Playlist, newSongs?: Song[]) => { if (newSongs?.length) setSongs((prev) => [...newSongs.filter((s) => !prev.some((x) => x.id === s.id)), ...prev]); setPlaylists((prev) => [newPl, ...prev]); cloudPersistenceService.savePlaylist(newPl, [...songs, ...(newSongs ?? [])]).catch(() => undefined); }, [songs]);
  const handleExperienceChange = useCallback((mode: ExperienceMode) => { setExperienceMode(mode); const nextTheme: AppTheme = mode === 'love' ? 'bollywood-ruby' : mode === 'focus' ? 'focus-emerald' : mode === 'gym' ? 'sapphire-gym' : 'neon-obsidian'; setTheme(nextTheme); }, []);
  const updateProfile = useCallback((updated: Partial<UserProfile>) => setUserProfile((prev) => ({ ...prev, ...updated })), []);
  const onLanguageChange = useCallback((value: SupportedLanguage) => { setLanguage(value); updateProfile({ language: value }); }, [updateProfile]);
  const onThemeChange = useCallback((value: AppTheme) => { setTheme(value); updateProfile({ theme: value }); }, [updateProfile]);
  const onOpenLyrics = useCallback(() => setCurrentTab('lyrics'), []);
  const onSelectSessionSong = useCallback((song: Song) => handlePlaySong(song), [handlePlaySong]);
  const commonProps = useMemo(() => ({ currentSong, isPlaying, playbackPosition, onPlaySong: handlePlaySong, onTogglePlay: handleTogglePlay, onNext: handleNextTrack, onPrev: handlePrevTrack, onSeek: handleSeek, onAddToQueue: handleAddToQueue, onRemoveFromQueue: handleRemoveFromQueue }), [currentSong, isPlaying, playbackPosition, handlePlaySong, handleTogglePlay, handleNextTrack, handlePrevTrack, handleSeek, handleAddToQueue, handleRemoveFromQueue]);
  const currentUser = useMemo(() => ({ id: userProfile.id, name: userProfile.name, avatar: userProfile.avatar }), [userProfile.id, userProfile.name, userProfile.avatar]);

  return <div className="min-h-screen bg-zinc-950 text-white">
    <Navbar currentTab={currentTab} onTabChange={setCurrentTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
    <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
    <main className="min-h-screen px-4 pb-32 pt-20 lg:pl-64 lg:pr-80">
      {currentTab === 'home' && <HomeView {...commonProps} songs={songs} playlists={playlists} likedSongIds={likedSongIds} downloadedSongIds={downloadedSongIds} onToggleLike={handleToggleLike} onToggleDownload={handleToggleDownload} onJoinRoom={handleJoinRoom} onOpenAiGenerator={() => setIsAiGeneratorOpen(true)} onSelectPlaylist={handleSelectPlaylist} onSelectExperience={handleExperienceChange} onNavigateTab={setCurrentTab} language={language} experienceMode={experienceMode} />}
      {currentTab === 'search' && <SearchView {...commonProps} songs={songs} playlists={playlists} searchQuery={searchQuery} onSearchChange={setSearchQuery} onToggleLike={handleToggleLike} likedSongIds={likedSongIds} downloadedSongIds={downloadedSongIds} onToggleDownload={handleToggleDownload} onSelectPlaylist={handleSelectPlaylist} onJoinRoom={handleJoinRoom} language={language} />}
      {currentTab === 'sessions' && <SessionsView room={activeRoom} currentSong={currentSong} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} onNextTrack={handleNextTrack} onSelectSong={onSelectSessionSong} availableSongs={songs} currentUser={currentUser} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onLeaveRoom={handleLeaveRoom} onOpenLyrics={onOpenLyrics} language={language} latencyMs={latencyMs} />}
      {currentTab === 'focus' && <FocusView timerState={timerState} onToggleTimer={() => setTimerState((p) => ({ ...p, isRunning: !p.isRunning }))} onResetTimer={() => setTimerState((p) => ({ ...p, remaining: p.duration, isRunning: false }))} stopwatchSeconds={stopwatchSeconds} isStopwatchRunning={isStopwatchRunning} onToggleStopwatch={() => setIsStopwatchRunning((p) => !p)} ambientSounds={ambientSounds} onAmbientSoundsChange={setAmbientSounds} />}
      {currentTab === 'library' && <LibraryView allSongs={songs} downloadedSongIds={downloadedSongIds} likedSongIds={likedSongIds} customPlaylists={playlists} currentSong={currentSong} isPlaying={isPlaying} onPlaySong={handlePlaySong} onTogglePlay={handleTogglePlay} onToggleDownload={handleToggleDownload} onToggleLike={handleToggleLike} isOfflineMode={isOfflineMode} onToggleOfflineMode={() => setIsOfflineMode((p) => !p)} onClearOfflineCache={() => setDownloadedSongIds(new Set())} onSelectPlaylist={handleSelectPlaylist} onOpenImporter={() => setCurrentTab('importer')} language={language} />}
      {currentTab === 'profile' && <ProfileView profile={userProfile} onUpdateProfile={updateProfile} language={language} onLanguageChange={onLanguageChange} theme={theme} onThemeChange={onThemeChange} onOpenEqualizer={() => setIsEqualizerOpen(true)} />}
      {currentTab === 'lyrics' && <LyricsView currentSong={currentSong} playbackPosition={playbackPosition} />}
      {currentTab === 'importer' && <PlaylistImporterView onImport={handleImportPlaylist} />}
    </main>
    <RightContextPanel currentSong={currentSong} queue={queue} isPlaying={isPlaying} activeRoom={activeRoom} currentTime={playbackPosition} onPlaySong={handlePlaySong} onRemoveFromQueue={handleRemoveFromQueue} onSendChatMessage={handleSendChatMessage} onTriggerFloatingReaction={handleTriggerFloatingReaction} onOpenLyrics={onOpenLyrics} />
    <AudioPlayerBar currentSong={currentSong} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} onNext={handleNextTrack} onPrev={handlePrevTrack} playbackPosition={playbackPosition} onSeek={handleSeek} theme={theme} quality={userProfile.quality as AudioQuality} onChangeQuality={(quality) => updateProfile({ quality })} onOpenLyrics={onOpenLyrics} onOpenEqualizer={() => setIsEqualizerOpen(true)} onOpenShare={() => setIsShareOpen(true)} isDownloaded={!!currentSong && downloadedSongIds.has(currentSong.id)} onToggleDownload={handleToggleDownload} isShuffle={isShuffle} onToggleShuffle={() => setIsShuffle((p) => !p)} repeatMode={repeatMode} onCycleRepeat={() => setRepeatMode((p) => p === 'off' ? 'all' : p === 'all' ? 'one' : 'off')} />
    <AuthController />
    {isEqualizerOpen && <EqualizerModal onClose={() => setIsEqualizerOpen(false)} />}
    {isShareOpen && <ShareModal onClose={() => setIsShareOpen(false)} song={currentSong} />}
    {isAiGeneratorOpen && <AIGeneratorModal onClose={() => setIsAiGeneratorOpen(false)} onAddToQueue={handleAddToQueue} />}
  </div>;
}

export default App;
