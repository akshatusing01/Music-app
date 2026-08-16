import { Song, EqualizerPreset, AmbientSounds, AudioQuality } from '../types';

export class AudioEngine {
  private static instance: AudioEngine;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;
  private qualityFilter: BiquadFilterNode | null = null;

  // Active playback state
  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private playbackRate: number = 1.0;
  private startTrackTime: number = 0; // offset in track (seconds)
  private startContextTime: number = 0; // audioContext.currentTime when started
  private timerInterval: number | null = null;
  private onPositionUpdateCallbacks: Set<(pos: number) => void> = new Set();
  private onEndedCallbacks: Set<() => void> = new Set();

  // Media Element streaming
  private audioElement: HTMLAudioElement | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;
  private isUsingSyntheticFallback: boolean = false;

  // Synthetic Music Engine Nodes
  private synthNodes: {
    oscillators: OscillatorNode[];
    gains: GainNode[];
    intervals: number[];
  } = { oscillators: [], gains: [], intervals: [] };

  // Ambient focus sound generators
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

  private constructor() {
    // Lazy initialized on first user interaction to comply with browser audio autoplay policy
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public initContext() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // 10-Band Graphic Equalizer Frequencies: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
    const eqFrequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    this.eqFilters = eqFrequencies.map((freq, i) => {
      const filter = this.ctx!.createBiquadFilter();
      if (i === 0) {
        filter.type = 'lowshelf';
      } else if (i === eqFrequencies.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.4;
      }
      filter.frequency.value = freq;
      filter.gain.value = 0;
      return filter;
    });

    // Quality Filter (Data Saver / Bandwidth Optimization)
    this.qualityFilter = this.ctx.createBiquadFilter();
    this.qualityFilter.type = 'lowpass';
    this.updateQualityFilter();

    // Analyser Node for Visualizers
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.8;

    // Chain: Synth/Track -> EQ[0] -> EQ[1] ... -> QualityFilter -> MasterGain -> Analyser -> Destination
    for (let i = 0; i < this.eqFilters.length - 1; i++) {
      this.eqFilters[i].connect(this.eqFilters[i + 1]);
    }
    const lastEq = this.eqFilters[this.eqFilters.length - 1];
    lastEq.connect(this.qualityFilter);
    this.qualityFilter.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Create reusable HTMLAudioElement connected to Web Audio graph
    this.initAudioElement();

    // Initialize ambient focus generators
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

  public setQuality(quality: AudioQuality) {
    this.quality = quality;
    this.updateQualityFilter();
  }

  private updateQualityFilter() {
    if (!this.qualityFilter || !this.ctx) return;
    if (this.quality === 'data-saver-64k') {
      this.qualityFilter.frequency.setValueAtTime(4500, this.ctx.currentTime); // low bandwidth mode
    } else if (this.quality === 'normal-128k') {
      this.qualityFilter.frequency.setValueAtTime(14000, this.ctx.currentTime);
    } else {
      this.qualityFilter.frequency.setValueAtTime(22050, this.ctx.currentTime); // Hi-Res
    }
  }

  public setVolume(volume: number) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
  }

