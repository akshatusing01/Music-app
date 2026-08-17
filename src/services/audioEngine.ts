import { Song, EqualizerPreset, AmbientSounds, AudioQuality } from '../types';
import { persistenceService } from './persistenceService';

export class AudioEngine {
  private static instance: AudioEngine;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;
  private qualityFilter: BiquadFilterNode | null = null;

  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private playbackRate: number = 1.0;
  private startTrackTime: number = 0;
  private startContextTime: number = 0;
  private timerInterval: number | null = null;
  private onPositionUpdateCallbacks: Set<(pos: number) => void> = new Set();
  private onEndedCallbacks: Set<() => void> = new Set();

  private audioElement: HTMLAudioElement | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;
  private isUsingSyntheticFallback: boolean = false;

  private synthNodes: {
    oscillators: OscillatorNode[];
    gains: GainNode[];
    intervals: number[];
  } = { oscillators: [], gains: [], intervals: [] };

  private ambientNodes: {
    rainGain?: GainNode;
    cafeGain?: GainNode;
    fireGain?: GainNode;
    bellGain?: GainNode;
    wavesGain?: GainNode;
    noiseGain?: GainNode;
    sources?: (AudioNode | number)[];
  } = {};

  private quality: AudioQuality = 'high-320k';

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) AudioEngine.instance = new AudioEngine();
    return AudioEngine.instance;
  }

  public initContext() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    const eqFrequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    this.eqFilters = eqFrequencies.map((freq, i) => {
      const filter = this.ctx!.createBiquadFilter();
      filter.type = i === 0 ? 'lowshelf' : i === eqFrequencies.length - 1 ? 'highshelf' : 'peaking';
      if (filter.type === 'peaking') filter.Q.value = 1.4;
      filter.frequency.value = freq;
      filter.gain.value = 0;
      return filter;
    });

    this.qualityFilter = this.ctx.createBiquadFilter();
    this.qualityFilter.type = 'lowpass';
    this.updateQualityFilter();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.8;

    for (let i = 0; i < this.eqFilters.length - 1; i++) this.eqFilters[i].connect(this.eqFilters[i + 1]);
    const lastEq = this.eqFilters[this.eqFilters.length - 1];
    lastEq.connect(this.qualityFilter);
    this.qualityFilter.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.initAudioElement();
    this.initAmbientGenerators();
  }

  private initAudioElement() {
    if (this.audioElement || !this.ctx) return;
    try {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'auto';
      this.mediaElementSource = this.ctx.createMediaElementSource(this.audioElement);
      this.mediaElementSource.connect(this.eqFilters[0]);

      this.audioElement.addEventListener('ended', () => {
        this.pause();
        this.onEndedCallbacks.forEach((cb) => cb());
      });

      this.audioElement.addEventListener('error', (e) => {
        console.warn('Audio streaming error, falling back to procedural synthesizer:', e);
        if (this.currentSong && this.isPlaying && !this.isUsingSyntheticFallback) {
          this.isUsingSyntheticFallback = true;
          this.startSynthesizerForSong(this.currentSong);
        }
      });
    } catch (err) {
      console.warn('Could not initialize MediaElementAudioSourceNode:', err);
    }
  }

  public setQuality(quality: AudioQuality) { this.quality = quality; this.updateQualityFilter(); }

  private updateQualityFilter() {
    if (!this.qualityFilter || !this.ctx) return;
    const frequency = this.quality === 'data-saver-64k' ? 4500 : this.quality === 'normal-128k' ? 14000 : 22050;
    this.qualityFilter.frequency.setValueAtTime(frequency, this.ctx.currentTime);
  }

  public setVolume(volume: number) {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
  }

  public applyEqualizer(gains: number[]) {
    if (!this.eqFilters.length || !this.ctx) return;
    gains.forEach((gain, i) => { if (this.eqFilters[i]) this.eqFilters[i].gain.setValueAtTime(gain, this.ctx!.currentTime); });
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64).fill(0);
    const array = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(array);
    return array;
  }

  public getWaveformData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64).fill(128);
    const array = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(array);
    return array;
  }

  public onPositionChange(callback: (pos: number) => void) {
    this.onPositionUpdateCallbacks.add(callback);
    return () => this.onPositionUpdateCallbacks.delete(callback);
  }

  public onEnded(callback: () => void) {
    this.onEndedCallbacks.add(callback);
    return () => this.onEndedCallbacks.delete(callback);
  }

  public getCurrentPosition(): number {
    if (!this.isPlaying) return this.startTrackTime;
    if (this.audioElement && !this.isUsingSyntheticFallback && !isNaN(this.audioElement.currentTime)) return this.audioElement.currentTime;
    if (!this.ctx) return this.startTrackTime;
    const elapsed = (this.ctx.currentTime - this.startContextTime) * this.playbackRate;
    const pos = this.startTrackTime + elapsed;
    if (this.currentSong && pos >= this.currentSong.duration) return this.currentSong.duration;
    return Math.max(0, pos);
  }

  public async playSong(song: Song, startFromSeconds = 0, rate = 1.0) {
    this.initContext();
    if (this.ctx?.state === 'suspended') await this.ctx.resume();

    this.stopSynthesizer();
    this.currentSong = song;
    this.startTrackTime = Math.min(startFromSeconds, Math.max(0, song.duration - 0.5));
    this.playbackRate = rate;
    this.isPlaying = true;
    this.startContextTime = this.ctx!.currentTime;

    // Persist every real playback entry from the central playback path.
    // The persistence layer is intentionally best-effort and cannot interrupt playback.
    try {
      const source = song.youtubeVideoId ? 'search' : 'unknown';
      persistenceService.addHistory({ song, playedAt: Date.now(), source });
      window.dispatchEvent(new CustomEvent('syncbeat:history-updated', { detail: song.id }));
    } catch {
      // History must never block playback.
    }

    const streamUrl = song.audioUrl || (song.id ? `/api/audio/stream/${song.id}` : null);

    if (streamUrl && this.audioElement) {
      this.isUsingSyntheticFallback = false;
      try {
        if (this.audioElement.src !== window.location.origin + streamUrl && this.audioElement.src !== streamUrl) {
          this.audioElement.src = streamUrl;
          this.audioElement.load();
        }
        this.audioElement.playbackRate = rate;
        this.audioElement.currentTime = this.startTrackTime;
        await this.audioElement.play();
      } catch (err) {
        console.warn('Direct stream playback encountered issue, activating procedural synthesizer:', err);
        this.isUsingSyntheticFallback = true;
        this.startSynthesizerForSong(song);
      }
    } else {
      this.isUsingSyntheticFallback = true;
      this.startSynthesizerForSong(song);
    }
    this.startTimerTicker();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.startTrackTime = this.getCurrentPosition();
    this.isPlaying = false;
    if (this.audioElement && !this.isUsingSyntheticFallback) this.audioElement.pause();
    this.stopSynthesizer();
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  public resume() {
    if (this.currentSong && !this.isPlaying) this.playSong(this.currentSong, this.startTrackTime, this.playbackRate);
  }

  public seek(seconds: number) {
    if (!this.currentSong) return;
    const target = Math.max(0, Math.min(seconds, this.currentSong.duration));
    this.startTrackTime = target;
    if (this.ctx) this.startContextTime = this.ctx.currentTime;
    if (this.audioElement && !this.isUsingSyntheticFallback) {
      try { this.audioElement.currentTime = target; } catch {}
    }
    if (this.isPlaying && this.isUsingSyntheticFallback) {
      this.stopSynthesizer();
      this.startSynthesizerForSong(this.currentSong);
    }
    this.notifyPosition(target);
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.audioElement) this.audioElement.playbackRate = rate;
    if (this.isPlaying) {
      const cur = this.getCurrentPosition();
      this.startTrackTime = cur;
      if (this.ctx) this.startContextTime = this.ctx.currentTime;
    }
  }

  private startTimerTicker() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.currentSong) return;
      const pos = this.getCurrentPosition();
      this.notifyPosition(pos);
      if (pos >= this.currentSong.duration) {
        this.pause();
        this.onEndedCallbacks.forEach((cb) => cb());
      }
    }, 100);
  }

  private notifyPosition(pos: number) { this.onPositionUpdateCallbacks.forEach((cb) => cb(pos)); }

  private startSynthesizerForSong(song: Song) {
    if (!this.ctx || !this.eqFilters.length) return;
    const firstEq = this.eqFilters[0];
    const bpm = song.bpm || 90;
    const beatInterval = (60 / bpm) * 1000;
    const scaleAcoustic = [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25];
    const scaleBolly = [220, 246.94, 277.18, 293.66, 329.63, 369.99, 440];
    const scalePhonk = [110, 130.81, 146.83, 155.56, 164.81, 220];
    const scaleLofi = [216, 256.8, 288.3, 324.0, 384.8, 432];
    const preset = song.audioSynthPreset || 'bollywood-strings';

    const padOsc = this.ctx.createOscillator();
    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    if (preset === 'gym-bass') { padOsc.type = 'sawtooth'; padOsc.frequency.setValueAtTime(55, this.ctx.currentTime); }
    else if (preset === 'lofi-rhodes') { padOsc.type = 'triangle'; padOsc.frequency.setValueAtTime(108, this.ctx.currentTime); }
    else if (preset === 'ambient-flute') { padOsc.type = 'sine'; padOsc.frequency.setValueAtTime(216, this.ctx.currentTime); }
    else { padOsc.type = 'sine'; padOsc.frequency.setValueAtTime(110, this.ctx.currentTime); }
    padOsc.connect(padGain); padGain.connect(firstEq); padOsc.start();
    this.synthNodes.oscillators.push(padOsc); this.synthNodes.gains.push(padGain);

    let stepIndex = 0;
    const currentScale = preset === 'gym-bass' ? scalePhonk : preset === 'lofi-rhodes' ? scaleLofi : preset === 'ambient-flute' ? scaleLofi : scaleBolly;
    const arpInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || this.ctx.state !== 'running') return;
      const noteFreq = currentScale[stepIndex % currentScale.length]; stepIndex++;
      const noteOsc = this.ctx.createOscillator(); const noteGain = this.ctx.createGain();
      noteOsc.type = preset === 'gym-bass' || preset === 'tamil-kuthu' || preset === 'edm-synth' ? (stepIndex % 2 === 0 ? 'sawtooth' : 'square') : preset === 'acoustic-guitar' || preset === 'bollywood-strings' ? 'triangle' : 'sine';
      noteOsc.frequency.setValueAtTime(noteFreq, this.ctx.currentTime);
      const now = this.ctx.currentTime;
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + (beatInterval / 1000) * 0.9);
      noteOsc.connect(noteGain); noteGain.connect(firstEq); noteOsc.start(now); noteOsc.stop(now + beatInterval / 1000);
    }, beatInterval / (preset === 'gym-bass' || preset === 'tamil-kuthu' ? 4 : 2));
    this.synthNodes.intervals.push(arpInterval);

    if (preset === 'gym-bass' || preset === 'tamil-kuthu' || preset === 'edm-synth') {
      const drumInterval = window.setInterval(() => {
        if (!this.isPlaying || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const kickOsc = this.ctx.createOscillator(); const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(140, now); kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
        kickGain.gain.setValueAtTime(0.3, now); kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        kickOsc.connect(kickGain); kickGain.connect(firstEq); kickOsc.start(now); kickOsc.stop(now + 0.16);
      }, beatInterval);
      this.synthNodes.intervals.push(drumInterval);
    }
  }

  private stopSynthesizer() {
    this.synthNodes.intervals.forEach((id) => clearInterval(id));
    this.synthNodes.intervals = [];
    this.synthNodes.oscillators.forEach((osc) => { try { osc.stop(); osc.disconnect(); } catch {} });
    this.synthNodes.oscillators = [];
    this.synthNodes.gains.forEach((g) => { try { g.disconnect(); } catch {} });
    this.synthNodes.gains = [];
  }

  private initAmbientGenerators() {
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const createNoiseSource = () => { const whiteNoise = this.ctx!.createBufferSource(); whiteNoise.buffer = noiseBuffer; whiteNoise.loop = true; return whiteNoise; };

    const rainFilter = this.ctx.createBiquadFilter(); rainFilter.type = 'bandpass'; rainFilter.frequency.value = 1100; rainFilter.Q.value = 0.8;
    this.ambientNodes.rainGain = this.ctx.createGain(); this.ambientNodes.rainGain.gain.value = 0;
    const rainNoise = createNoiseSource(); rainNoise.connect(rainFilter); rainFilter.connect(this.ambientNodes.rainGain); this.ambientNodes.rainGain.connect(this.ctx.destination); rainNoise.start();

    const cafeFilter = this.ctx.createBiquadFilter(); cafeFilter.type = 'lowpass'; cafeFilter.frequency.value = 500;
    this.ambientNodes.cafeGain = this.ctx.createGain(); this.ambientNodes.cafeGain.gain.value = 0;
    const cafeNoise = createNoiseSource(); cafeNoise.connect(cafeFilter); cafeFilter.connect(this.ambientNodes.cafeGain); this.ambientNodes.cafeGain.connect(this.ctx.destination); cafeNoise.start();

    const fireFilter = this.ctx.createBiquadFilter(); fireFilter.type = 'highpass'; fireFilter.frequency.value = 2400;
    this.ambientNodes.fireGain = this.ctx.createGain(); this.ambientNodes.fireGain.gain.value = 0;
    const fireNoise = createNoiseSource(); fireNoise.connect(fireFilter); fireFilter.connect(this.ambientNodes.fireGain); this.ambientNodes.fireGain.connect(this.ctx.destination); fireNoise.start();

    this.ambientNodes.bellGain = this.ctx.createGain(); this.ambientNodes.bellGain.gain.value = 0; this.ambientNodes.bellGain.connect(this.ctx.destination);

    const waveFilter = this.ctx.createBiquadFilter(); waveFilter.type = 'lowpass'; waveFilter.frequency.value = 350;
    this.ambientNodes.wavesGain = this.ctx.createGain(); this.ambientNodes.wavesGain.gain.value = 0;
    const waveNoise = createNoiseSource(); waveNoise.connect(waveFilter); waveFilter.connect(this.ambientNodes.wavesGain); this.ambientNodes.wavesGain.connect(this.ctx.destination); waveNoise.start();

    this.ambientNodes.noiseGain = this.ctx.createGain(); this.ambientNodes.noiseGain.gain.value = 0;
    const pureWhite = createNoiseSource(); pureWhite.connect(this.ambientNodes.noiseGain); this.ambientNodes.noiseGain.connect(this.ctx.destination); pureWhite.start();
  }

  public setAmbientVolumes(ambient: AmbientSounds) {
    this.initContext(); if (!this.ctx) return; const now = this.ctx.currentTime;
    if (this.ambientNodes.rainGain) this.ambientNodes.rainGain.gain.setTargetAtTime(ambient.rain * 0.4, now, 0.1);
    if (this.ambientNodes.cafeGain) this.ambientNodes.cafeGain.gain.setTargetAtTime(ambient.cafe * 0.35, now, 0.1);
    if (this.ambientNodes.fireGain) this.ambientNodes.fireGain.gain.setTargetAtTime(ambient.fire * 0.25, now, 0.1);
    if (this.ambientNodes.wavesGain) this.ambientNodes.wavesGain.gain.setTargetAtTime(ambient.waves * 0.4, now, 0.1);
    if (this.ambientNodes.noiseGain) this.ambientNodes.noiseGain.gain.setTargetAtTime(ambient.whiteNoise * 0.2, now, 0.1);
    if (this.ambientNodes.bellGain) this.ambientNodes.bellGain.gain.setTargetAtTime(ambient.templeBell * 0.3, now, 0.1);
  }

  public playTempleBellSound() {
    this.initContext(); if (!this.ctx) return; const now = this.ctx.currentTime;
    [432, 864, 1296].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator(); const gain = this.ctx!.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15 / (idx + 1), now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
      osc.connect(gain); gain.connect(this.ctx!.destination); osc.start(now); osc.stop(now + 4.6);
    });
  }

  public playReactionSound(soundName: string) {
    this.initContext(); if (!this.ctx) return; const now = this.ctx.currentTime;
    if (soundName === 'dholak' || soundName === 'bass') {
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(180, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
      gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain); gain.connect(this.ctx.destination); osc.start(now); osc.stop(now + 0.36);
    } else if (soundName === 'heart' || soundName === 'sparkle') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator(); const gain = this.ctx!.createGain(); osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06); gain.gain.setValueAtTime(0.12, now + i * 0.06); gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
        osc.connect(gain); gain.connect(this.ctx!.destination); osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.42);
      });
    } else if (soundName === 'fire' || soundName === 'cheer') {
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now); osc.frequency.linearRampToValueAtTime(880, now + 0.25);
      gain.gain.setValueAtTime(0.18, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain); gain.connect(this.ctx.destination); osc.start(now); osc.stop(now + 0.32);
    }
  }

  public cacheSongLocally(song: Song) {
    try { localStorage.setItem(`syncbeat_cached_track_${song.id}`, JSON.stringify({ ...song, cachedAt: Date.now() })); }
    catch (e) { console.warn('LocalStorage full, unable to cache audio track', e); }
  }
}

export const audioEngine = AudioEngine.getInstance();
