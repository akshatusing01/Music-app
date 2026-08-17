type YouTubePlayerState = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
};

type PendingLoad = {
  videoId: string;
  startSeconds: number;
  autoplay: boolean;
  rate: number;
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

class YouTubePlayerController {
  private player: any = null;
  private apiPromise: Promise<void> | null = null;
  private host: HTMLElement | null = null;
  private videoId: string | null = null;
  private state: YouTubePlayerState = { currentTime: 0, duration: 0, isPlaying: false };
  private ticker: number | null = null;
  private ready = false;
  private pendingLoad: PendingLoad | null = null;
  private desiredPlaying = false;

  constructor() {
    window.addEventListener('syncbeat:room-playback', (event) => {
      this.applyRoomPlayback((event as CustomEvent<any>).detail).catch((error) => console.warn('Room playback sync failed', error));
    });
  }

  private emit(name: string, detail: unknown = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  private getAuthoritativePosition(payload: any) {
    const base = Math.max(0, Number(payload.position ?? payload.playbackPosition ?? 0));
    const rate = Math.max(0.25, Math.min(2, Number(payload.playbackRate ?? 1)));
    const updateAt = Number(payload.lastStateUpdate || 0);
    if (payload.isPlaying && updateAt > 0) {
      const networkElapsed = Math.max(0, (Date.now() - updateAt) / 1000);
      return base + networkElapsed * rate;
    }
    return base;
  }

  private async applyRoomPlayback(payload: any) {
    const song = payload.song;
    const remoteVideoId = song?.youtubeVideoId || null;
    const position = this.getAuthoritativePosition(payload);
    const rate = Math.max(0.25, Math.min(2, Number(payload.playbackRate ?? 1)));
    const shouldPlay = Boolean(payload.isPlaying);
    if (!remoteVideoId) return;

    if (this.videoId !== remoteVideoId) {
      await this.load(remoteVideoId, position, shouldPlay, rate);
      return;
    }

    if (!this.ready) {
      this.pendingLoad = { videoId: remoteVideoId, startSeconds: position, autoplay: shouldPlay, rate };
      return;
    }

    this.setRate(rate);
    const local = this.getCurrentTime();
    if (Math.abs(local - position) > 0.35) this.seek(position);
    if (shouldPlay && !this.isActuallyPlaying()) this.play();
    if (!shouldPlay && this.isActuallyPlaying()) this.pause();
  }

  private loadApi(): Promise<void> {
    if (window.YT?.Player) return Promise.resolve();
    if (this.apiPromise) return this.apiPromise;
    this.apiPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(); };
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => reject(new Error('Unable to load YouTube IFrame API'));
        document.head.appendChild(script);
      }
      window.setTimeout(() => {
        if (window.YT?.Player) resolve();
        else reject(new Error('YouTube IFrame API timed out'));
      }, 8000);
    });
    return this.apiPromise;
  }

  async mount(host: HTMLElement) {
    this.host = host;
    await this.loadApi();
    if (!this.host || !window.YT?.Player) return;
    if (!this.player) {
      this.player = new window.YT.Player(this.host, {
        width: '100%', height: '100%',
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, enablejsapi: 1, playsinline: 1, rel: 0, fs: 0, iv_load_policy: 3, origin: window.location.origin },
        events: {
          onReady: () => {
            this.ready = true;
            const iframe = this.host?.querySelector('iframe');
            if (iframe) iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
            this.emit('syncbeat:youtube-ready');
            this.flushPendingLoad();
          },
          onStateChange: (event: any) => {
            const playing = event.data === window.YT.PlayerState.PLAYING;
            const ended = event.data === window.YT.PlayerState.ENDED;
            this.state.isPlaying = playing;
            this.emit('syncbeat:youtube-state', { ...this.state, videoId: this.videoId });
            if (ended) { this.desiredPlaying = false; this.stopTicker(); this.emit('syncbeat:youtube-ended', { videoId: this.videoId }); }
            else if (playing) { this.desiredPlaying = true; this.startTicker(); }
            else this.stopTicker();
          },
          onAutoplayBlocked: () => {
            this.desiredPlaying = false;
            this.state.isPlaying = false;
            this.emit('syncbeat:youtube-autoplay-blocked', { videoId: this.videoId });
          },
          onError: (event: any) => {
            this.desiredPlaying = false;
            this.state.isPlaying = false;
            this.emit('syncbeat:youtube-error', { code: event.data, videoId: this.videoId });
          },
        },
      });
    }
  }

  async load(videoId: string, startSeconds = 0, autoplay = true, rate = 1) {
    await this.loadApi();
    this.videoId = videoId;
    this.desiredPlaying = autoplay;
    const request: PendingLoad = { videoId, startSeconds: Math.max(0, startSeconds), autoplay, rate: Math.max(0.25, Math.min(2, rate)) };
    if (!this.player || !this.ready) { this.pendingLoad = request; return; }
    this.applyLoad(request);
  }

  private applyLoad(request: PendingLoad) {
    if (!this.player) { this.pendingLoad = request; return; }
    this.pendingLoad = null;
    this.videoId = request.videoId;
    this.state.currentTime = request.startSeconds;
    this.state.isPlaying = false;
    this.player.setPlaybackRate?.(request.rate);
    this.emit('syncbeat:youtube-state', { ...this.state, videoId: this.videoId });
    if (request.autoplay) this.player.loadVideoById({ videoId: request.videoId, startSeconds: request.startSeconds });
    else this.player.cueVideoById({ videoId: request.videoId, startSeconds: request.startSeconds });
  }

  private flushPendingLoad() { if (this.pendingLoad) this.applyLoad(this.pendingLoad); }
  play() { this.desiredPlaying = true; if (!this.player || !this.ready) return; this.player.playVideo?.(); }
  pause() { this.desiredPlaying = false; this.player?.pauseVideo?.(); }
  seek(seconds: number) { const target = Math.max(0, seconds); this.player?.seekTo?.(target, true); this.state.currentTime = target; this.emit('syncbeat:youtube-position', { ...this.state, videoId: this.videoId }); }
  setRate(rate: number) { this.player?.setPlaybackRate?.(Math.max(0.25, Math.min(2, rate))); }
  setVolume(volume: number) { this.player?.setVolume?.(Math.round(Math.max(0, Math.min(1, volume)) * 100)); }
  mute() { this.player?.mute?.(); }
  unmute() { this.player?.unMute?.(); }
  getCurrentTime() { return typeof this.player?.getCurrentTime === 'function' ? Number(this.player.getCurrentTime() || 0) : this.state.currentTime; }
  getDuration() { return typeof this.player?.getDuration === 'function' ? Number(this.player.getDuration() || 0) : this.state.duration; }
  isActuallyPlaying() { return this.state.isPlaying; }
  private startTicker() { this.stopTicker(); this.ticker = window.setInterval(() => { this.state.currentTime = this.getCurrentTime(); this.state.duration = this.getDuration(); this.emit('syncbeat:youtube-position', { ...this.state, videoId: this.videoId }); }, 250); }
  private stopTicker() { if (this.ticker !== null) window.clearInterval(this.ticker); this.ticker = null; }
}

export const youtubePlayer = new YouTubePlayerController();
