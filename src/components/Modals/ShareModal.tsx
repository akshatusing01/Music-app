import React, { useState } from 'react';
import { X, Share2, Download, Copy, Check, Sparkles, Heart, Radio } from 'lucide-react';
import { Song, LyricLine } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song | null;
  playbackPosition: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  currentSong,
  playbackPosition,
}) => {
  const [selectedGradient, setSelectedGradient] = useState('from-rose-600 via-pink-700 to-indigo-900');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !currentSong) return null;

  const currentLyric =
    currentSong.lyrics?.find((l) => Math.abs(playbackPosition - l.time) < 8) ||
    currentSong.lyrics?.[0] || { text: '🎵 Listening on SurSync with friends in real-time', translation: 'Enjoying the vibe' };

  const gradients = [
    { id: 'rose', name: 'Bollywood Rose', class: 'from-rose-600 via-pink-700 to-indigo-900' },
    { id: 'sunset', name: 'Sunset Glow', class: 'from-amber-600 via-rose-600 to-purple-900' },
    { id: 'cyber', name: 'Midnight Cyber', class: 'from-blue-600 via-indigo-700 to-zinc-950' },
    { id: 'emerald', name: 'Focus Forest', class: 'from-emerald-600 via-teal-700 to-zinc-900' },
    { id: 'dark', name: 'Obsidian Noir', class: 'from-zinc-800 via-zinc-900 to-black' },
  ];

  const handleCopyCardText = () => {
    const text = `"${currentLyric.text}" - ${currentSong.title} by ${currentSong.artist} 🎵\nListen with me live on SurSync: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl p-6 border border-white/20 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-rose-400" />
            <h3 className="font-bold text-base text-white">Share Lyric Story Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Story Card Preview (Instagram / WhatsApp Story Aspect Ratio) */}
        <div
          id="lyric-story-card-preview"
          className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${selectedGradient} text-white shadow-2xl space-y-6 aspect-[4/5] flex flex-col justify-between border border-white/25`}
        >
          {/* Top: SurSync Watermark & Live Radio Pulse */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-wider">
              <Radio size={12} className="text-rose-400 animate-pulse" />
              <span>SurSync • सुर</span>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
              {currentSong.languageLabel}
            </span>
          </div>

          {/* Center: Big Highlighted Lyric Quote */}
          <div className="space-y-3 my-auto">
            <span className="text-3xl opacity-60">“</span>
            <p className="text-xl sm:text-2xl font-black leading-snug tracking-tight drop-shadow-md">
              {currentLyric.text}
            </p>
            {currentLyric.translation && (
              <p className="text-xs text-white/80 font-medium italic">
                {currentLyric.translation}
              </p>
            )}
          </div>

          {/* Bottom: Song & Artist Info */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20">
            <img
              src={currentSong.coverArt}
              alt={currentSong.title}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border border-white/30"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs truncate">{currentSong.title}</h4>
              <p className="text-[10px] text-zinc-300 truncate">{currentSong.artist}</p>
            </div>
            <Heart size={16} className="text-rose-400 fill-rose-400 shrink-0" />
          </div>
        </div>

        {/* Gradient Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Card Theme:</label>
          <div className="flex gap-2">
            {gradients.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGradient(g.class)}
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${g.class} border-2 transition-all ${
                  selectedGradient === g.class ? 'scale-110 border-white' : 'border-transparent'
                }`}
                title={g.name}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleCopyCardText}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied Link!' : 'Copy Lyric'}</span>
          </button>

          <button
            onClick={() => {
              handleCopyCardText();
              alert('Lyric card ready for Instagram Story / WhatsApp Status sharing!');
              onClose();
            }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition-all"
          >
            <Download size={14} />
            <span>Share to Story</span>
          </button>
        </div>
      </div>
    </div>
  );
};
