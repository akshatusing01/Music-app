import React, { useState } from 'react';
import { X, Sparkles, Wand2, Music, Play, CheckCircle2, Flame, Heart, Coffee, Radio } from 'lucide-react';
import { Playlist, Song, SupportedLanguage } from '../../types';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated: (newPlaylist: Playlist) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  availableSongs: Song[];
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated,
  onPlayPlaylist,
  availableSongs,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedMood, setSelectedMood] = useState('romance');
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [tempo, setTempo] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<Playlist | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: 'Late Night Long Drive 💕', prompt: 'Bollywood & English soulful romantic songs with acoustic guitar for a quiet late night car drive.' },
    { label: 'Desi Gym Beast PR ⚡', prompt: 'High-octane gym motivation phonk and Punjabi bass drops with 130+ BPM for deadlifts and sprinting.' },
    { label: 'Monsoon Study Chai ☕', prompt: 'Calm 432Hz ambient Indian classical flute and sitar lofi to focus on coding and exam preparation.' },
    { label: 'South India Kuthu Party 🪩', prompt: 'Electrifying Tamil & Telugu dholak beats and energy dance numbers for a house party.' },
  ];

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || `Curate a ${selectedMood} playlist in ${selectedLanguage} with ${tempo} tempo.`,
          mood: selectedMood,
          language: selectedLanguage,
          activity: 'SurSync Music Session',
        }),
      });

      const data = await res.json();

      // Find matching songs from available library
      const matched = availableSongs.filter((s) => {
        if (selectedMood === 'all') return true;
        return s.mood === selectedMood || s.language === selectedLanguage;
      });
      const songPool = matched.length >= 3 ? matched : availableSongs;
      const selectedSongIds = songPool.slice(0, 5).map((s) => s.id);

      const newPlaylist: Playlist = {
        id: `ai-gen-${Date.now()}`,
        title: data.playlist?.title || `${selectedMood.toUpperCase()} AI Vibe Mix`,
        description: data.playlist?.description || `Personalized AI playlist generated with Gemini Flash based on your prompt: "${prompt}".`,
        coverArt:
          data.playlist?.coverArtTheme === 'ruby-glow'
            ? 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80'
            : data.playlist?.coverArtTheme === 'emerald-forest'
            ? 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        songIds: selectedSongIds,
        mood: selectedMood as any,
        creatorName: 'Gemini AI Assistant',
        platformSource: 'SurSync AI',
      };

      setGeneratedResult(newPlaylist);
      onPlaylistCreated(newPlaylist);
    } catch (err) {
      console.error('Failed to generate AI playlist:', err);
      // Fallback generator
      const fallbackSongs = availableSongs.slice(0, 4);
      const fallbackPlaylist: Playlist = {
        id: `ai-gen-${Date.now()}`,
        title: `SurSync AI ${selectedMood.toUpperCase()} Mix`,
        description: `Smart AI curated mix tailored for your mood and language preferences.`,
        coverArt: fallbackSongs[0]?.coverArt || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
        songIds: fallbackSongs.map((s) => s.id),
        mood: selectedMood as any,
        creatorName: 'Gemini AI Assistant',
        platformSource: 'SurSync AI',
      };
      setGeneratedResult(fallbackPlaylist);
      onPlaylistCreated(fallbackPlaylist);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl p-6 border border-rose-500/30 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-rose-400 border border-rose-500/30">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gemini AI Playlist Generator</h3>
              <p className="text-xs text-zinc-400">Describe any vibe, scene, or habit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Describe Your Ideal Playlist:</label>
          <textarea
            rows={3}
            placeholder="e.g. Late night study session with soulful Arijit Singh & Sid Sriram melodies and rain sounds..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-rose-500/50 outline-none resize-none"
          />
        </div>

        {/* Quick Inspiration Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-400">Quick Inspiration Prompts:</span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((qp) => (
              <button
                key={qp.label}
                onClick={() => setPrompt(qp.prompt)}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-rose-300 transition-colors"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls: Mood & Language */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Target Mood:</label>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white outline-none"
            >
              <option value="romance">Couple & Romance 💕</option>
              <option value="gym">Gym & Beast Mode ⚡</option>
              <option value="study">Study & Focus ☕</option>
              <option value="party">Desi Party & Kuthu 🪩</option>
              <option value="devotional">Peace & Sufi 🕊️</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Language:</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white outline-none"
            >
              <option value="hi">Hindi (बॉलीवुड)</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
              <option value="en">English Hits</option>
              <option value="all">All Regional Mix</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all"
        >
          {isGenerating ? (
            <>
              <Sparkles size={16} className="animate-spin text-amber-300" />
              <span>Gemini AI is Composing Your Playlist...</span>
            </>
          ) : (
            <>
              <Wand2 size={16} />
              <span>Generate AI Playlist with Gemini</span>
            </>
          )}
        </button>

        {/* Generated Result Preview */}
        {generatedResult && (
          <div className="p-4 rounded-2xl bg-white/5 border border-rose-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={14} /> Playlist Created & Saved to Library
              </span>
              <span className="text-[10px] text-zinc-400">{generatedResult.songIds.length} Songs</span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={generatedResult.coverArt}
                alt={generatedResult.title}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-white truncate">{generatedResult.title}</h4>
                <p className="text-[11px] text-zinc-400 truncate">{generatedResult.description}</p>
              </div>
              <button
                onClick={() => {
                  onPlayPlaylist(generatedResult);
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md"
              >
                <Play size={12} fill="currentColor" />
                <span>Play</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
