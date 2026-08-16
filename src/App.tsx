import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MainNavTab,
  ExperienceMode,
  SupportedLanguage,
  AppTheme,
  Song,
  Playlist,
  RoomState,
  AudioQuality,
  FocusTimerState,
  AmbientSounds,
  ChatMessage,
  UserProfile,
} from './types';
import { initialSongs, defaultPlaylists } from './data/songs';
import { translations } from './data/translations';
import { audioEngine } from './services/audioEngine';
import { wsClient } from './services/websocketClient';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RightContextPanel } from './components/RightContextPanel';
import { AudioPlayerBar } from './components/AudioPlayerBar';

// Main Views
import { HomeView } from './components/MainViews/HomeView';
import { SearchView } from './components/MainViews/SearchView';
import { SessionsView } from './components/MainViews/SessionsView';
import { FocusView } from './components/MainViews/FocusView';
import { LibraryView } from './components/MainViews/LibraryView';
import { ProfileView } from './components/MainViews/ProfileView';
import { LyricsView } from './components/MainViews/LyricsView';
import { PlaylistImporterView } from './components/MainViews/PlaylistImporterView';

// Modals
import { EqualizerModal } from './components/Modals/EqualizerModal';
import { ShareModal } from './components/Modals/ShareModal';
import { AIGeneratorModal } from './components/Modals/AIGeneratorModal';
import confetti from 'canvas-confetti';

