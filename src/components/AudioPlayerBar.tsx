import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Sliders,
  Maximize2,
  Share2,
  Download,
  Check,
  BookOpen,
  Heart,
  ThumbsDown,
  ChevronUp,
  ListMusic,
  Tv,
  Music2,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Song, AudioQuality, AppTheme } from '../types';
import { audioEngine } from '../services/audioEngine';

interface AudioPlayerBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  playbackPosition: number;
  onSeek: (pos: number) => void;
  theme: AppTheme;
  quality: AudioQuality;
  onChangeQuality: (q: AudioQuality) => void;
  onOpenLyrics: () => void;
  onOpenEqualizer: () => void;
  onOpenShare: () => void;
  isDownloaded: boolean;
  onToggleDownload: (song: Song) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onCycleRepeat: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  playbackPosition,
  onSeek,
  theme,
  quality,
  onChangeQuality,
  onOpenLyrics,
  onOpenEqualizer,
  onOpenShare,
  isDownloaded,
  onToggleDownload,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat,
}) => {
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isLiked, setIsLiked] = useState(true);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState<'song' | 'video'>('song');

  // Interactive scrubber state
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverClientX, setHoverClientX] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioEngine.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Global mouse drag handling for scrubber
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingProgress || !progressBarRef.current || !currentSong) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percent = clickX / rect.width;
      const targetTime = percent * (currentSong.duration || 200);
      onSeek(targetTime);
    };

    const handleMouseUp = () => {
      if (isDraggingProgress) {
        setIsDraggingProgress(false);
      }
    };

    if (isDraggingProgress) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgress, currentSong, onSeek]);

  if (!currentSong) return null;

  const duration = currentSong.duration || 200;
  const progressPercent = Math.min(100, Math.max(0, (playbackPosition / duration) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(Math.max(0, secs) / 60);
    const s = Math.floor(Math.max(0, secs) % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    setIsDraggingProgress(true);
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = clickX / rect.width;
    onSeek(percent * duration);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = clickX / rect.width;
    setHoverPosition(percent * duration);
    setHoverClientX(e.clientX);
  };

  const handleSkipSeconds = (delta: number) => {
    const target = Math.max(0, Math.min(duration, playbackPosition + delta));
    onSeek(target);
  };

  return (
    <div
      id="bottom-audio-player-bar"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#030303]/98 backdrop-blur-2xl border-t border-white/[0.08] select-none shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
    >
      {/* Flush Top Interactive Scrubber */}
      <div
        ref={progressBarRef}
        onMouseDown={handleProgressBarMouseDown}
        onMouseMove={handleProgressMouseMove}
        onMouseLeave={() => setHoverPosition(null)}
        className="w-full h-1 hover:h-2.5 bg-white/10 cursor-pointer relative group transition-all duration-150"
      >
        {/* Buffered indicator bar */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-white/20"
          style={{ width: `${Math.min(100, progressPercent + 20)}%` }}
        />

        {/* Current playback progress */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-[#ff0000]"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Scrubber Knob */}
          <div
            className={`absolute right-[-6px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#ff0000] shadow-[0_0_8px_rgba(255,0,0,0.8)] transition-transform duration-100 ${
              isDraggingProgress || hoverPosition !== null ? 'scale-100' : 'scale-0 group-hover:scale-100'
            }`}
          />
        </div>

        {/* Hover Time Tooltip */}
        {hoverPosition !== null && (
          <div
            className="absolute -top-7 -translate-x-1/2 bg-[#1f1f1f] text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded shadow-lg pointer-events-none border border-white/10"
            style={{ left: `${Math.max(24, Math.min(window.innerWidth - 24, hoverClientX))}px` }}
          >
            {formatTime(hoverPosition)}
          </div>
        )}
      </div>

      {/* Main YouTube Music Player Bar Grid */}
      <div className="max-w-[1920px] mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* LEFT SECTION: Album Thumbnail, Song Info, Like / Dislike, Backend Stream Badge */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-sm sm:max-w-md">
          {/* Cover Art with Expand overlay */}
          <div
            id="playerbar-cover-art"
            className="relative group shrink-0 cursor-pointer rounded-md overflow-hidden"
            onClick={onOpenLyrics}
            title="Expand Fullscreen Player & Lyrics"
          >
            <img
              src={currentSong.coverArt}
              alt={currentSong.title}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-md object-cover border border-white/10 group-hover:brightness-90 transition-all"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-md flex items-center justify-center transition-opacity">
              <ChevronUp size={20} className="text-white" />
            </div>
          </div>

          {/* Song Title and Artist */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div
                onClick={onOpenLyrics}
                className="font-semibold text-sm text-white hover:underline truncate cursor-pointer leading-tight"
                title={currentSong.title}
              >
                {currentSong.title}
              </div>
              {/* Backend Stream Pill */}
              <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                STREAM
              </span>
            </div>
            <div className="text-xs text-[#aaa] truncate flex items-center gap-1 mt-0.5">
              <span className="hover:text-white cursor-pointer hover:underline">{currentSong.artist}</span>
              <span>•</span>
              <span className="truncate">{currentSong.album || 'Single'}</span>
            </div>
          </div>

          {/* YouTube Music Thumbs Feedback Buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              id="btn-player-like"
              onClick={() => {
                setIsLiked(!isLiked);
                if (isDisliked) setIsDisliked(false);
              }}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                isLiked ? 'text-[#ff0000]' : 'text-zinc-400 hover:text-white'
              }`}
              title={isLiked ? 'Liked' : 'Like'}
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button
              id="btn-player-dislike"
              onClick={() => {
                setIsDisliked(!isDisliked);
                if (isLiked) setIsLiked(false);
              }}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                isDisliked ? 'text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Dislike"
            >
              <ThumbsDown size={17} fill={isDisliked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* CENTER SECTION: Controls (Prev, 10s back, Play/Pause, 10s fwd, Next, Shuffle, Repeat, Time) */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-5">
            {/* Shuffle */}
            <button
              id="btn-player-shuffle"
              onClick={onToggleShuffle}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                isShuffle ? 'text-[#ff0000]' : 'text-zinc-400 hover:text-white'
              }`}
              title="Shuffle queue"
            >
              <Shuffle size={18} />
            </button>

            {/* Skip Previous Track */}
            <button
              id="btn-player-prev"
              onClick={onPrev}
              className="text-zinc-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              title="Previous (J)"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>

            {/* 10s Rewind */}
            <button
              id="btn-player-rewind-10"
              onClick={() => handleSkipSeconds(-10)}
              className="hidden sm:inline-flex text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 relative group"
              title="Rewind 10 seconds"
            >
              <RotateCcw size={18} />
              <span className="absolute -bottom-1 right-1 text-[9px] font-bold">10</span>
            </button>

            {/* Central Play/Pause Button */}
            <button
              id="btn-player-play-pause"
              onClick={onTogglePlay}
              className="w-11 h-11 rounded-full bg-white hover:bg-white/95 text-black flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause size={22} fill="black" />
              ) : (
                <Play size={22} fill="black" className="translate-x-[1.5px]" />
              )}
            </button>

            {/* 10s Fast-Forward */}
            <button
              id="btn-player-forward-10"
              onClick={() => handleSkipSeconds(10)}
              className="hidden sm:inline-flex text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 relative group"
              title="Forward 10 seconds"
            >
              <RotateCw size={18} />
              <span className="absolute -bottom-1 left-1 text-[9px] font-bold">10</span>
            </button>

            {/* Skip Next Track */}
            <button
              id="btn-player-next"
              onClick={onNext}
              className="text-zinc-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              title="Next (L)"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>

            {/* Repeat Mode */}
            <button
              id="btn-player-repeat"
              onClick={onCycleRepeat}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                repeatMode !== 'off' ? 'text-[#ff0000]' : 'text-zinc-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          {/* Time Display */}
          <div className="text-[11px] font-mono text-[#aaa] select-none flex items-center gap-1">
            <span>{formatTime(playbackPosition)}</span>
            <span className="text-zinc-600">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* RIGHT SECTION: Song/Video switcher, Lyrics, Quality, EQ, Volume & Fullscreen */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-3 min-w-0 flex-1 max-w-sm sm:max-w-md">
          {/* YouTube Music Song / Video Mode Toggle Pill */}
          <div className="hidden lg:flex items-center bg-[#212121] rounded-full p-0.5 border border-white/10">
            <button
              onClick={() => setMediaMode('song')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mediaMode === 'song'
                  ? 'bg-white/15 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Music2 size={13} />
              <span>Song</span>
            </button>
            <button
              onClick={() => {
                setMediaMode('video');
                onOpenLyrics();
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mediaMode === 'video'
                  ? 'bg-white/15 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv size={13} />
              <span>Video</span>
            </button>
          </div>

          {/* Live Lyrics Button */}
          <button
            id="btn-player-lyrics"
            onClick={onOpenLyrics}
            className="px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 border border-white/10"
            title="Live Synced Lyrics"
          >
            <BookOpen size={14} className="text-[#ff0000]" />
            <span className="hidden sm:inline">Lyrics</span>
          </button>

          {/* Audio Equalizer */}
          <button
            id="btn-player-eq"
            onClick={onOpenEqualizer}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="10-Band Graphic Equalizer"
          >
            <Sliders size={17} />
          </button>

          {/* Download Offline */}
          <button
            id="btn-player-download"
            onClick={() => onToggleDownload(currentSong)}
            className={`p-2 rounded-full transition-colors ${
              isDownloaded
                ? 'text-emerald-400 hover:bg-emerald-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title={isDownloaded ? 'Saved in Offline Vault' : 'Download for Offline Playback'}
          >
            {isDownloaded ? <Check size={17} /> : <Download size={17} />}
          </button>

          {/* Share Song */}
          <button
            id="btn-player-share"
            onClick={onOpenShare}
            className="hidden sm:inline-flex p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Share Song Moment"
          >
            <Share2 size={17} />
          </button>

          {/* Quality Selector Badge */}
          <div className="relative hidden md:block">
            <button
              id="btn-player-quality"
              onClick={() => setQualityMenuOpen(!qualityMenuOpen)}
              className="px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-300 uppercase tracking-wider transition-colors"
              title="Stream Quality"
            >
              {quality === 'data-saver-64k' ? '64k' : quality === 'normal-128k' ? '128k' : '320k HD'}
            </button>

            {qualityMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-48 rounded-2xl bg-[#1e1e1e] border border-white/15 shadow-2xl p-1.5 z-50">
                <div className="text-[10px] font-bold text-zinc-400 px-2 py-1 border-b border-white/10">
                  Audio Streaming Quality
                </div>
                {(['data-saver-64k', 'normal-128k', 'high-320k'] as AudioQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      onChangeQuality(q);
                      setQualityMenuOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-xl text-xs flex items-center justify-between ${
                      quality === q ? 'bg-red-500/20 text-red-300 font-bold' : 'text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <span>
                      {q === 'data-saver-64k'
                        ? 'Data Saver (64kbps)'
                        : q === 'normal-128k'
                        ? 'Standard (128kbps)'
                        : 'Hi-Res Lossless (320k)'}
                    </span>
                    {quality === q && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 group">
            <button
              id="btn-player-mute"
              onClick={() => setIsMuted(!isMuted)}
              className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={18} />
              ) : volume < 0.5 ? (
                <Volume1 size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
            <input
              id="player-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 sm:w-24 h-1 bg-white/20 accent-[#ff0000] rounded-lg cursor-pointer transition-all"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>

          {/* Expand Fullscreen */}
          <button
            id="btn-player-expand"
            onClick={onOpenLyrics}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Expand View"
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};
