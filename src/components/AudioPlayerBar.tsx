import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, Volume2, VolumeX, Repeat, Repeat1, Shuffle, Sliders, Share2, Download, Check, BookOpen, Heart, ChevronDown, MonitorPlay, Headphones } from 'lucide-react';
import { Song, AudioQuality, AppTheme } from '../types';
import { audioEngine } from '../services/audioEngine';
import { youtubePlayer } from '../services/youtubePlayer';

interface AudioPlayerBarProps {
  currentSong: Song | null; isPlaying: boolean; onTogglePlay: () => void; onNext: () => void; onPrev: () => void;
  playbackPosition: number; onSeek: (pos: number) => void; theme: AppTheme; quality: AudioQuality;
  onChangeQuality: (q: AudioQuality) => void; onOpenLyrics: () => void; onOpenEqualizer: () => void;
  onOpenShare: () => void; isDownloaded: boolean; onToggleDownload: (song: Song) => void;
  isShuffle: boolean; onToggleShuffle: () => void; repeatMode: 'off' | 'all' | 'one'; onCycleRepeat: () => void;
}

const iconButton = 'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50';
type PlayerMode = 'audio' | 'video';

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = (props) => {
  const { currentSong, isPlaying, onTogglePlay, onNext, onPrev, playbackPosition, onSeek, quality, onChangeQuality, onOpenLyrics, onOpenEqualizer, onOpenShare, isDownloaded, onToggleDownload, isShuffle, onToggleShuffle, repeatMode, onCycleRepeat } = props;
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [cockpitOpen, setCockpitOpen] = useState(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('audio');
  const [youtubePosition, setYoutubePosition] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const youtubeHostRef = useRef<HTMLDivElement>(null);
  const isYouTube = Boolean(currentSong?.youtubeVideoId);

  useEffect(() => {
    audioEngine.setVolume(isYouTube ? 0 : isMuted ? 0 : volume);
    if (isYouTube) {
      youtubePlayer.setVolume(isMuted ? 0 : volume);
      if (isMuted) youtubePlayer.mute(); else youtubePlayer.unmute();
    } else youtubePlayer.pause();
  }, [volume, isMuted, isYouTube]);

  useEffect(() => {
    if (!youtubeHostRef.current) return;
    const ready = () => setYoutubeReady(true);
    const blocked = () => { if (isPlaying) onTogglePlay(); };
    window.addEventListener('syncbeat:youtube-ready', ready);
    window.addEventListener('syncbeat:youtube-autoplay-blocked', blocked);
    youtubePlayer.mount(youtubeHostRef.current).catch((error) => console.warn('YouTube player initialization failed', error));
    return () => {
      window.removeEventListener('syncbeat:youtube-ready', ready);
      window.removeEventListener('syncbeat:youtube-autoplay-blocked', blocked);
    };
  }, []);

  useEffect(() => {
    const onPosition = (event: Event) => {
      const detail = (event as CustomEvent<{ currentTime?: number; duration?: number }>).detail;
      if (typeof detail?.currentTime === 'number') setYoutubePosition(detail.currentTime);
      if (typeof detail?.duration === 'number' && detail.duration > 0) setYoutubeDuration(detail.duration);
    };
    window.addEventListener('syncbeat:youtube-position', onPosition);
    return () => window.removeEventListener('syncbeat:youtube-position', onPosition);
  }, []);

  useEffect(() => {
    if (!currentSong?.youtubeVideoId) return;
    setYoutubePosition(playbackPosition);
    void youtubePlayer.load(currentSong.youtubeVideoId, playbackPosition, isPlaying, 1).catch((error) => console.warn('Unable to load YouTube track', error));
  }, [currentSong?.id, currentSong?.youtubeVideoId]);

  useEffect(() => {
    if (!isYouTube || !youtubeReady) return;
    if (isPlaying) youtubePlayer.play(); else youtubePlayer.pause();
  }, [isPlaying, isYouTube, youtubeReady]);

  useEffect(() => {
    if (!currentSong) { setCockpitOpen(false); setPlayerMode('audio'); }
    if (!currentSong?.youtubeVideoId) setPlayerMode('audio');
  }, [currentSong]);

  if (!currentSong) return null;

  const duration = Math.max(1, (isYouTube && youtubeDuration > 0 ? youtubeDuration : currentSong.duration) || 1);
  const position = isYouTube ? Math.max(0, Math.min(youtubePosition, duration)) : Math.max(0, Math.min(playbackPosition, duration));
  const progress = (position / duration) * 100;
  const formatTime = (seconds: number) => { const safe = Math.max(0, Math.floor(seconds)); return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`; };
  const seekTo = (target: number) => { const next = Math.max(0, Math.min(duration, target)); if (isYouTube) youtubePlayer.seek(next); else audioEngine.seek(next); onSeek(next); };
  const seekFromClientX = (clientX: number) => { const rect = progressRef.current?.getBoundingClientRect(); if (!rect || rect.width <= 0) return; seekTo(((clientX - rect.left) / rect.width) * duration); };
  const skip = (amount: number) => seekTo(position + amount);
  const handleProgressPointerDown = (event: React.PointerEvent<HTMLDivElement>) => { event.currentTarget.setPointerCapture(event.pointerId); seekFromClientX(event.clientX); };
  const handleTogglePlay = () => { if (!isYouTube) { onTogglePlay(); return; } if (youtubePlayer.isActuallyPlaying()) youtubePlayer.pause(); else youtubePlayer.play(); onTogglePlay(); };
  const toggleLike = () => setIsLiked((value) => !value);

  const Progress = ({ expanded = false }: { expanded?: boolean }) => (
    <div ref={!expanded ? progressRef : undefined} role="slider" aria-label="Playback position" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={position} tabIndex={0} onPointerDown={!expanded ? handleProgressPointerDown : undefined} onKeyDown={!expanded ? (event) => { if (event.key === 'ArrowLeft') skip(-5); if (event.key === 'ArrowRight') skip(5); } : undefined} className={`group relative w-full cursor-pointer touch-none bg-white/10 ${expanded ? 'h-1.5 rounded-full' : 'h-1'}`}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--cine-accent,#e11d48)]" style={{ width: `${progress}%` }} />
      <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--cine-accent,#e11d48)] opacity-0 shadow-[0_0_12px_rgba(244,63,94,.7)] transition-opacity group-hover:opacity-100 group-focus:opacity-100" style={{ left: `${progress}%` }} />
    </div>
  );

  const videoVisible = cockpitOpen && playerMode === 'video' && isYouTube;
  return (
    <>
      <div ref={youtubeHostRef} aria-hidden={!videoVisible} className={videoVisible ? 'pointer-events-auto fixed left-[5vw] top-[max(78px,12vh)] z-[111] aspect-video w-[90vw] max-w-[900px] overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl md:left-1/2 md:w-[min(82vw,900px)] md:-translate-x-1/2' : 'pointer-events-none fixed -left-[10000px] top-0 h-px w-px overflow-hidden opacity-0'} />

      {cockpitOpen && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-[#09090b] text-white" role="dialog" aria-modal="true" aria-label="Music cockpit">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,.07),transparent_42%)]" />
          <div className="relative z-[112] flex items-center justify-between px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] sm:px-8">
            <button type="button" onClick={() => setCockpitOpen(false)} className={iconButton} aria-label="Close music cockpit"><ChevronDown size={22} /></button>
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">CINEOSYNC · NOW PLAYING</span>
            <button type="button" onClick={onOpenShare} className={iconButton} aria-label="Share"><Share2 size={18} /></button>
          </div>
          <div className="relative z-[112] mx-auto flex w-full max-w-2xl flex-1 flex-col justify-end px-5 pb-7 pt-2 sm:px-10">
            <div className={`mx-auto mb-5 overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,.5)] ${videoVisible ? 'h-0 w-0 border-0 opacity-0' : 'aspect-square w-full max-w-[min(72vw,390px)]'}`}>
              <img src={currentSong.coverArt} alt={`${currentSong.title} artwork`} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            </div>
            <div className="mb-4 flex items-end gap-3">
              <div className="min-w-0 flex-1"><h2 className="truncate font-serif text-xl font-semibold tracking-tight sm:text-3xl">{currentSong.title}</h2><p className="mt-1 truncate text-sm text-zinc-400">{currentSong.artist}</p></div>
              <button type="button" onClick={toggleLike} className={`${iconButton} ${isLiked ? 'text-[var(--cine-accent,#e11d48)]' : ''}`} aria-label="Like"><Heart size={21} fill={isLiked ? 'currentColor' : 'none'} /></button>
            </div>
            {isYouTube && <div className="mb-4 flex items-center justify-center"><div className="inline-flex rounded-full border border-white/10 bg-white/[0.06] p-1">
              <button type="button" onClick={() => setPlayerMode('audio')} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${playerMode === 'audio' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`} aria-pressed={playerMode === 'audio'}><Headphones size={14} /> Audio</button>
              <button type="button" onClick={() => setPlayerMode('video')} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${playerMode === 'video' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`} aria-pressed={playerMode === 'video'}><MonitorPlay size={14} /> Video</button>
            </div></div>}
            <Progress expanded />
            <div className="mt-2 flex justify-between text-[10px] font-mono text-zinc-500"><span>{formatTime(position)}</span><span>{formatTime(duration)}</span></div>
            <div className="mt-5 flex items-center justify-center gap-1 sm:gap-4">
              <button type="button" onClick={onToggleShuffle} className={`${iconButton} ${isShuffle ? 'text-[var(--cine-accent,#e11d48)]' : ''}`} aria-label="Shuffle"><Shuffle size={19} /></button>
              <button type="button" onClick={onPrev} className={iconButton} aria-label="Previous"><SkipBack size={22} fill="currentColor" /></button>
              <button type="button" onClick={() => skip(-10)} className={iconButton} aria-label="Back 10 seconds"><RotateCcw size={19} /></button>
              <button type="button" onClick={handleTogglePlay} className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_12px_35px_rgba(255,255,255,.12)] transition-transform active:scale-95" aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={27} fill="currentColor" /> : <Play size={27} fill="currentColor" className="translate-x-px" />}</button>
              <button type="button" onClick={() => skip(10)} className={iconButton} aria-label="Forward 10 seconds"><RotateCw size={19} /></button>
              <button type="button" onClick={onNext} className={iconButton} aria-label="Next"><SkipForward size={22} fill="currentColor" /></button>
              <button type="button" onClick={onCycleRepeat} className={`${iconButton} ${repeatMode !== 'off' ? 'text-[var(--cine-accent,#e11d48)]' : ''}`} aria-label={`Repeat ${repeatMode}`}>{repeatMode === 'one' ? <Repeat1 size={19} /> : <Repeat size={19} />}</button>
            </div>
            <div className="mt-5 flex items-center justify-center gap-1">
              <button type="button" onClick={onOpenLyrics} className={iconButton} aria-label="Lyrics"><BookOpen size={18} /></button>
              <button type="button" onClick={onOpenEqualizer} className={iconButton} aria-label="Equalizer"><Sliders size={18} /></button>
              <button type="button" onClick={() => onToggleDownload(currentSong)} className={`${iconButton} ${isDownloaded ? 'text-emerald-400' : ''}`} aria-label="Save">{isDownloaded ? <Check size={18} /> : <Download size={18} />}</button>
              <button type="button" onClick={onOpenShare} className={iconButton} aria-label="Share"><Share2 size={18} /></button>
            </div>
          </div>
        </div>
      )}

      <div id="bottom-audio-player-bar" className="fixed inset-x-0 bottom-[calc(4.7rem+env(safe-area-inset-bottom))] z-[100] border-t border-white/[0.08] bg-[#09090b]/96 shadow-[0_-16px_50px_rgba(0,0,0,.42)] backdrop-blur-2xl sm:bottom-0" style={{ paddingBottom: 'max(2px, env(safe-area-inset-bottom))' }}>
        <Progress />
        <div className="mx-auto w-full max-w-[1600px] px-3 pb-1.5 pt-2 sm:px-5 sm:py-2.5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] sm:gap-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <button type="button" onClick={() => setCockpitOpen(true)} className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:h-12 sm:w-12" aria-label="Open music cockpit"><img src={currentSong.coverArt} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /></button>
              <button type="button" onClick={() => setCockpitOpen(true)} className="min-w-0 flex-1 text-left"><div className="truncate text-sm font-semibold text-white">{currentSong.title}</div><div className="truncate text-xs text-zinc-400">{currentSong.artist}</div></button>
              <button type="button" onClick={toggleLike} className={`${iconButton} hidden sm:inline-flex ${isLiked ? 'text-[var(--cine-accent,#e11d48)]' : ''}`} aria-label="Like"><Heart size={17} fill={isLiked ? 'currentColor' : 'none'} /></button>
            </div>
            <div className="flex items-center justify-center gap-0.5 sm:gap-1.5">
              <button type="button" onClick={onToggleShuffle} className={`${iconButton} hidden sm:inline-flex ${isShuffle ? 'text-[var(--cine-accent,#e11d48)]' : ''}`} aria-label="Shuffle"><Shuffle size={17} /></button>
              <button type="button" onClick={onPrev} className={`${iconButton} hidden sm:inline-flex`} aria-label="Previous"><SkipBack size={19} fill="currentColor" /></button>
              <button type="button" onClick={handleTogglePlay} className="mx-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform active:scale-95 sm:h-10 sm:w-10" aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="translate-x-px" />}</button>
              <button type="button" onClick={onNext} className={iconButton} aria-label="Next"><SkipForward size={19} fill="currentColor" /></button>
              <button type="button" onClick={() => skip(10)} className={`${iconButton} hidden sm:inline-flex`} aria-label="Forward 10 seconds"><RotateCw size={17} /></button>
              <button type="button" onClick={onCycleRepeat} className={`${iconButton} hidden sm:inline-flex ${repeatMode !== 'off' ? 'text-[var(--cine-accent,#e11d48)]' : ''}`} aria-label="Repeat"><Repeat size={17} /></button>
            </div>
            <div className="hidden items-center justify-end gap-1 sm:flex">
              <button type="button" onClick={() => setPlayerMode('audio')} className={`${iconButton} ${playerMode === 'audio' ? 'text-white' : ''}`} aria-label="Audio mode" title="Audio mode"><Headphones size={17} /></button>
              {isYouTube && <button type="button" onClick={() => { setPlayerMode('video'); setCockpitOpen(true); }} className={iconButton} aria-label="Open video mode" title="Video mode"><MonitorPlay size={17} /></button>}
              <button type="button" onClick={() => setIsMuted((v) => !v)} className={iconButton} aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
              <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(event) => { setVolume(Number(event.target.value)); setIsMuted(false); }} className="w-20 accent-[var(--cine-accent,#e11d48)]" />
              <div className="relative">
                <button type="button" onClick={() => setQualityMenuOpen((v) => !v)} className="rounded-full px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="Audio quality">{String(quality).replace('-', ' ')}</button>
                {qualityMenuOpen && <div className="absolute bottom-10 right-0 z-[120] w-36 rounded-xl border border-white/10 bg-[#121214] p-1 shadow-2xl">
                  {(['data-saver-64k', 'normal-128k', 'high-320k'] as AudioQuality[]).map((q) => <button key={q} type="button" onClick={() => { onChangeQuality(q); setQualityMenuOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10 ${quality === q ? 'text-white' : 'text-zinc-400'}`}>{q.replace('-', ' ')}</button>)}
                </div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
