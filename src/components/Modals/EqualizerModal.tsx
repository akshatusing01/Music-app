import React, { useState } from 'react';
import { X, Sliders, Volume2, Sparkles, RotateCcw } from 'lucide-react';
import { EqualizerPreset } from '../../types';
import { audioEngine } from '../../services/audioEngine';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ isOpen, onClose }) => {
  const [activePreset, setActivePreset] = useState<string>('bollywood-live');
  const [gains, setGains] = useState<number[]>([4, 3, 2, 0, 1, 2, 4, 3, 2, 1]);

  if (!isOpen) return null;

  const frequencies = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];

  const presets: { id: string; name: string; gains: number[] }[] = [
    { id: 'flat', name: 'Flat Reference', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'bollywood-live', name: 'Bollywood Live 🎙️', gains: [4, 3, 2, 0, 1, 3, 5, 4, 3, 2] },
    { id: 'bass-boost', name: 'Desi Bass Boost 💥', gains: [8, 7, 5, 3, 1, 0, 1, 2, 3, 4] },
    { id: 'gym-pump', name: 'Gym Beast Pump ⚡', gains: [7, 6, 4, 2, 0, 2, 4, 5, 6, 7] },
    { id: 'lofi-chill', name: 'Lo-Fi Warmth ☕', gains: [3, 4, 3, 1, 0, -1, -2, -3, -4, -5] },
    { id: 'vocal-clarity', name: 'Vocal Clarity ✨', gains: [-2, -1, 0, 2, 4, 5, 4, 2, 1, 0] },
  ];

  const handleApplyPreset = (preset: { id: string; gains: number[] }) => {
    setActivePreset(preset.id);
    setGains([...preset.gains]);
    audioEngine.applyEqualizer(preset.gains);
  };

  const handleSliderChange = (index: number, val: number) => {
    const updated = [...gains];
    updated[index] = val;
    setGains(updated);
    setActivePreset('custom');
    audioEngine.applyEqualizer(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl p-6 border border-white/20 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">10-Band Studio Equalizer</h3>
              <p className="text-xs text-zinc-400">DSP Audio Hardware Simulation (±12 dB)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400">Audio Profiles & Presets:</label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activePreset === p.id
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-10 gap-1.5 sm:gap-2 py-4 bg-black/40 rounded-2xl p-3 border border-white/5">
          {frequencies.map((freq, i) => (
            <div key={freq} className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-400">
                {gains[i] > 0 ? `+${gains[i]}` : gains[i]}
              </span>
              <div className="h-40 flex items-center justify-center">
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={gains[i]}
                  onChange={(e) => handleSliderChange(i, parseInt(e.target.value))}
                  className="w-32 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500 -rotate-90 origin-center"
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-zinc-400 truncate w-full text-center">
                {freq}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => handleApplyPreset(presets[0])}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
          >
            <RotateCcw size={14} />
            <span>Reset to Flat</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