  public applyEqualizer(gains: number[]) {
    if (!this.eqFilters.length || !this.ctx) return;
    gains.forEach((gain, i) => {
      if (this.eqFilters[i]) {
        this.eqFilters[i].gain.setValueAtTime(gain, this.ctx!.currentTime);
      }
    });
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(64).fill(0);
    }
    const array = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(array);
    return array;
  }

  public getWaveformData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(64).fill(128);
    }
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
    if (this.audioElement && !this.isUsingSyntheticFallback && !isNaN(this.audioElement.currentTime)) {
      return this.audioElement.currentTime;
    }
    if (!this.ctx) return this.startTrackTime;
    const elapsed = (this.ctx.currentTime - this.startContextTime) * this.playbackRate;
    const pos = this.startTrackTime + elapsed;
    if (this.currentSong && pos >= this.currentSong.duration) {
      return this.currentSong.duration;
    }
    return Math.max(0, pos);
  }

  public async playSong(song: Song, startFromSeconds = 0, rate = 1.0) {
    this.initContext();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }

    this.stopSynthesizer();
    this.currentSong = song;
    this.startTrackTime = Math.min(startFromSeconds, song.duration - 0.5);
    this.playbackRate = rate;
    this.isPlaying = true;
    this.startContextTime = this.ctx!.currentTime;

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
    if (this.audioElement && !this.isUsingSyntheticFallback) {
      this.audioElement.pause();
    }
    this.stopSynthesizer();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public resume() {
    if (this.currentSong && !this.isPlaying) {
      this.playSong(this.currentSong, this.startTrackTime, this.playbackRate);
    }
  }

  public seek(seconds: number) {
    if (!this.currentSong) return;
    const target = Math.max(0, Math.min(seconds, this.currentSong.duration));
    this.startTrackTime = target;
    if (this.ctx) {
      this.startContextTime = this.ctx.currentTime;
    }
    if (this.audioElement && !this.isUsingSyntheticFallback) {
      try {
        this.audioElement.currentTime = target;
      } catch (e) {
        // ignore seek during load
      }
    }
    if (this.isPlaying && this.isUsingSyntheticFallback) {
      this.stopSynthesizer();
      this.startSynthesizerForSong(this.currentSong);
    }
    this.notifyPosition(target);
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
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

  private notifyPosition(pos: number) {
    this.onPositionUpdateCallbacks.forEach((cb) => cb(pos));
  }

  // --- Procedural High-Fidelity Audio Synthesizer ---
  // Generates pleasing, authentic harmonious music (Bollywood chords, Sitar Lofi, Trap 808s, Acoustic Guitar arpeggios, Flute pads)
  private startSynthesizerForSong(song: Song) {
    if (!this.ctx || !this.eqFilters.length) return;

    const firstEq = this.eqFilters[0];
    const bpm = song.bpm || 90;
    const beatInterval = (60 / bpm) * 1000;

    // Musical Scale Frequencies (A4 = 440Hz standard & 432Hz tuning)
    const scaleAcoustic = [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25]; // A minor / C major
    const scaleBolly = [220, 246.94, 277.18, 293.66, 329.63, 369.99, 440]; // Raga Yaman / D Major
    const scalePhonk = [110, 130.81, 146.83, 155.56, 164.81, 220]; // Dark Phonk / Trap Minor
    const scaleLofi = [216, 256.8, 288.3, 324.0, 384.8, 432]; // 432Hz Alpha Ambient

    const preset = song.audioSynthPreset || 'bollywood-strings';

    // 1. Bass / Pad Foundation Oscillator
    const padOsc = this.ctx.createOscillator();
    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    if (preset === 'gym-bass') {
      padOsc.type = 'sawtooth';
      padOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Deep A1 Sub-bass
    } else if (preset === 'lofi-rhodes') {
      padOsc.type = 'triangle';
      padOsc.frequency.setValueAtTime(108, this.ctx.currentTime); // Warm low end
    } else if (preset === 'ambient-flute') {
      padOsc.type = 'sine';
      padOsc.frequency.setValueAtTime(216, this.ctx.currentTime);
    } else {
      padOsc.type = 'sine';
      padOsc.frequency.setValueAtTime(110, this.ctx.currentTime);
    }

    padOsc.connect(padGain);
    padGain.connect(firstEq);
    padOsc.start();

    this.synthNodes.oscillators.push(padOsc);
    this.synthNodes.gains.push(padGain);

    // 2. Rhythmic Arpeggiator / Beat Pulse
    let stepIndex = 0;
    const currentScale =
      preset === 'gym-bass'
        ? scalePhonk
        : preset === 'lofi-rhodes'
        ? scaleLofi
        : preset === 'ambient-flute'
        ? scaleLofi
        : scaleBolly;

    const arpInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || this.ctx.state !== 'running') return;

      const noteFreq = currentScale[stepIndex % currentScale.length];
      stepIndex++;

      const noteOsc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      if (preset === 'gym-bass' || preset === 'tamil-kuthu' || preset === 'edm-synth') {
        noteOsc.type = stepIndex % 2 === 0 ? 'sawtooth' : 'square';
      } else if (preset === 'acoustic-guitar' || preset === 'bollywood-strings') {
        noteOsc.type = 'triangle';
      } else {
        noteOsc.type = 'sine';
      }

      noteOsc.frequency.setValueAtTime(noteFreq, this.ctx.currentTime);

      // Attack - Decay envelope
      const now = this.ctx.currentTime;
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + (beatInterval / 1000) * 0.9);

      noteOsc.connect(noteGain);
      noteGain.connect(firstEq);

      noteOsc.start(now);
      noteOsc.stop(now + (beatInterval / 1000));
    }, beatInterval / (preset === 'gym-bass' || preset === 'tamil-kuthu' ? 4 : 2));

    this.synthNodes.intervals.push(arpInterval);

    // 3. Percussive kick & snare rhythm (for Gym, Party, Kuthu)
    if (preset === 'gym-bass' || preset === 'tamil-kuthu' || preset === 'edm-synth') {
      const drumInterval = window.setInterval(() => {
        if (!this.isPlaying || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;

        // Kick Drum
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

        kickGain.gain.setValueAtTime(0.3, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        kickOsc.connect(kickGain);
        kickGain.connect(firstEq);
        kickOsc.start(now);
        kickOsc.stop(now + 0.16);
      }, beatInterval);
      this.synthNodes.intervals.push(drumInterval);
    }
  }

  private stopSynthesizer() {
    this.synthNodes.intervals.forEach((id) => clearInterval(id));
    this.synthNodes.intervals = [];

    this.synthNodes.oscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.synthNodes.oscillators = [];

    this.synthNodes.gains.forEach((g) => {
      try {
        g.disconnect();
      } catch (e) {}
    });
    this.synthNodes.gains = [];
  }

  // --- Ambient Focus Sounds Generator ---
  private initAmbientGenerators() {
    if (!this.ctx) return;

    // Helper: Buffer Noise Source
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const createNoiseSource = () => {
      const whiteNoise = this.ctx!.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      return whiteNoise;
    };

    // 1. Monsoon Rain (Bandpassed Pink Noise)
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1100;
    rainFilter.Q.value = 0.8;
    this.ambientNodes.rainGain = this.ctx.createGain();
    this.ambientNodes.rainGain.gain.value = 0;

    const rainNoise = createNoiseSource();
    rainNoise.connect(rainFilter);
    rainFilter.connect(this.ambientNodes.rainGain);
    this.ambientNodes.rainGain.connect(this.ctx.destination);
    rainNoise.start();

    // 2. Chai & Cafe (Warm Lowpass Noise)
    const cafeFilter = this.ctx.createBiquadFilter();
    cafeFilter.type = 'lowpass';
    cafeFilter.frequency.value = 500;
    this.ambientNodes.cafeGain = this.ctx.createGain();
    this.ambientNodes.cafeGain.gain.value = 0;

    const cafeNoise = createNoiseSource();
    cafeNoise.connect(cafeFilter);
    cafeFilter.connect(this.ambientNodes.cafeGain);
    this.ambientNodes.cafeGain.connect(this.ctx.destination);
    cafeNoise.start();

    // 3. Campfire Crackle
    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'highpass';
    fireFilter.frequency.value = 2400;
    this.ambientNodes.fireGain = this.ctx.createGain();
    this.ambientNodes.fireGain.gain.value = 0;

    const fireNoise = createNoiseSource();
    fireNoise.connect(fireFilter);
    fireFilter.connect(this.ambientNodes.fireGain);
    this.ambientNodes.fireGain.connect(this.ctx.destination);
    fireNoise.start();

    // 4. Temple Bells / Singing Bowls
    this.ambientNodes.bellGain = this.ctx.createGain();
    this.ambientNodes.bellGain.gain.value = 0;
    this.ambientNodes.bellGain.connect(this.ctx.destination);

    // 5. Ocean Waves (Low frequency sweep)
    const waveFilter = this.ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.value = 350;
    this.ambientNodes.wavesGain = this.ctx.createGain();
    this.ambientNodes.wavesGain.gain.value = 0;

    const waveNoise = createNoiseSource();
    waveNoise.connect(waveFilter);
    waveFilter.connect(this.ambientNodes.wavesGain);
    this.ambientNodes.wavesGain.connect(this.ctx.destination);
    waveNoise.start();

    // 6. White Noise (Alpha)
    this.ambientNodes.noiseGain = this.ctx.createGain();
    this.ambientNodes.noiseGain.gain.value = 0;
    const pureWhite = createNoiseSource();
    pureWhite.connect(this.ambientNodes.noiseGain);
    this.ambientNodes.noiseGain.connect(this.ctx.destination);
    pureWhite.start();
  }

  public setAmbientVolumes(ambient: AmbientSounds) {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (this.ambientNodes.rainGain) {
      this.ambientNodes.rainGain.gain.setTargetAtTime(ambient.rain * 0.4, now, 0.1);
    }
    if (this.ambientNodes.cafeGain) {
      this.ambientNodes.cafeGain.gain.setTargetAtTime(ambient.cafe * 0.35, now, 0.1);
    }
    if (this.ambientNodes.fireGain) {
      this.ambientNodes.fireGain.gain.setTargetAtTime(ambient.fire * 0.25, now, 0.1);
    }
    if (this.ambientNodes.wavesGain) {
      this.ambientNodes.wavesGain.gain.setTargetAtTime(ambient.waves * 0.4, now, 0.1);
    }
    if (this.ambientNodes.noiseGain) {
      this.ambientNodes.noiseGain.gain.setTargetAtTime(ambient.whiteNoise * 0.2, now, 0.1);
    }
    if (this.ambientNodes.bellGain) {
      this.ambientNodes.bellGain.gain.setTargetAtTime(ambient.templeBell * 0.3, now, 0.1);
    }
  }

  // Ring a meditative temple bell once
  public playTempleBellSound() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Harmonic singing bowl frequencies: 432Hz, 864Hz, 1296Hz
    [432, 864, 1296].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 4.6);
    });
  }

  // Reaction sound effects: Dholak beat, Bass drop, Heart chime, Party cheer
  public playReactionSound(soundName: string) {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (soundName === 'dholak' || soundName === 'bass') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (soundName === 'heart' || soundName === 'sparkle') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.12, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.42);
      });
    } else if (soundName === 'fire' || soundName === 'cheer') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    }
  }

  public cacheSongLocally(song: Song) {
    try {
      const key = `syncbeat_cached_track_${song.id}`;
      localStorage.setItem(key, JSON.stringify({ ...song, cachedAt: Date.now() }));
    } catch (e) {
      console.warn('LocalStorage full, unable to cache audio track', e);
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
