import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Maximize2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, ListMusic, Share2, Download, Check, Shuffle, Repeat, Repeat1, Sliders } from 'lucide-react';
import { Song, AudioQuality } from '../types';
import { youtubePlayer } from '../services/youtubePlayer';
import { audioEngine } from '../services/audioEngine';

interface MusicCockpitProps {
  currentSong: Song | null;
  isPlaying: boolean;
  playbackPosition: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (position: number) => void;
  onToggleLike: (songId: string) => void;
  isLiked: boolean;
  isDownloaded: boolean;
  onToggleDownload: (song: Song) => void;
  onOpenLyrics: () => void;
  onOpenEqualizer: () => void;
  onOpenShare: () => void;
  onChangeQuality: (quality: AudioQuality) => void;
  quality: AudioQuality;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onCycleRepeat: () => void;
}

const button = 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60';

const time = (value: number) => {
  const s = Math.max(0, Math.floor(value || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const MusicCockpit: React.FC<MusicCockpitProps> = ({ currentSong, isPlaying, playbackPosition, onTogglePlay, onNext, onPrev, onSeek, onToggleLike, isLiked, isDownloaded, onToggleDownload, onOpenLyrics, onOpenEqualizer, onOpenShare, onChangeQuality, quality, isShuffle, onToggleShuffle, repeatMode, onCycleRepeat }) => {
  const [expanded, setExpanded] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(playbackPosition);
  const hostRef = useRef<HTMLDivElement>(null);

  const isYouTube = Boolean(currentSong?.youtubeVideoId);

  useEffect(() => {
    audioEngine.setVolume(isYouTube ? 0 : muted ? 0 : volume);
    if (isYouTube) {
      youtubePlayer.setVolume(muted ? 0 : volume);
      muted ? youtubePlayer.mute() : youtubePlayer.unmute();
    }
  }, [volume, muted, isYouTube]);

  useEffect(() => {
    if (!hostRef.current) return;
    youtubePlayer.mount(hostRef.current).catch(() => undefined);
    const update = (event: Event) => {
      const detail = (event as CustomEvent<{ currentTime?: number; duration?: number }>).detail;
      if (typeof detail?.currentTime === 'number') setPosition(detail.currentTime);
      if (typeof detail?.duration === 'number' && detail.duration > 0) setDuration(detail.duration);
    };
    window.addEventListener('syncbeat:youtube-position', update);
    return () => window.removeEventListener('syncbeat:youtube-position', update);
  }, []);

  useEffect(() => {
    if (!currentSong?.youtubeVideoId) return;
    setPosition(playbackPosition);
    youtubePlayer.load(currentSong.youtubeVideoId, playbackPosition, isPlaying, 1).catch(() => undefined);
  }, [currentSong?.id, currentSong?.youtubeVideoId]);

  useEffect(() => {
    if (!isYouTube) setPosition(playbackPosition);
  }, [playbackPosition, isYouTube]);

  if (!currentSong) return null;

  const total = Math.max(1, duration || currentSong.duration || 1);
  const safePosition = Math.min(Math.max(0, position), total);
  const progress = (safePosition / total) * 100;

  const seek = (value: number) => {
    const next = Math.min(total, Math.max(0, value));
    setPosition(next);
    onSeek(next);
  };

  const cockpit = (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[#09090b]/95 shadow-[0_-20px_70px_rgba(0,0,0,.48)] backdrop-blur-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto max-w-[1500px] px-3 sm:px-5">
        <div className="group relative h-1 cursor-pointer bg-white/10" role="slider" tabIndex={0} aria-label="Playback position" aria-valuemin={0} aria-valuemax={total} aria-valuenow={safePosition} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); seek(((event.clientX - rect.left) / rect.width) * total); }} onKeyDown={(event) => { if (event.key === 'ArrowLeft') seek(safePosition - 5); if (event.key === 'ArrowRight') seek(safePosition + 5); }}>
          <div className="h-full bg-[var(--cine-accent,#d8ff45)]" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex min-h-[70px] items-center gap-3 py-2 sm:gap-4">
          <button type="button" className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5" onClick={() => setExpanded(true)} aria-label="Open music cockpit"><img src={currentSong.coverArt} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /></button>
          <button type="button" onClick={() => setExpanded(true)} className="min-w-0 flex-1 text-left" aria-label="Open now playing"><div className="truncate text-sm font-semibold text-white">{currentSong.title}</div><div className="truncate text-xs text-zinc-400">{currentSong.artist}</div></button>
          <button type="button" className={`${button} hidden sm:inline-flex ${isLiked ? 'text-[var(--cine-accent,#d8ff45)]' : ''}`} onClick={() => onToggleLike(currentSong.id)} aria-label={isLiked ? 'Unlike' : 'Like'}><Heart size={18} fill={isLiked ? 'currentColor' : 'none'} /></button>
          <button type="button" className={button} onClick={onPrev} aria-label="Previous"><SkipBack size={18} fill="currentColor" /></button>
          <button type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 active:scale-95" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
          <button type="button" className={button} onClick={onNext} aria-label="Next"><SkipForward size={18} fill="currentColor" /></button>
          <div className="hidden min-w-[88px] text-center font-mono text-[10px] text-zinc-500 md:block">{time(safePosition)} / {time(total)}</div>
          <button type="button" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white lg:inline-flex" onClick={() => setExpanded(true)} aria-label="Expand music cockpit"><Maximize2 size={17} /></button>
        </div>
      </div>
      <div ref={hostRef} aria-hidden="true" className="pointer-events-none fixed -left-[2px] -top-[2px] h-px w-px overflow-hidden opacity-0" />
    </div>
  );

  if (!expanded) return cockpit;

  return <>
    {cockpit}
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#09090b]/98 backdrop-blur-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-5 pb-10 pt-[max(20px,env(safe-area-inset-top))] sm:px-8">
        <div className="flex items-center justify-between"><button type="button" className={button} onClick={() => setExpanded(false)} aria-label="Close music cockpit"><ChevronDown size={22} /></button><span className="text-[10px] font-semibold uppercase tracking-[.28em] text-zinc-500">Now Playing</span><button type="button" className={button} onClick={onOpenShare} aria-label="Share track"><Share2 size={18} /></button></div>
        <div className="flex flex-1 flex-col items-center justify-center py-8 sm:py-12">
          <div className="relative aspect-square w-[min(78vw,430px)] overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_100px_rgba(0,0,0,.5)]"><img src={currentSong.coverArt} alt={`${currentSong.title} artwork`} className="h-full w-full object-cover" referrerPolicy="no-referrer" /></div>
          <div className="mt-8 flex w-full max-w-xl items-end gap-4"><div className="min-w-0 flex-1"><h1 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">{currentSong.title}</h1><p className="mt-1 truncate text-sm text-zinc-400">{currentSong.artist}</p></div><button type="button" className={`${button} ${isLiked ? 'text-[var(--cine-accent,#d8ff45)]' : ''}`} onClick={() => onToggleLike(currentSong.id)} aria-label="Like"><Heart size={21} fill={isLiked ? 'currentColor' : 'none'} /></button></div>
          <div className="mt-8 w-full max-w-xl"><input aria-label="Playback position" type="range" min={0} max={total} step={0.1} value={safePosition} onChange={(event) => seek(Number(event.target.value))} className="w-full accent-[var(--cine-accent,#d8ff45)]" /><div className="mt-2 flex justify-between font-mono text-[10px] text-zinc-500"><span>{time(safePosition)}</span><span>{time(total)}</span></div></div>
          <div className="mt-7 flex items-center justify-center gap-2 sm:gap-4"><button type="button" className={`${button} ${isShuffle ? 'text-[var(--cine-accent,#d8ff45)]' : ''}`} onClick={onToggleShuffle} aria-label="Shuffle"><Shuffle size={18} /></button><button type="button" className={button} onClick={onPrev} aria-label="Previous"><SkipBack size={22} fill="currentColor" /></button><button type="button" className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-2xl" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={27} fill="currentColor" /> : <Play size={27} fill="currentColor" />}</button><button type="button" className={button} onClick={onNext} aria-label="Next"><SkipForward size={22} fill="currentColor" /></button><button type="button" className={`${button} ${repeatMode !== 'off' ? 'text-[var(--cine-accent,#d8ff45)]' : ''}`} onClick={onCycleRepeat} aria-label="Repeat">{repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}</button></div>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-2"><button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-300 hover:bg-white/10" onClick={onOpenLyrics}>Lyrics</button><button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-300 hover:bg-white/10" onClick={onOpenEqualizer}><Sliders size={14} className="mr-1 inline" />Sound</button><button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-300 hover:bg-white/10" onClick={() => onToggleDownload(currentSong)}>{isDownloaded ? <Check size={14} className="mr-1 inline text-emerald-400" /> : <Download size={14} className="mr-1 inline" />}{isDownloaded ? 'Saved' : 'Save'}</button><label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300"><button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button><input aria-label="Volume" type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={(event) => { setVolume(Number(event.target.value)); setMuted(false); }} className="w-20 accent-[var(--cine-accent,#d8ff45)]" /></label><select aria-label="Audio quality" value={quality} onChange={(event) => onChangeQuality(event.target.value as AudioQuality)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300"><option value="data-saver-64k">64k</option><option value="normal-128k">128k</option><option value="high-320k">HD</option></select></div>
          <div className="mt-10 flex items-center gap-2 text-xs text-zinc-500"><ListMusic size={15} />Queue and session context remain available through the main app.</div>
        </div>
      </div>
    </div>
  </>;
};