export function App() {
  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('syncbeat_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'user-' + Math.random().toString(36).substring(2, 9),
      name: 'Aarav Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      statusMessage: 'Vibing to Midnight Chai & Sitar Lofi ☕',
      presenceMode: 'listening-now',
      stats: {
        minutesListened: 1420,
        sessionsJoined: 28,
        focusHours: 19,
        streakDays: 7,
      },
      quality: 'high-320k',
    };
  });

  // App Core State
  const [currentTab, setCurrentTab] = useState<MainNavTab>('home');
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>('love');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [theme, setTheme] = useState<AppTheme>('neon-obsidian');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [latencyMs, setLatencyMs] = useState(18);

  // Playback & Queue State
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('syncbeat_imported_songs');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(initialSongs.map((s) => s.id));
        const custom = parsed.filter((s: Song) => !existingIds.has(s.id));
        return [...custom, ...initialSongs];
      }
    } catch {}
    return initialSongs;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('syncbeat_custom_playlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(defaultPlaylists.map((p) => p.id));
        const custom = parsed.filter((p: Playlist) => !existingIds.has(p.id));
        return [...custom, ...defaultPlaylists];
      }
    } catch {}
    return defaultPlaylists;
  });

  const [currentSong, setCurrentSong] = useState<Song | null>(initialSongs[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [queue, setQueue] = useState<Song[]>(initialSongs);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');

  // Library & Downloads State
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('syncbeat_liked_songs');
      return saved ? new Set(JSON.parse(saved)) : new Set(['song-tum-hi-ho', 'song-kesariya', 'song-lofi-monsoon']);
    } catch {
      return new Set(['song-tum-hi-ho', 'song-kesariya', 'song-lofi-monsoon']);
    }
  });

  const [downloadedSongIds, setDownloadedSongIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('syncbeat_downloaded_songs');
      return saved ? new Set(JSON.parse(saved)) : new Set(['song-tum-hi-ho', 'song-perfect', 'song-zinda-phonk', 'song-arabic-kuthu']);
    } catch {
      return new Set(['song-tum-hi-ho', 'song-perfect', 'song-zinda-phonk', 'song-arabic-kuthu']);
    }
  });

  // Real-Time Listen Together Room State
  const [activeRoom, setActiveRoom] = useState<RoomState | null>(null);

  // Study & Focus Productivity State
  const [timerState, setTimerState] = useState<FocusTimerState>({
    mode: 'work',
    duration: 1500, // 25 min default
    remaining: 1500,
    isRunning: false,
    completedSessions: 3,
  });

  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);

  const [ambientSounds, setAmbientSounds] = useState<AmbientSounds>({
    rain: 0,
    cafe: 0,
    fire: 0,
    templeBell: 0,
    waves: 0,
    whiteNoise: 0,
  });

  // Modal Open States
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);

  // Save liked & downloaded songs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('syncbeat_liked_songs', JSON.stringify(Array.from(likedSongIds)));
    } catch (e) {}
  }, [likedSongIds]);

  useEffect(() => {
    try {
      localStorage.setItem('syncbeat_downloaded_songs', JSON.stringify(Array.from(downloadedSongIds)));
    } catch (e) {}
  }, [downloadedSongIds]);

  useEffect(() => {
    try {
      localStorage.setItem('syncbeat_user_profile', JSON.stringify(userProfile));
    } catch (e) {}
  }, [userProfile]);

  // Audio Engine Event Subscriptions
  useEffect(() => {
    const unsubPosition = audioEngine.onPositionChange((pos) => {
      setPlaybackPosition(pos);
    });

    const unsubEnded = audioEngine.onEnded(() => {
      handleNextTrack();
    });

    return () => {
      unsubPosition();
      unsubEnded();
    };
  }, [currentSong, queue, repeatMode, isShuffle]);

  // WebSocket Event Listeners
  useEffect(() => {
    const unsubWs = wsClient.addListener((event) => {
      if (event.type === 'ROOM_SYNC_STATE') {
        const room: RoomState = event.payload;
        setActiveRoom(room);

        // Sync song if different
        if (room.currentSongId && (!currentSong || currentSong.id !== room.currentSongId)) {
          const matched = songs.find((s) => s.id === room.currentSongId);
          if (matched) {
            setCurrentSong(matched);
            if (room.isPlaying) {
              audioEngine.playSong(matched, room.playbackPosition, room.playbackRate);
              setIsPlaying(true);
            }
          }
        }
      } else if (event.type === 'PLAYBACK_SYNC') {
        const payload = event.payload;
        const currentPos = audioEngine.getCurrentPosition();
        const drift = Math.abs(currentPos - payload.position);

        if (payload.songId && currentSong?.id !== payload.songId) {
          const matched = songs.find((s) => s.id === payload.songId);
          if (matched) {
            setCurrentSong(matched);
            if (payload.isPlaying) {
              audioEngine.playSong(matched, payload.position, payload.playbackRate);
              setIsPlaying(true);
            }
          }
        } else {
          // Drift compensation: if client is desynced by > 0.35s from server clock, re-seek smoothly
          if (drift > 0.35) {
            audioEngine.seek(payload.position);
          }

          if (payload.isPlaying !== isPlaying) {
            if (payload.isPlaying) {
              if (currentSong) audioEngine.playSong(currentSong, payload.position);
              setIsPlaying(true);
            } else {
              audioEngine.pause();
              setIsPlaying(false);
            }
          }
        }
      } else if (event.type === 'RECEIVE_CHAT') {
        const chat: ChatMessage = event.payload;
        setActiveRoom((prev) => (prev ? { ...prev, chatMessages: [...prev.chatMessages, chat] } : prev));
      } else if (event.type === 'FOCUS_TIMER_SYNC') {
        const timerPayload = event.payload;
        if (timerPayload.timerType === 'pomodoro') {
          setTimerState((prev) => ({
            ...prev,
            duration: timerPayload.duration || prev.duration,
            remaining: timerPayload.remaining !== undefined ? timerPayload.remaining : prev.remaining,
            isRunning: timerPayload.isRunning !== undefined ? timerPayload.isRunning : prev.isRunning,
          }));
        }
      }
    });

    return () => {
      unsubWs();
    };
  }, [songs, currentSong, isPlaying]);

  // Pomodoro Timer Interval
  useEffect(() => {
    let interval: number | null = null;
    if (timerState.isRunning && timerState.remaining > 0) {
      interval = window.setInterval(() => {
        setTimerState((prev) => {
          if (prev.remaining <= 1) {
            audioEngine.playTempleBellSound();
            confetti({ particleCount: 50, spread: 80 });
            return {
              ...prev,
              remaining: 0,
              isRunning: false,
              completedSessions: prev.completedSessions + 1,
            };
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning, timerState.remaining]);

  // Stopwatch Interval
  useEffect(() => {
    let interval: number | null = null;
    if (isStopwatchRunning) {
      interval = window.setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStopwatchRunning]);

  // Check latency periodically
  useEffect(() => {
    const latInterval = setInterval(() => {
      setLatencyMs(wsClient.getLatency());
    }, 4000);
    return () => clearInterval(latInterval);
  }, []);

  // Playback Control Handlers
  const handlePlaySong = useCallback(
    (song: Song) => {
      setCurrentSong(song);
      setPlaybackPosition(0);
      audioEngine.playSong(song, 0);
      setIsPlaying(true);

      // If in a room and host, broadcast to everyone
      if (activeRoom) {
        wsClient.broadcastPlayback('CHANGE_SONG', {
          songId: song.id,
          position: 0,
          isPlaying: true,
          senderName: userProfile.name,
        });
      }
    },
    [activeRoom, userProfile.name]
  );

  const handleTogglePlay = useCallback(() => {
    if (!currentSong) return;
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
      if (activeRoom) {
        wsClient.broadcastPlayback('PLAY_PAUSE', {
          isPlaying: false,
          position: audioEngine.getCurrentPosition(),
          senderName: userProfile.name,
        });
      }
    } else {
      audioEngine.resume();
      setIsPlaying(true);
      if (activeRoom) {
        wsClient.broadcastPlayback('PLAY_PAUSE', {
          isPlaying: true,
          position: audioEngine.getCurrentPosition(),
          senderName: userProfile.name,
        });
      }
    }
  }, [currentSong, isPlaying, activeRoom, userProfile.name]);

  const handleNextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);
    let nextIndex = 0;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (repeatMode === 'one') {
      nextIndex = currentIndex >= 0 ? currentIndex : 0;
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      handlePlaySong(nextSong);
    }
  }, [queue, currentSong, isShuffle, repeatMode, handlePlaySong]);

  const handlePrevTrack = useCallback(() => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevSong = queue[prevIndex];
    if (prevSong) {
      handlePlaySong(prevSong);
    }
  }, [queue, currentSong, handlePlaySong]);

  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
    setPlaybackPosition(seconds);
    if (activeRoom) {
      wsClient.broadcastPlayback('SEEK', {
        position: seconds,
        isPlaying,
        senderName: userProfile.name,
      });
    }
  };

  const handleAddToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleToggleLike = (songId: string) => {
    setLikedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  const handleToggleDownload = (song: Song) => {
    setDownloadedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(song.id)) {
        next.delete(song.id);
      } else {
        next.add(song.id);
        audioEngine.cacheSongLocally(song);
      }
      return next;
    });
  };

  // Listen Together Room Handlers
  const handleCreateRoom = (name: string, mood: string, isPrivate: boolean = false) => {
    wsClient.createRoom(name, userProfile.name, mood, isPrivate);
    setCurrentTab('sessions');
  };

  const handleJoinRoom = (roomId: string) => {
    wsClient.joinRoom(roomId, userProfile.name, userProfile.avatar);
    setCurrentTab('sessions');
  };

  const handleLeaveRoom = () => {
    wsClient.leaveRoom();
    setActiveRoom(null);
  };

  const handleSendChatMessage = (
    text: string,
    type: 'text' | 'reaction' | 'moment' | 'sound' = 'text',
    emoji?: string,
    soundName?: string
  ) => {
    if (activeRoom) {
      wsClient.sendChatMessage(text);
      if (soundName) {
        audioEngine.playReactionSound(soundName);
      }
    }
  };

  const handleTriggerFloatingReaction = (emoji: string) => {
    if (activeRoom) {
      wsClient.burstReaction(emoji);
    }
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    const plSongs = songs.filter((s) => playlist.songIds.includes(s.id));
    if (plSongs.length > 0) {
      setQueue(plSongs);
      handlePlaySong(plSongs[0]);
    }
  };

  const handleImportPlaylist = (newPl: Playlist, newSongs?: Song[]) => {
    if (newSongs && newSongs.length > 0) {
      setSongs((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const filteredNew = newSongs.filter((s) => !existingIds.has(s.id));
        const updated = [...filteredNew, ...prev];
        try {
          const importedOnly = updated.filter((s) => s.id.startsWith('yt-') || s.id.startsWith('imported-'));
          localStorage.setItem('syncbeat_imported_songs', JSON.stringify(importedOnly));
        } catch {}
        return updated;
      });
    }
    setPlaylists((prev) => {
      const updated = [newPl, ...prev];
      try {
        const customOnly = updated.filter((p) => p.id.startsWith('yt-pl-') || p.id.startsWith('imported-'));
        localStorage.setItem('syncbeat_custom_playlists', JSON.stringify(customOnly));
      } catch {}
      return updated;
    });
  };

  const handleExperienceChange = (mode: ExperienceMode) => {
    setExperienceMode(mode);
    if (mode === 'love') setTheme('bollywood-ruby');
    else if (mode === 'focus') setTheme('focus-emerald');
    else if (mode === 'gym') setTheme('sapphire-gym');
    else setTheme('neon-obsidian');
  };

  // Focus Timer Handlers
  const handleToggleTimer = () => {
    setTimerState((prev) => {
      const isNowRunning = !prev.isRunning;
      if (activeRoom) {
        wsClient.syncFocusTimer('TOGGLE_TIMER', { isRunning: isNowRunning });
      }
      return { ...prev, isRunning: isNowRunning };
    });
  };

  const handleResetTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      remaining: prev.duration,
      isRunning: false,
    }));
    if (activeRoom) {
      wsClient.syncFocusTimer('RESET_TIMER', {});
    }
  };

  const handleSetTimerMode = (mode: 'work' | 'shortBreak' | 'longBreak', durationSecs: number) => {
    setTimerState({
      mode,
      duration: durationSecs,
      remaining: durationSecs,
      isRunning: false,
      completedSessions: timerState.completedSessions,
    });
    if (activeRoom) {
      wsClient.syncFocusTimer('SET_TIMER', {
        timerType: 'pomodoro',
        duration: durationSecs,
        remaining: durationSecs,
        isRunning: false,
      });
    }
  };

  // Focus Study Music Songs Pool
  const focusSongs = useMemo(() => {
    return songs.filter((s) => s.mood === 'study' || s.bpm <= 90);
  }, [songs]);

  // Theme Wrapper Background Class
  const getThemeBackground = () => {
    if (theme === 'bollywood-ruby') return 'bg-gradient-to-b from-rose-950/80 via-zinc-950 to-black text-rose-50';
    if (theme === 'focus-emerald') return 'bg-gradient-to-b from-emerald-950/80 via-zinc-950 to-black text-emerald-50';
    if (theme === 'sapphire-gym') return 'bg-gradient-to-b from-blue-950/80 via-zinc-950 to-black text-blue-50';
    if (theme === 'glass-light') return 'bg-gradient-to-b from-slate-900 via-zinc-950 to-black text-zinc-100';
    return 'bg-zinc-950 text-zinc-100';
  };

  return (
    <div className={`min-h-screen relative flex flex-col font-sans transition-colors duration-500 ${getThemeBackground()}`}>
      {/* Dynamic Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 transition-all duration-1000 ${
            theme === 'bollywood-ruby'
              ? 'bg-rose-500'
              : theme === 'focus-emerald'
              ? 'bg-emerald-500'
              : theme === 'sapphire-gym'
              ? 'bg-blue-600'
              : 'bg-indigo-600'
          }`}
        />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px]" />
      </div>

      {/* Main Glass Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        experienceMode={experienceMode}
        onSelectExperience={handleExperienceChange}
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={setTheme}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && currentTab !== 'search') {
            setCurrentTab('search');
          }
        }}
        activeRoom={activeRoom}
        latencyMs={latencyMs}
        isOfflineMode={isOfflineMode}
        onToggleOfflineMode={() => setIsOfflineMode(!isOfflineMode)}
        focusTimerRunning={timerState.isRunning}
        onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
      />

      {/* 3-COLUMN RESPONSIVE LAYOUT CONTAINER */}
      <div className="relative z-10 flex-1 max-w-[1680px] w-full mx-auto px-3 sm:px-6 pt-4 flex gap-5">
        {/* Left Sidebar Navigation (Desktop) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          experienceMode={experienceMode}
          onSelectExperience={handleExperienceChange}
          activeRoom={activeRoom}
          latencyMs={latencyMs}
          isOfflineMode={isOfflineMode}
          onToggleOfflineMode={() => setIsOfflineMode(!isOfflineMode)}
          language={language}
          focusTimerRunning={timerState.isRunning}
          onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
          onOpenEqualizer={() => setIsEqualizerOpen(true)}
          playlists={playlists}
          onSelectPlaylist={handleSelectPlaylist}
          onOpenImporter={() => setCurrentTab('importer')}
          likedSongsCount={likedSongIds.size}
        />

        {/* Center Main Stage Content */}
        <main className="flex-1 min-w-0 pb-32">
          {/* TAB 1: HOME (EXPLORE & EXPERIENCE LAUNCHPADS) */}
          {currentTab === 'home' && (
            <HomeView
              songs={songs}
              playlists={playlists}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlaySong={handlePlaySong}
              onTogglePlay={handleTogglePlay}
              onAddToQueue={handleAddToQueue}
              likedSongIds={likedSongIds}
              onToggleLike={handleToggleLike}
              downloadedSongIds={downloadedSongIds}
              onToggleDownload={handleToggleDownload}
              onJoinRoom={handleJoinRoom}
              onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
              onSelectPlaylist={handleSelectPlaylist}
              onSelectExperience={handleExperienceChange}
              onNavigateTab={setCurrentTab}
              language={language}
              experienceMode={experienceMode}
            />
          )}

          {/* TAB 2: SEARCH */}
          {currentTab === 'search' && (
            <SearchView
              songs={songs}
              playlists={playlists}
              currentSong={currentSong}
              isPlaying={isPlaying}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onPlaySong={handlePlaySong}
              onAddToQueue={handleAddToQueue}
              likedSongIds={likedSongIds}
              onToggleLike={handleToggleLike}
              downloadedSongIds={downloadedSongIds}
              onToggleDownload={handleToggleDownload}
              onSelectPlaylist={handleSelectPlaylist}
              onJoinRoom={handleJoinRoom}
              language={language}
            />
          )}

          {/* TAB 3: SESSIONS (REAL-TIME SOCIAL LISTEN TOGETHER) */}
          {currentTab === 'sessions' && (
            <SessionsView
              room={activeRoom}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onNextTrack={handleNextTrack}
              onSelectSong={handlePlaySong}
              availableSongs={songs}
              currentUser={{ id: userProfile.id, name: userProfile.name, avatar: userProfile.avatar }}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onLeaveRoom={handleLeaveRoom}
              onOpenLyrics={() => setCurrentTab('lyrics')}
              language={language}
              latencyMs={latencyMs}
            />
          )}

          {/* TAB 4: FOCUS (STUDY TIMER & AMBIENT MIXER) */}
          {currentTab === 'focus' && (
            <FocusView
              timerState={timerState}
              onToggleTimer={handleToggleTimer}
              onResetTimer={handleResetTimer}
              onSetTimerMode={handleSetTimerMode}
              onSetStopwatch={() => {}}
              stopwatchSeconds={stopwatchSeconds}
              isStopwatchRunning={isStopwatchRunning}
              onToggleStopwatch={() => setIsStopwatchRunning(!isStopwatchRunning)}
              onResetStopwatch={() => setStopwatchSeconds(0)}
              ambientSounds={ambientSounds}
              onChangeAmbient={setAmbientSounds}
              focusSongs={focusSongs}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlaySong={handlePlaySong}
              onTogglePlay={handleTogglePlay}
              language={language}
            />
          )}

          {/* TAB 5: LIBRARY (VAULT & DOWNLOADS) */}
          {currentTab === 'library' && (
            <LibraryView
              allSongs={songs}
              downloadedSongIds={downloadedSongIds}
              likedSongIds={likedSongIds}
              customPlaylists={playlists}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlaySong={handlePlaySong}
              onTogglePlay={handleTogglePlay}
              onToggleDownload={handleToggleDownload}
              onToggleLike={handleToggleLike}
              isOfflineMode={isOfflineMode}
              onToggleOfflineMode={() => setIsOfflineMode(!isOfflineMode)}
              onClearOfflineCache={() => setDownloadedSongIds(new Set())}
              onSelectPlaylist={handleSelectPlaylist}
              onOpenImporter={() => setCurrentTab('importer')}
              language={language}
            />
          )}

          {/* TAB 6: PROFILE */}
          {currentTab === 'profile' && (
            <ProfileView
              profile={userProfile}
              onUpdateProfile={(updated) => setUserProfile((prev) => ({ ...prev, ...updated }))}
              language={language}
              onLanguageChange={setLanguage}
              theme={theme}
              onThemeChange={setTheme}
              onOpenEqualizer={() => setIsEqualizerOpen(true)}
            />
          )}

          {/* TAB 7: LIVE KARAOKE LYRICS */}
          {currentTab === 'lyrics' && (
            <LyricsView
              currentSong={currentSong}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              playbackPosition={playbackPosition}
              onSeek={handleSeek}
              onOpenShareModal={() => setIsShareOpen(true)}
              language={language}
              theme={theme}
            />
          )}

          {/* TAB 8: PLAYLIST IMPORTER */}
          {currentTab === 'importer' && (
            <PlaylistImporterView
              availableSongs={songs}
              playlists={playlists}
              onImportPlaylist={handleImportPlaylist}
              onPlayPlaylist={handleSelectPlaylist}
              onPlaySong={handlePlaySong}
              language={language}
            />
          )}
        </main>

        {/* Right Context Panel (Queue / Live Chat / Listeners) */}
        <RightContextPanel
          currentSong={currentSong}
          queue={queue}
          isPlaying={isPlaying}
          activeRoom={activeRoom}
          currentTime={playbackPosition}
          onPlaySong={handlePlaySong}
          onRemoveFromQueue={handleRemoveFromQueue}
          onSendChatMessage={handleSendChatMessage}
          onTriggerFloatingReaction={handleTriggerFloatingReaction}
          onOpenLyrics={() => setCurrentTab('lyrics')}
        />
      </div>

      {/* Floating Bottom Audio Player Bar */}
      <AudioPlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        playbackPosition={playbackPosition}
        onSeek={handleSeek}
        theme={theme}
        quality={userProfile.quality}
        onChangeQuality={(q) => {
          setUserProfile((prev) => ({ ...prev, quality: q }));
          audioEngine.setQuality(q);
        }}
        onOpenLyrics={() => setCurrentTab('lyrics')}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        isDownloaded={currentSong ? downloadedSongIds.has(currentSong.id) : false}
        onToggleDownload={handleToggleDownload}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        repeatMode={repeatMode}
        onCycleRepeat={() => {
          if (repeatMode === 'off') setRepeatMode('all');
          else if (repeatMode === 'all') setRepeatMode('one');
          else setRepeatMode('off');
        }}
      />

      {/* 10-Band Equalizer Modal */}
      <EqualizerModal isOpen={isEqualizerOpen} onClose={() => setIsEqualizerOpen(false)} />

      {/* Share Lyric Story Card Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        currentSong={currentSong}
        playbackPosition={playbackPosition}
      />

      {/* Gemini AI Personalized Playlist Generator Modal */}
      <AIGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onPlaylistCreated={handleImportPlaylist}
        onPlayPlaylist={handleSelectPlaylist}
        availableSongs={songs}
      />
    </div>
  );
}

export default App;
