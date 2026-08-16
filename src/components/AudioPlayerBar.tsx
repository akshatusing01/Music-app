import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, Volume2, Volume1, VolumeX, Repeat, Repeat1, Shuffle, Sliders, Maximize2, Share2, Download, Check, BookOpen, Heart, ThumbsDown, ChevronUp } from 'lucide-react';
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

const iconButton = 'relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white active:scale-95';

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = (props) => {
  const { currentSong, isPlaying, onTogglePlay, onNext, onPrev, playbackPosition, onSeek, quality, onChangeQuality, onOpenLyrics, onOpenEqualizer, onOpenShare, isDownloaded, onToggleDownload, isShuffle, onToggleShuffle, repeatMode, onCycleRepeat } = props;
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [youtubePosition, setYoutubePosition] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const youtubeHostRef = useRef<HTMLDivElement>(null);
  const isYouTube = Boolean(currentSong?.youtubeVideoId);

  useEffect(() => {
    audioEngine.setVolume(isYouTube ? 0 : isMuted ? 0 : volume);
    if (isYouTube) {
      youtubePlayer.setVolume(isMuted ? 0 : volume);
      if (isMuted) youtubePlayer.mute(); else youtubePlayer.unmute();
    } else {
      youtubePlayer.pause();
    }
  }, [volume, isMuted, isYouTube]);

  useEffect(() => {
    if (!youtubeHostRef.current) return;
    youtubePlayer.mount(youtubeHostRef.current).catch((error) => console.warn('YouTube player initialization failed', error));
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
    youtubePlayer.load(currentSong.youtubeVideoId, playbackPosition, isPlaying, 1).catch((error) => console.warn('Unable to load YouTube track', error));
  }, [currentSong?.id, currentSong?.youtubeVideoId]);

  useEffect(() => {
    if (!isYouTube) return;
    if (isPlaying) youtubePlayer.play(); else youtubePlayer.pause();
  }, [isPlaying, isYouTube]);

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
    if (isYouTube) {
      // Keep the legacy engine's position in sync so the room broadcaster sends the real YouTube position.
      audioEngine.seek(youtubePlayer.getCurrentTime());
      if (isPlaying) youtubePlayer.pause(); else youtubePlayer.play();
    }
    onTogglePlay();
  };

  const toggleLike = () => { setIsLiked((value) => !value); setIsDisliked(false); };
  const toggleDislike = () => { setIsDisliked((value) => !value); setIsLiked(false); };

  return (
    <div id="bottom-audio-player-bar" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#090909]/98 shadow-[0_-12px_40px_rgba(0,0,0,.55)] backdrop-blur-2xl">
      <div ref={progressRef} role="slider" aria-label="Playback position" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={position} tabIndex={0} onPointerDown={handleProgressPointerDown} onKeyDown={(event) => { if (event.key === 'ArrowLeft') skip(-5); if (event.key === 'ArrowRight') skip(5); }} className="group relative h-1 w-full cursor-pointer touch-none bg-white/10 focus:outline-none">
        <div className="absolute inset-y-0 left-0 bg-rose-500" style={{ width: `${progress}%` }} />
        <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 opacity-0 shadow-[0_0_12px_rgba(244,63,94,.8)] transition-opacity group-hover:opacity-100 group-focus:opacity-100" style={{ left: `${progress}%` }} />
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:py-2.5">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(280px,1fr)_auto_minmax(280px,1fr)] lg:items-center lg:gap-6">
          <div className="flex min-w-0 items-center gap-2.5 lg:max-w-[560px]">
            {isYouTube && <div className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black sm:h-[78px] sm:w-[138px]" aria-label="YouTube player"><div ref={youtubeHostRef} className="h-full w-full" /></div>}
            <button type="button" onClick={onOpenLyrics} className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5 sm:h-12 sm:w-12" title="Open now playing"><img src={currentSong.coverArt} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /><span className="absolute inset-0 hidden place-items-center bg-black/50 hover:grid"><ChevronUp size={18} /></span></button>
            <button type="button" onClick={onOpenLyrics} className="min-w-0 flex-1 text-left"><div className="truncate text-sm font-semibold leading-5 text-white">{currentSong.title}</div><div className="truncate text-xs leading-4 text-zinc-400">{currentSong.artist}</div><div className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">{isYouTube ? 'YouTube · official player' : 'Authorized stream'}</div></button>
            <div className="hidden shrink-0 items-center gap-0.5 sm:flex"><button type="button" onClick={toggleLike} className={`${iconButton} ${isLiked ? 'text-rose-400' : ''}`} aria-label="Like"><Heart size={17} fill={isLiked ? 'currentColor' : 'none'} /></button><button type="button" onClick={toggleDislike} className={`${iconButton} ${isDisliked ? 'text-white' : ''}`} aria-label="Dislike"><ThumbsDown size={16} fill={isDisliked ? 'currentColor' : 'none'} /></button></div>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-0.5 sm:gap-1.5">
            <button type="button" onClick={onToggleShuffle} className={`${iconButton} ${isShuffle ? 'text-rose-400' : ''}`} aria-label="Shuffle"><Shuffle size={17} /></button>
            <button type="button" onClick={onPrev} className={iconButton} aria-label="Previous"><SkipBack size={19} fill="currentColor" /></button>
            <button type="button" onClick={() => skip(-10)} className={`${iconButton} hidden sm:inline-flex`} aria-label="Back 10 seconds"><RotateCcw size={17} /><span className="absolute translate-y-3 text-[7px] font-bold">10</span></button>
            <button type="button" onClick={handleTogglePlay} className="mx-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 active:scale-95 sm:h-11 sm:w-11" aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="translate-x-px" />}</button>
            <button type="button" onClick={() => skip(10)} className={`${iconButton} hidden sm:inline-flex`} aria-label="Forward 10 seconds"><RotateCw size={17} /><span className="absolute translate-y-3 text-[7px] font-bold">10</span></button>
            <button type="button" onClick={onNext} className={iconButton} aria-label="Next"><SkipForward size={19} fill="currentColor" /></button>
            <button type="button" onClick={onCycleRepeat} className={`${iconButton} ${repeatMode !== 'off' ? 'text-rose-400' : ''}`} aria-label={`Repeat ${repeatMode}`}>{repeatMode === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}</button>
            <div className="ml-1 hidden min-w-[72px] text-center font-mono text-[10px] text-zinc-400 sm:block">{formatTime(position)} / {formatTime(duration)}</div>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-0.5 sm:justify-end sm:gap-1">
            <button type="button" onClick={onOpenLyrics} className={`${iconButton} hidden sm:inline-flex`} aria-label="Lyrics"><BookOpen size={16} /></button>
            <button type="button" onClick={onOpenEqualizer} className={`${iconButton} hidden md:inline-flex`} aria-label="Equalizer"><Sliders size={16} /></button>
            <button type="button" onClick={() => onToggleDownload(currentSong)} className={`${iconButton} ${isDownloaded ? 'text-emerald-400' : ''}`} aria-label="Save">{isDownloaded ? <Check size={16} /> : <Download size={16} />}</button>
            <button type="button" onClick={onOpenShare} className={`${iconButton} hidden sm:inline-flex`} aria-label="Share"><Share2 size={16} /></button>
            <button type="button" onClick={onOpenLyrics} className={`${iconButton} hidden sm:inline-flex`} aria-label="Expand player"><Maximize2 size={16} /></button>
            <div className="hidden items-center gap-1 pl-1 sm:flex"><button type="button" onClick={() => setIsMuted((value) => !value)} className={iconButton} aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted || volume === 0 ? <VolumeX size={17} /> : volume < 0.5 ? <Volume1 size={17} /> : <Volume2 size={17} />}</button><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(event) => { setVolume(Number(event.target.value)); setIsMuted(false); }} className="h-1 w-16 cursor-pointer accent-rose-500 lg:w-20" /></div>
            <div className="relative hidden md:block"><button type="button" onClick={() => setQualityMenuOpen((open) => !open)} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/10">{quality === 'data-saver-64k' ? '64k' : quality === 'normal-128k' ? '128k' : 'HD'}</button>{qualityMenuOpen && <div className="absolute bottom-full right-0 z-[60] mb-2 w-44 rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl">{(['data-saver-64k', 'normal-128k', 'high-320k'] as AudioQuality[]).map((item) => <button type="button" key={item} onClick={() => { onChangeQuality(item); setQualityMenuOpen(false); }} className={`w-full rounded-lg px-2.5 py-2 text-left text-xs ${quality === item ? 'bg-rose-500/15 text-rose-300' : 'text-zinc-300 hover:bg-white/5'}`}>{item === 'data-saver-64k' ? 'Data Saver · 64k' : item === 'normal-128k' ? 'Standard · 128k' : 'High · 320k'}</button>)}</div>}</div>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between px-1 text-[9px] font-mono text-zinc-500 sm:hidden"><span>{formatTime(position)}</span><span>{isYouTube ? 'YOUTUBE' : 'STREAM'}</span><span>{formatTime(duration)}</span></div>
      </div>
    </div>
  );
};
