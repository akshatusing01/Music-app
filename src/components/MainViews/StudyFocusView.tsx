import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CloudRain,
  Coffee,
  Flame,
  Bell,
  Waves,
  Sparkles,
  Zap,
  CheckCircle2,
  Headphones,
} from 'lucide-react';
import { Song, FocusTimerState, AmbientSounds, SupportedLanguage } from '../../types';
import { translations } from '../../data/translations';
import { audioEngine } from '../../services/audioEngine';

interface StudyFocusViewProps {
  timerState: FocusTimerState;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSetTimerMode: (mode: 'work' | 'shortBreak' | 'longBreak', durationSecs: number) => void;
  onSetStopwatch: () => void;
  stopwatchSeconds: number;
  isStopwatchRunning: boolean;
  onToggleStopwatch: () => void;
  onResetStopwatch: () => void;
  ambientSounds: AmbientSounds;
  onChangeAmbient: (newSounds: AmbientSounds) => void;
  focusSongs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onTogglePlay: () => void;
  language: SupportedLanguage;
}

export const StudyFocusView: React.FC<StudyFocusViewProps> = ({
  timerState,
  onToggleTimer,
  onResetTimer,
  onSetTimerMode,
  onSetStopwatch,
  stopwatchSeconds,
  isStopwatchRunning,
  onToggleStopwatch,
  onResetStopwatch,
  ambientSounds,
  onChangeAmbient,
  focusSongs,
  currentSong,
  isPlaying,
  onPlaySong,
  onTogglePlay,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const t = translations[language] || translations.en;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSoundSlider = (key: keyof AmbientSounds, val: number) => {
    const updated = { ...ambientSounds, [key]: val };
    onChangeAmbient(updated);
    audioEngine.setAmbientVolumes(updated);
  };

  const handlePreset = (presetName: string) => {
    let preset: AmbientSounds = { rain: 0, cafe: 0, fire: 0, templeBell: 0, waves: 0, whiteNoise: 0 };
    if (presetName === 'monsoon-chai') {
      preset = { rain: 0.65, cafe: 0.4, fire: 0, templeBell: 0, waves: 0, whiteNoise: 0.1 };
    } else if (presetName === 'deep-code') {
      preset = { rain: 0.2, cafe: 0, fire: 0, templeBell: 0, waves: 0, whiteNoise: 0.7 };
    } else if (presetName === 'himalayan-zen') {
      preset = { rain: 0.3, cafe: 0, fire: 0.2, templeBell: 0.5, waves: 0, whiteNoise: 0 };
    } else if (presetName === 'coastal-focus') {
      preset = { rain: 0, cafe: 0, fire: 0, templeBell: 0, waves: 0.75, whiteNoise: 0.2 };
    }
    onChangeAmbient(preset);
    audioEngine.setAmbientVolumes(preset);
  };

  const progressPercent =
    timerState.duration > 0
      ? ((timerState.duration - timerState.remaining) / timerState.duration) * 100
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-zinc-950/80 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <Timer size={14} className="animate-pulse" />
            <span>Productivity & Alpha Brainwave Suite</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Focus, Study & Deep Flow
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300">
            Combine 432Hz ambient melodies, synchronized Pomodoro study timers, and layered natural soundscapes (Monsoon rain, Chai cafe, Tibetan bowls) for uninterrupted flow states.
          </p>
        </div>

        {/* Daily Stats Pill */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shrink-0">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{timerState.completedSessions}</div>
            <div className="text-[11px] text-zinc-400">Sessions Completed Today</div>
          </div>
        </div>
      </div>

      {/* Center Layout: Left (Timer / Stopwatch) | Right (Ambient Sound Mixer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pomodoro & Stopwatch */}
        <div className="lg:col-span-6 rounded-3xl p-6 border border-white/15 bg-zinc-900/80 backdrop-blur-2xl shadow-xl flex flex-col items-center justify-between text-center space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              id="btn-switch-pomodoro"
              onClick={() => setActiveTab('pomodoro')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pomodoro'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pomodoro Timer
            </button>
            <button
              id="btn-switch-stopwatch"
              onClick={() => setActiveTab('stopwatch')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'stopwatch'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Precision Stopwatch
            </button>
          </div>

          {activeTab === 'pomodoro' ? (
            <>
              {/* Pomodoro Presets */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  id="btn-pomo-25"
                  onClick={() => onSetTimerMode('work', 1500)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    timerState.mode === 'work' && timerState.duration === 1500
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
                  }`}
                >
                  25m Deep Work
                </button>
                <button
                  id="btn-pomo-45"
                  onClick={() => onSetTimerMode('work', 2700)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    timerState.mode === 'work' && timerState.duration === 2700
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
                  }`}
                >
                  45m Sprint
                </button>
                <button
                  id="btn-pomo-5-break"
                  onClick={() => onSetTimerMode('shortBreak', 300)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    timerState.mode === 'shortBreak'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
                  }`}
                >
                  5m Break
                </button>
                <button
                  id="btn-pomo-15-break"
                  onClick={() => onSetTimerMode('longBreak', 900)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    timerState.mode === 'longBreak'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
                  }`}
                >
                  15m Refresh
                </button>
              </div>

              {/* Big Circular Clock Display */}
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-zinc-800"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-emerald-500 transition-all duration-300"
                    strokeWidth="5"
                    strokeDasharray={276}
                    strokeDashoffset={276 - (276 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                    {formatTimer(timerState.remaining)}
                  </span>
                  <span className="text-xs uppercase tracking-widest font-bold text-emerald-400 mt-1">
                    {timerState.mode === 'work' ? 'Focus Session' : 'Refresh Break'}
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-4">
                <button
                  id="btn-toggle-pomodoro"
                  onClick={onToggleTimer}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  {timerState.isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                  <span>{timerState.isRunning ? 'Pause Timer' : 'Start Focus'}</span>
                </button>

                <button
                  id="btn-reset-pomodoro"
                  onClick={onResetTimer}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all"
                  title="Reset Timer"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Precision Stopwatch */}
              <div className="w-56 h-56 rounded-full border-4 border-emerald-500/40 bg-zinc-950 flex flex-col items-center justify-center shadow-inner">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                  {formatTimer(stopwatchSeconds)}
                </span>
                <span className="text-xs uppercase tracking-widest font-bold text-emerald-400 mt-1">
                  Elapsed Time
                </span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  id="btn-toggle-stopwatch"
                  onClick={onToggleStopwatch}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  {isStopwatchRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                  <span>{isStopwatchRunning ? 'Pause Stopwatch' : 'Start Stopwatch'}</span>
                </button>

                <button
                  id="btn-reset-stopwatch"
                  onClick={onResetStopwatch}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </>
          )}

          {/* Quick Sound Bell Ring */}
          <button
            onClick={() => audioEngine.playTempleBellSound()}
            className="flex items-center gap-1.5 text-xs text-emerald-300/80 hover:text-emerald-300 font-semibold"
          >
            <Bell size={14} />
            <span>Ring Mindfulness Bell 🔔</span>
          </button>
        </div>

        {/* Right Column: Ambient Natural Soundscape Mixer */}
        <div className="lg:col-span-6 rounded-3xl p-6 border border-white/15 bg-zinc-900/80 backdrop-blur-2xl shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 size={18} className="text-emerald-400" />
              <h3 className="font-bold text-base text-white">{t.ambientMixer}</h3>
            </div>
            <span className="text-xs text-zinc-400">Layer Multi-Track Sounds</span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'monsoon-chai', label: '🌧️ Monsoon Chai' },
              { id: 'deep-code', label: '🧠 Deep Code Alpha' },
              { id: 'himalayan-zen', label: '🎋 Himalayan Zen' },
              { id: 'coastal-focus', label: '🌊 Goa Coast' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePreset(p.id)}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-zinc-200 font-medium transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Individual Sliders */}
          <div className="space-y-4 pt-2">
            {[
              { key: 'rain', label: t.rain, icon: CloudRain, color: 'accent-cyan-400' },
              { key: 'cafe', label: t.cafe, icon: Coffee, color: 'accent-amber-500' },
              { key: 'fire', label: t.fire, icon: Flame, color: 'accent-red-500' },
              { key: 'templeBell', label: t.templeBells, icon: Bell, color: 'accent-emerald-400' },
              { key: 'waves', label: t.oceanWaves, icon: Waves, color: 'accent-blue-400' },
              { key: 'whiteNoise', label: t.whiteNoise, icon: Sparkles, color: 'accent-purple-400' },
            ].map((item) => {
              const Icon = item.icon;
              const val = ambientSounds[item.key as keyof AmbientSounds];
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2 text-zinc-300 font-medium">
                      <Icon size={14} className="text-emerald-400" />
                      {item.label}
                    </span>
                    <span className="text-zinc-500 font-mono">{Math.round(val * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={val}
                    onChange={(e) => handleSoundSlider(item.key as keyof AmbientSounds, parseFloat(e.target.value))}
                    className={`w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer ${item.color}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Focus & Lofi Music Tracklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones size={18} className="text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Curated 432Hz & Lofi Tracks for Flow State</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {focusSongs.map((song) => {
            const isThisPlaying = currentSong?.id === song.id && isPlaying;
            return (
              <div
                key={song.id}
                onClick={() => onPlaySong(song)}
                className="group cursor-pointer rounded-2xl p-3.5 border border-white/10 bg-zinc-900/60 hover:bg-zinc-900/90 backdrop-blur-xl transition-all hover:border-emerald-500/40 flex items-center gap-3 shadow-lg"
              >
                <img
                  src={song.coverArt}
                  alt={song.title}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-300">
                    {song.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                    {song.bpm} BPM • 432Hz
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {isThisPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
