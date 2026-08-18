import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, Volume2, Volume1, VolumeX, Repeat, Repeat1, Shuffle, Sliders, Maximize2, Minimize2, Share2, Download, Check, BookOpen, Heart, ThumbsDown, ChevronDown, ListMusic } from 'lucide-react';
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

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = (props) => {
  const { currentSong, isPlaying, onTogglePlay, onNext, onPrev, playbackPosition, onSeek, quality, onChangeQuality, onOpenLyrics, onOpenEqualizer, onOpenShare, isDownloaded, onToggleDownload, isShuffle, onToggleShuffle, repeatMode, onCycleRepeat } = props;
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [cockpitOpen, setCockpitOpen] = useState(false);
  const [youtubePosition, setYoutubePosition] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);
  const [youtubeReady, setYoutubeReady] = useState(false);
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
  }, [isPlaying, onTogglePlay]);

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
    youtubePlayer.load(currentSong.youtubeVideoId, playbackPosition, isPlaying, 1).catch((error) => console.warn('Unable to load YouTube track', error));
  }, [currentSong?.id, currentSong?.youtubeVideoId]);

  useEffect(() => {
    if (!isYouTube || !youtubeReady) return;
    if (!isPlaying) youtubePlayer.pause();
  }, [isPlaying, isYouTube, youtubeReady]);

  useEffect(() => {
    if (!currentSong) setCockpitOpen(false);
  }, [currentSong]);

  if (!currentSong) return null;

  const duration = Math.max(1, (isYouTube && youtubeDuration > 0 ? youtubeDuration : currentSong.duration) || 1);
  const position = isYouTube ? Math.max(0, Math.min(youtubePosition, duration)) : Math.max(0, Math.min(playbackPosition, duration));
  const progress = (position / duration) * 100;

  const formatTime = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds)); const hours = Math.floor(safe / 3600); const minutes = Math.floor((safe % 3600) / 60); const secondsPart = safe % 60;
    return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secondsPart).padStart(2, '0')}` : `${minutes}:${String(secondsPart).padStart(2, '0')}`;
  };

  const seekTo = (target: number) => { const next = Math.max(0, Math.min(duration, target)); if (isYouTube) youtubePlayer.seek(next); onSeek(next); };
  const seekFromClientX = (clientX: number) => { const rect = progressRef.current?.getBoundingClientRect(); if (!rect || rect.width <= 0) return; seekTo(((clientX - rect.left) / rect.width) * duration); };
  const skip = (amount: number) => seekTo(position + amount);
  const handleProgressPointerDown = (event: React.PointerEvent<HTMLDivElement>) => { event.currentTarget.setPointerCapture(event.pointerId); seekFromClientX(event.clientX); };
  const handleTogglePlay = () => {
    if (!isYouTube) { onTogglePlay(); return; }
    const actualPlaying = youtubePlayer.isActuallyPlaying();
    if (actualPlaying) { youtubePlayer.pause(); if (isPlaying) onTogglePlay(); return; }
    youtubePlayer.play(); if (!isPlaying) onTogglePlay();
  };
  const toggleLike = () => { setIsLiked((value) => !value); setIsDisliked(false); };
  const toggleDislike = () => { setIsDisliked((value) => !value); setIsLiked(false); };

  const Progress = ({ expanded = false }: { expanded?: boolean }) => (
    <div ref={!expanded ? progressRef : undefined} role="slider" aria-label="Playback position" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={position} tabIndex={0} onPointerDown={!expanded ? handleProgressPointerDown : undefined} onKeyDown={!expanded ? (event) => { if (event.key === 'ArrowLeft') skip(-5); if (event.key === 'ArrowRight') skip(5); } : undefined} className={`group relative w-full cursor-pointer touch-none bg-white/10 ${expanded ? 'h-1.5 rounded-full' : 'h-1'}`}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--cine-accent,#e11d48)]" style={{ width: `${progress}%` }} />
      <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--cine-accent,#e11d48)] opacity-0 shadow-[0_0_12px_rgba(244,63,94,.7)] transition-opacity group-hover:opacity-100 group-focus:opacity-100" style={{ left: `${progress}%` }} />
    </div>
  );

  return (
    <>
      {/* YouTube remains an invisible playback provider. The product never exposes its video UI as the player. */}
      <div ref={youtubeHostRef} aria-hidden="true" className="pointer-events-none fixed -left-[10000px] top-0 h-px w-px overflow-hidden opacity-0" />

      {cockpitOpen && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-[#09090b] text-white" role="dialog" aria-modal="true" aria-label="Music cockpit">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,.07),transparent_42%)]" />
          <div className="relative flex items-center justify-between px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] sm:px-8">
            <button type="button" onClick={() => setCockpitOpen(false)} className={iconButton} aria-label="Close music cockpit"><ChevronDown size={22} /></button>
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">CINEOSYNC · NOW PLAYING</span>
            <button type="button" onClick={onOpenShare} className={iconButton} aria-label="Share"><Share2 size={18} /></button>
          </div>
          <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 pb-8 pt-2 sm:px-10">
            <div className="mx-auto mb-8 aspect-square w-full max-w-[min(78vw,430px)] overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,.5)]">
              <img src={currentSong.coverArt} alt={`${currentSong.title} artwork`} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            </div>
            <div className="mb-5 flex items-end gap-3">
              <div className="min-w-0 flex-1"><h2 className="truncate font-serif text-2xl font-semibold tracking-tight sm:text-3xl">{currentSong.title}</h2><p className="mt-1 truncate text-sm text-zinc-400">{currentSong.artist}</p></div>
              <button type="button" onClick={toggleLike} className={`${iconButton} ${isLiked ? 'text-[var(--cine-accent,#e11d48)]' : ''}`} aria-label="Like"><Heart size={21} fill={isLiked ? 'currentColor' : 'none'} /></button>
            </div>
            <Progress expanded />
            <div className="mt-2 flex justify-between text-[10px] font-mono text-zinc-500"><span>{formatTime(position)}</span><span>{formatTime(duration)}</span></div>
            <div className="mt-7 flex items-center justify-center gap-2 sm:gap-4">
              <button type="button" onClick={onToggleShuffle} className={`${iconButton} ${isShuffle ? 'text-[var(--cine-accent,#e11d48)]' : ''}`} aria-label="Shuffle"><Shuffle size={19} /></button>
              <button type="button" onClick={onPrev} className={iconButton} aria-label="Previous"><SkipBack size={22} fill="currentColor" /></button>
              <button type="button" onClick={() => skip(-10)} className={iconButton} aria-label="Back 10 seconds"><RotateCcw size={19} /></button>
              <button type="button" onClick={handleTogglePlay} className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_12px_35px_rgba(255,255,255,.12)] transition-transform active:scale-95" aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={27} fill="currentColor" /> : <Play size={27} fill="currentColor" className="translate-x-px" />}</button>
              <button type="button" onClick={() => skip(10)} className={iconButton} aria-label="Forward 10 seconds"><RotateCw size={19} /></button>
              <button type="button" onClick={onNext} className={iconButton} aria-label="Next"><SkipForward size={22} fill="currentColor" /></button>
              <button type="button" onClick={onCycleRepeat} className={`${iconButton} ${repeatMode !== 'off' ? 'text-[var(--cine-accent,#e11d48)]' : ''}`} aria-label={`Repeat ${repeatMode}`}>{repeatMode === 'one' ? <Repeat1 size={19} /> : <Repeat size={19} />}</button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-1">
              <button type="button" onClick={onOpenLyrics} className={iconButton} aria-label="Lyrics"><BookOpen size={18} /></button>
              <button type="button" onClick={onOpenEqualizer} className={iconButton} aria-label="Equalizer"><Sliders size={18} /></button>
              <button type="button" onClick={() => onToggleDownload(currentSong)} className={`${iconButton} ${isDownloaded ? 'text-emerald-400' : ''}`} aria-label="Save">{isDownloaded ? <Check size={18} /> : <Download size={18} />}</button>
              <button type="button" onClick={() => onOpenShare()} className={iconButton} aria-label="Share"><Share2 size={18} /></button>
            </div>
          </div>
        </div>
      )}

      <div id="bottom-audio-player-bar" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#09090b]/95 shadow-[0_-16px_50px_rgba(0,0,0,.38)] backdrop-blur-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
              <button type="button" onClick={onNext} className={iconButton} aria-label="Forward"><SkipForward size={19} fill="currentColor" /></button>
              <button type="button" onClick={() => setCockpitOpen(true)} className={`${iconButton} hidden sm:inline-flex`} aria-label="Open queue"><ListMusic size={17} /></button>
            </div>

            <div className="hidden min-w-0 items-center justify-end gap-1 sm:flex">
              <span className="mr-2 min-w-[72px] text-center font-mono text-[10px] text-zinc-500">{formatTime(position)} / {formatTime(duration)}</span>
              <button type="button" onClick={onOpenLyrics} className={iconButton} aria-label="Lyrics"><BookOpen size={16} /></button>
              <button type="button" onClick={onOpenEqualizer} className="hidden md:inline-flex relative h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="Equalizer"><Sliders size={16} /></button>
              <button type="button" onClick={() => onToggleDownload(currentSong)} className={`${iconButton} ${isDownloaded ? 'text-emerald-400' : ''}`} aria-label="Save">{isDownloaded ? <Check size={16} /> : <Download size={16} />}</button>
              <button type="button" onClick={onOpenShare} className={iconButton} aria-label="Share"><Share2 size={16} /></button>
              <button type="button" onClick={() => setCockpitOpen(true)} className={iconButton} aria-label="Expand music cockpit"><Maximize2 size={16} /></button>
              <button type="button" onClick={() => setIsMuted((value) => !value)} className={iconButton} aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted || volume === 0 ? <VolumeX size={17} /> : volume < 0.5 ? <Volume1 size={17} /> : <Volume2 size={17} />}</button>
              <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(event) => { setVolume(Number(event.target.value)); setIsMuted(false); }} className="h-1 w-16 cursor-pointer accent-[var(--cine-accent,#e11d48)] lg:w-20" />
              <div className="relative"><button type="button" onClick={() => setQualityMenuOpen((open) => !open)} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/10">{quality === 'data-saver-64k' ? '64k' : quality === 'normal-128k' ? '128k' : 'HD'}</button>{qualityMenuOpen && <div className="absolute bottom-full right-0 z-[100] mb-2 w-44 rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl">{(['data-saver-64k', 'normal-128k', 'high-320k'] as AudioQuality[]).map((item) => <button type="button" key={item} onClick={() => { onChangeQuality(item); setQualityMenuOpen(false); }} className={`w-full rounded-lg px-2.5 py-2 text-left text-xs ${quality === item ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5'}`}>{item === 'data-saver-64k' ? 'Data Saver · 64k' : item === 'normal-128k' ? 'Standard · 128k' : 'High · 320k'}</button>)}</div>}</div>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between px-1 text-[9px] font-mono text-zinc-500 sm:hidden"><span>{formatTime(position)}</span><button type="button" onClick={() => setCockpitOpen(true)} className="uppercase tracking-[0.22em] text-zinc-400">Music cockpit</button><span>{formatTime(duration)}</span></div>
        </div>
      </div>
    </>
  );
};