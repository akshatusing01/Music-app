type YouTubePlayerState = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
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
        playerVars: { autoplay: 0, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
        events: {
          onReady: () => this.emit('syncbeat:youtube-ready'),
          onStateChange: (event: any) => {
            const playing = event.data === window.YT.PlayerState.PLAYING;
            const ended = event.data === window.YT.PlayerState.ENDED;
            this.state.isPlaying = playing;
            this.emit('syncbeat:youtube-state', { ...this.state });
            if (ended) {
              this.stopTicker();
              this.emit('syncbeat:youtube-ended', { videoId: this.videoId });
            } else if (playing) this.startTicker();
            else this.stopTicker();
          },
          onError: (event: any) => this.emit('syncbeat:youtube-error', { code: event.data, videoId: this.videoId }),
        },
      });
    }
  }

  async load(videoId: string, startSeconds = 0, autoplay = true, rate = 1) {
    await this.loadApi();
    this.videoId = videoId;
    if (!this.player) return;
    this.player.setPlaybackRate?.(rate);
    if (autoplay) this.player.loadVideoById({ videoId, startSeconds });
    else this.player.cueVideoById({ videoId, startSeconds });
  }

  play() { this.player?.playVideo?.(); }
  pause() { this.player?.pauseVideo?.(); }
  seek(seconds: number) { this.player?.seekTo?.(Math.max(0, seconds), true); }
  setRate(rate: number) { this.player?.setPlaybackRate?.(rate); }
  setVolume(volume: number) { this.player?.setVolume?.(Math.round(Math.max(0, Math.min(1, volume)) * 100)); }
  mute() { this.player?.mute?.(); }
  unmute() { this.player?.unMute?.(); }

  getCurrentTime() {
    return typeof this.player?.getCurrentTime === 'function' ? this.player.getCurrentTime() : this.state.currentTime;
  }
  getDuration() {
    return typeof this.player?.getDuration === 'function' ? this.player.getDuration() : this.state.duration;
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
    if (this.ticker) window.clearInterval(this.ticker);
    this.ticker = null;
  }
}

export const youtubePlayer = new YouTubePlayerController();
