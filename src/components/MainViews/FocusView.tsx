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
  Flag,
  Clock,
} from 'lucide-react';
import { Song, FocusTimerState, AmbientSounds, SupportedLanguage, StopwatchLap } from '../../types';
import { translations } from '../../data/translations';
import { audioEngine } from '../../services/audioEngine';

interface FocusViewProps {
  timerState: FocusTimerState;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSetTimerMode: (mode: 'work' | 'shortBreak' | 'longBreak', durationSecs: number, presetName?: any) => void;
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

export const FocusView: React.FC<FocusViewProps> = ({
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
  const [laps, setLaps] = useState<StopwatchLap[]>([]);
  const t = translations[language] || translations.en;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatStopwatch = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRecordLap = () => {
    if (!isStopwatchRunning) return;
    const lastLapTime = laps.length > 0 ? laps[0].overallTime : 0;
    const lapTime = stopwatchSeconds - lastLapTime;
    const newLap: StopwatchLap = {
      lapNumber: laps.length + 1,
      lapTime,
      overallTime: stopwatchSeconds,
    };
    setLaps([newLap, ...laps]);
  };

  const handleResetStopwatchAll = () => {
    onResetStopwatch();
    setLaps([]);
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
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-zinc-950/80 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Sparkles size={14} />
            <span>Synchronized Deep Work & Study Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Study Timer, Stopwatch & Ambient Soundscapes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Boost focus with shared Pomodoro intervals, precision lap tracking, multi-layered monsoon soundscapes, and 432Hz sitar binaural beats.
          </p>
        </div>

        {/* Stats Chips */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 text-center min-w-[100px]">
            <p className="text-xl font-bold font-mono text-emerald-400">
              {timerState.completedSessions}
            </p>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Sessions Done
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 text-center min-w-[100px]">
            <p className="text-xl font-bold font-mono text-teal-300">
              {Math.round((timerState.completedSessions * 25) / 60 * 10) / 10}h
            </p>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Focus Time
            </p>
          </div>
        </div>
      </div>

      {/* Main Focus Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pomodoro / Stopwatch Tool (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl p-6 sm:p-8 bg-white/[0.03] border border-white/10 backdrop-blur-2xl space-y-6">
          {/* Tab Selector */}
          <div className="flex items-center justify-center">
            <div className="p-1 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('pomodoro');
                  onSetTimerMode(timerState.mode, timerState.duration);
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'pomodoro'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Timer size={16} />
                <span>Pomodoro Mode</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('stopwatch');
                  onSetStopwatch();
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'stopwatch'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Clock size={16} />
                <span>Precision Stopwatch</span>
              </button>
            </div>
          </div>

          {/* POMODORO VIEW */}
          {activeTab === 'pomodoro' && (
            <div className="flex flex-col items-center space-y-6">
              {/* Presets Row */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => onSetTimerMode('work', 1500, '25/5')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    timerState.mode === 'work' && timerState.duration === 1500
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
                  }`}
                >
                  25m Deep Work
                </button>
                <button
                  onClick={() => onSetTimerMode('work', 3000, '50/10')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    timerState.mode === 'work' && timerState.duration === 3000
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
                  }`}
                >
                  50m Extended
                </button>
                <button
                  onClick={() => onSetTimerMode('work', 5400, '90min')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    timerState.mode === 'work' && timerState.duration === 5400
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
                  }`}
                >
                  90m Flow State
                </button>
                <button
                  onClick={() => onSetTimerMode('shortBreak', 300)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    timerState.mode === 'shortBreak'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
                  }`}
                >
                  5m Break ☕
                </button>
              </div>

              {/* Big Circular / Radial Timer Gauge */}
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-zinc-800"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-emerald-400 transition-all duration-1000"
                    strokeWidth="5"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-tighter">
                    {formatTimer(timerState.remaining)}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 mt-1">
                    {timerState.mode === 'work' ? 'Deep Work Focus' : 'Mind Refresh Break'}
                  </span>
                </div>
              </div>

              {/* Timer Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onToggleTimer}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95"
                >
                  {timerState.isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                  <span>{timerState.isRunning ? 'Pause Timer' : 'Start Focus Session'}</span>
                </button>

                <button
                  onClick={onResetTimer}
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all"
                  title="Reset Timer"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STOPWATCH VIEW WITH LAPS */}
          {activeTab === 'stopwatch' && (
            <div className="flex flex-col items-center space-y-6">
              <div className="p-8 rounded-3xl bg-black/40 border border-emerald-500/30 text-center w-full max-w-sm">
                <span className="text-5xl sm:text-6xl font-mono font-extrabold text-white tracking-tight">
                  {formatStopwatch(stopwatchSeconds)}
                </span>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mt-2">
                  Precision Task Stopwatch
                </p>
              </div>

              {/* Action Buttons: Start/Pause, Lap, Reset */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleStopwatch}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all"
                >
                  {isStopwatchRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                  <span>{isStopwatchRunning ? 'Stop' : 'Start'}</span>
                </button>

                <button
                  onClick={handleRecordLap}
                  disabled={!isStopwatchRunning}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-200 font-semibold text-xs transition-all disabled:opacity-30"
                >
                  <Flag size={15} />
                  <span>Lap</span>
                </button>

                <button
                  onClick={handleResetStopwatchAll}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all"
                  title="Reset Stopwatch"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              {/* Laps Table */}
              {laps.length > 0 && (
                <div className="w-full max-w-md space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar text-xs">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-400 px-3 pb-1 border-b border-white/10">
                    <span>Lap #</span>
                    <span>Lap Time</span>
                    <span>Overall</span>
                  </div>
                  {laps.map((lap) => (
                    <div
                      key={lap.lapNumber}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 font-mono text-zinc-200"
                    >
                      <span>Lap {lap.lapNumber}</span>
                      <span className="text-emerald-400">+{formatStopwatch(lap.lapTime)}</span>
                      <span>{formatStopwatch(lap.overallTime)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Layered Ambient Mixer & Sitar Lofi (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ambient Soundscapes Box */}
          <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 backdrop-blur-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Headphones size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Layered Ambient Mixer</h3>
              </div>
              <span className="text-[10px] text-zinc-400">Mix multi-tracks live</span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePreset('monsoon-chai')}
                className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-semibold text-zinc-300 transition-all text-left truncate"
              >
                🌧️ Monsoon Chai
              </button>
              <button
                onClick={() => handlePreset('deep-code')}
                className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-semibold text-zinc-300 transition-all text-left truncate"
              >
                🧠 Deep 432Hz Alpha
              </button>
              <button
                onClick={() => handlePreset('himalayan-zen')}
                className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-semibold text-zinc-300 transition-all text-left truncate"
              >
                🔔 Himalayan Zen
              </button>
              <button
                onClick={() => handlePreset('coastal-focus')}
                className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-semibold text-zinc-300 transition-all text-left truncate"
              >
                🌊 Goa Beach Waves
              </button>
            </div>

            {/* Sliders for each Layer */}
            <div className="space-y-3 pt-2">
              {[
                { key: 'rain', label: 'Monsoon Rain', icon: CloudRain, color: 'accent-cyan-400' },
                { key: 'cafe', label: 'Chai Stall & Cafe', icon: Coffee, color: 'accent-amber-400' },
                { key: 'fire', label: 'Campfire', icon: Flame, color: 'accent-orange-400' },
                { key: 'templeBell', label: 'Temple Bell & Om', icon: Bell, color: 'accent-yellow-400' },
                { key: 'waves', label: 'Ocean Waves', icon: Waves, color: 'accent-blue-400' },
                { key: 'whiteNoise', label: 'Alpha White Noise', icon: Volume2, color: 'accent-emerald-400' },
              ].map((sound) => {
                const Icon = sound.icon;
                const volume = (ambientSounds as any)[sound.key] || 0;
                return (
                  <div key={sound.key} className="flex items-center gap-3">
                    <Icon size={16} className={volume > 0 ? 'text-emerald-400' : 'text-zinc-400'} />
                    <span className="text-xs font-medium text-zinc-300 w-32 truncate">{sound.label}</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => handleSoundSlider(sound.key as any, parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                    <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sitar & Focus Lofi Playlist */}
          <div className="rounded-3xl p-5 bg-white/[0.03] border border-white/10 backdrop-blur-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-400" />
              <span>432Hz Focus & Sitar Lofi Tracks</span>
            </h3>
            <div className="space-y-2">
              {focusSongs.map((song) => {
                const isCurrent = currentSong?.id === song.id && isPlaying;
                return (
                  <div
                    key={song.id}
                    onClick={() => onPlaySong(song)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isCurrent
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={song.coverArt} alt={song.title} className="w-9 h-9 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{song.title}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{song.artist}</p>
                      </div>
                    </div>
                    {isCurrent ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
