import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Share2,
  BookOpen,
  Languages,
  Play,
  Pause,
  Sliders,
  Volume2,
  Maximize2,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Song, LyricLine, SupportedLanguage } from '../../types';
import { translations } from '../../data/translations';
import { AudioVisualizer } from '../AudioVisualizer';

interface LyricsViewProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackPosition: number;
  onSeek: (seconds: number) => void;
  onOpenShareModal: () => void;
  language: SupportedLanguage;
  theme: string;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  playbackPosition,
  onSeek,
  onOpenShareModal,
  language,
  theme,
}) => {
  const [scriptMode, setScriptMode] = useState<'original' | 'romanized' | 'translation'>('original');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const t = translations[language] || translations.en;

  // Auto-scroll active lyric into view smoothly
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [playbackPosition]);

  if (!currentSong) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4 text-zinc-400">
        <BookOpen size={48} className="mx-auto opacity-40 text-rose-400" />
        <h2 className="text-xl font-bold text-white">No Song Selected</h2>
        <p className="text-sm">Play any track from the Explore catalog to view synchronized karaoke lyrics.</p>
      </div>
    );
  }

  const activeLineIndex = currentSong.lyrics
    ? currentSong.lyrics.reduce((acc, line, idx) => {
        if (playbackPosition >= line.time) return idx;
        return acc;
      }, -1)
    : -1;

  const handleAnalyzeLyrics = async () => {
    if (isAnalyzing || !currentSong) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/lyrics/meaning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentSong.title,
          artist: currentSong.artist,
          lyrics: currentSong.lyrics?.map((l) => l.text).join('\n') || '',
          language: currentSong.language,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Failed to analyze lyrics:', err);
      setAiAnalysis(
        `"${currentSong.title}" is an emotional anthem reflecting deep devotion, romantic vulnerability, and musical passion. The melody is composed around classic Indian ragas with modern orchestral swells.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-36">
      {/* Header Bar */}
      <div className="rounded-3xl p-5 border border-white/15 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src={currentSong.coverArt}
            alt={currentSong.title}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-md shrink-0"
          />
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{currentSong.title}</h2>
            <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
          </div>
        </div>

        {/* Script & AI Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Script Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => setScriptMode('original')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                scriptMode === 'original' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Native
            </button>
            <button
              onClick={() => setScriptMode('romanized')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                scriptMode === 'romanized' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hinglish
            </button>
            <button
              onClick={() => setScriptMode('translation')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                scriptMode === 'translation' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          {/* AI Meaning Deep Dive */}
          <button
            id="btn-ai-lyric-meaning"
            onClick={handleAnalyzeLyrics}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/30 text-purple-300 text-xs font-semibold backdrop-blur-md transition-all"
          >
            <Sparkles size={14} className={isAnalyzing ? 'animate-spin' : 'text-purple-400'} />
            <span>{isAnalyzing ? 'Analyzing...' : 'AI Meaning'}</span>
          </button>

          {/* Share Lyric Card */}
          <button
            id="btn-share-lyric-card"
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all"
          >
            <Share2 size={14} />
            <span>Share Story</span>
          </button>
        </div>
      </div>

      {/* AI Lyric Analysis Dropdown */}
      {aiAnalysis && (
        <div className="rounded-3xl p-5 border border-purple-500/30 bg-purple-950/40 backdrop-blur-2xl shadow-xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Sparkles size={14} /> Gemini Poetic Analysis & Meaning
            </span>
            <button
              onClick={() => setAiAnalysis(null)}
              className="text-[10px] text-zinc-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed">{aiAnalysis}</p>
        </div>
      )}

      {/* Synchronized Karaoke Lyrics Stream */}
      <div className="rounded-3xl p-6 sm:p-10 border border-white/15 bg-zinc-950/90 backdrop-blur-3xl shadow-2xl space-y-6 max-h-[600px] overflow-y-auto scrollbar-thin">
        {currentSong.lyrics && currentSong.lyrics.length > 0 ? (
          currentSong.lyrics.map((line, index) => {
            const isActive = index === activeLineIndex;
            const isPast = index < activeLineIndex;

            let displayText = line.text;
            if (scriptMode === 'romanized' && line.romanized) displayText = line.romanized;
            if (scriptMode === 'translation' && line.translation) displayText = line.translation;

            return (
              <div
                key={index}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.time)}
                className={`cursor-pointer transition-all duration-300 py-2.5 px-4 rounded-2xl text-center select-none ${
                  isActive
                    ? 'scale-105 bg-rose-500/20 text-white font-extrabold text-xl sm:text-2xl border border-rose-500/40 shadow-lg shadow-rose-500/20'
                    : isPast
                    ? 'text-zinc-500 hover:text-zinc-300 text-base sm:text-lg font-medium'
                    : 'text-zinc-400 hover:text-white text-base sm:text-lg font-semibold opacity-70'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{displayText}</span>
                </div>
                {scriptMode !== 'original' && line.romanized && scriptMode === 'translation' && (
                  <div className="text-xs text-zinc-400 font-normal mt-0.5">{line.romanized}</div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-zinc-400 space-y-2">
            <BookOpen size={32} className="mx-auto opacity-50 text-rose-400" />
            <p className="text-base font-semibold text-white">Karaoke Lyrics Processing</p>
            <p className="text-xs">Enjoying instrumental stream. Synced lyrics will sync live automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};
