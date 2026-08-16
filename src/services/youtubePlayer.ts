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

  private emit(name: string, detail: unknown = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  private loadApi(): Promise<void> {
    if (window.YT?.Player) return Promise.resolve();
    if (this.apiPromise) return this.apiPromise;
    this.apiPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
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
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            this.ready = true;
            this.emit('syncbeat:youtube-ready');
            this.flushPendingLoad();
          },
          onStateChange: (event: any) => {
            const playing = event.data === window.YT.PlayerState.PLAYING;
            const ended = event.data === window.YT.PlayerState.ENDED;
            this.state.isPlaying = playing;
            this.emit('syncbeat:youtube-state', { ...this.state });
            if (ended) {
              this.desiredPlaying = false;
              this.stopTicker();
              this.emit('syncbeat:youtube-ended', { videoId: this.videoId });
            } else if (playing) {
              this.desiredPlaying = true;
              this.startTicker();
            } else {
              this.stopTicker();
            }
          },
          onError: (event: any) => {
            this.desiredPlaying = false;
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
    const request: PendingLoad = {
      videoId,
      startSeconds: Math.max(0, startSeconds),
      autoplay,
      rate: Math.max(0.25, Math.min(2, rate)),
    };

    // React can request a track before the async iframe has finished mounting.
    // Keep the request and execute it from onReady instead of silently dropping it.
    if (!this.player || !this.ready) {
      this.pendingLoad = request;
      return;
    }

    this.applyLoad(request);
  }

  private applyLoad(request: PendingLoad) {
    if (!this.player) {
      this.pendingLoad = request;
      return;
    }

    this.pendingLoad = null;
    this.videoId = request.videoId;
    this.player.setPlaybackRate?.(request.rate);

    if (request.autoplay) {
      this.player.loadVideoById({
        videoId: request.videoId,
        startSeconds: request.startSeconds,
      });
    } else {
      this.player.cueVideoById({
        videoId: request.videoId,
        startSeconds: request.startSeconds,
      });
    }
  }

  private flushPendingLoad() {
    if (this.pendingLoad) this.applyLoad(this.pendingLoad);
    if (this.desiredPlaying) {
      // If the browser allowed the user's initiating gesture to reach the iframe,
      // this starts immediately. If autoplay is blocked, the explicit Play button
      // remains available and calls play() from a user gesture.
      window.setTimeout(() => this.player?.playVideo?.(), 0);
    }
  }

  play() {
    this.desiredPlaying = true;
    this.player?.playVideo?.();
  }

  pause() {
    this.desiredPlaying = false;
    this.player?.pauseVideo?.();
  }

  seek(seconds: number) {
    const target = Math.max(0, seconds);
    this.player?.seekTo?.(target, true);
    this.state.currentTime = target;
    this.emit('syncbeat:youtube-position', { ...this.state });
  }

  setRate(rate: number) {
    this.player?.setPlaybackRate?.(Math.max(0.25, Math.min(2, rate)));
  }

  setVolume(volume: number) {
    this.player?.setVolume?.(Math.round(Math.max(0, Math.min(1, volume)) * 100));
  }

  mute() { this.player?.mute?.(); }
  unmute() { this.player?.unMute?.(); }

  getCurrentTime() {
    return typeof this.player?.getCurrentTime === 'function'
      ? Number(this.player.getCurrentTime() || 0)
      : this.state.currentTime;
  }

  getDuration() {
    return typeof this.player?.getDuration === 'function'
      ? Number(this.player.getDuration() || 0)
      : this.state.duration;
  }

  private startTicker() {
    this.stopTicker();
    this.ticker = window.setInterval(() => {
      this.state.currentTime = this.getCurrentTime();
      this.state.duration = this.getDuration();
      this.emit('syncbeat:youtube-position', { ...this.state });
    }, 250);
  }

  private stopTicker() {
    if (this.ticker !== null) window.clearInterval(this.ticker);
    this.ticker = null;
  }
}

export const youtubePlayer = new YouTubePlayerController();
