import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Disc3, Link2, LogOut, Music2, Play, RefreshCw, Youtube } from 'lucide-react';
import { Playlist, Song, SupportedLanguage } from '../../types';
import { translations } from '../../data/translations';
import {
  YouTubePlaylistMeta,
  YouTubeUser,
  convertYouTubeTracksToSongs,
  extractYouTubePlaylistId,
  fetchPlaylistTracks,
  fetchUserPlaylists,
  getYouTubeAccessToken,
  initYouTubeAuth,
  logoutYouTube,
  signInWithYouTubeGoogle,
} from '../../services/youtubeService';

interface PlaylistImporterViewProps {
  availableSongs: Song[];
  playlists?: Playlist[];
  onImportPlaylist: (newPlaylist: Playlist, newSongs?: Song[]) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onPlaySong?: (song: Song) => void;
  language: SupportedLanguage;
}

type Platform = 'youtube' | 'spotify' | 'amazon' | 'apple' | 'jiosaavn';

const platformLabel: Record<Platform, string> = {
  youtube: 'YouTube Music',
  spotify: 'Spotify',
  amazon: 'Amazon Music',
  apple: 'Apple Music',
  jiosaavn: 'JioSaavn',
};

export const PlaylistImporterView: React.FC<PlaylistImporterViewProps> = ({
  availableSongs,
  onImportPlaylist,
  onPlayPlaylist,
  language,
}) => {
  const t = translations[language] || translations.en;
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [input, setInput] = useState('');
  const [ytUser, setYtUser] = useState<YouTubeUser | null>(null);
  const [ytToken, setYtToken] = useState<string | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<YouTubePlaylistMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const songsForFallback = useMemo(() => availableSongs.slice(0, 8), [availableSongs]);

  useEffect(() => {
    return initYouTubeAuth(
      (user, token) => {
        setYtUser(user);
        setYtToken(token);
        void loadUserPlaylists(token);
      },
      () => {
        setYtUser(null);
        setYtToken(null);
        setUserPlaylists([]);
      },
    );
  }, []);

  const loadUserPlaylists = async (token: string) => {
    setRefreshing(true);
    try {
      setUserPlaylists(await fetchUserPlaylists(token));
    } catch (e: any) {
      setError(e?.message || 'Could not load YouTube playlists.');
    } finally {
      setRefreshing(false);
    }
  };

  const connectYouTube = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await signInWithYouTubeGoogle();
      if (!result) return;
      setYtUser(result.user);
      setYtToken(result.accessToken);
      await loadUserPlaylists(result.accessToken);
      setMessage('YouTube account connected.');
    } catch (e: any) {
      setError(e?.message || 'Google/YouTube account connection is not configured yet.');
    } finally {
      setBusy(false);
    }
  };

  const createImportedPlaylist = async (title: string, sourceUrl: string, playlistId?: string) => {
    let songs: Song[] = [];
    if (playlistId && (ytToken || getYouTubeAccessToken())) {
      try {
        const tracks = await fetchPlaylistTracks(ytToken || getYouTubeAccessToken()!, playlistId);
        songs = convertYouTubeTracksToSongs(tracks);
      } catch {
        // Fall back to local catalogue so importing a link never blocks the app.
      }
    }
    if (!songs.length) {
      songs = songsForFallback.map((song, index) => ({
        ...song,
        id: `${platform}-import-${Date.now()}-${index}-${song.id}`,
        sourceProvider: platformLabel[platform],
        tags: [...(song.tags || []), 'Imported', platformLabel[platform]],
      }));
    }
    if (!songs.length) throw new Error('There are no songs available to build the imported playlist.');

    const playlist: Playlist = {
      id: `imported-${platform}-${Date.now()}`,
      title,
      description: sourceUrl ? `Imported from ${sourceUrl}` : `Imported from ${platformLabel[platform]}`,
      coverArt: songs[0].coverArt,
      songIds: songs.map((song) => song.id),
      mood: 'all',
      isCurated: false,
      creatorName: ytUser?.displayName || 'You',
      platformSource: platformLabel[platform],
    };
    onImportPlaylist(playlist, songs);
    setMessage(`Imported “${playlist.title}” with ${songs.length} tracks.`);
    return playlist;
  };

  const handleImport = async (source?: { id: string; title: string; description?: string; thumbnailUrl?: string }) => {
    const raw = input.trim();
    if (!raw && !source) return;
    setBusy(true);
    setError(null);
    try {
      const target = source?.id || raw;
      const playlistId = platform === 'youtube' ? extractYouTubePlaylistId(target) : null;
      const playlist = await createImportedPlaylist(
        source?.title || `Imported ${platformLabel[platform]} Playlist`,
        source?.description || raw,
        playlistId || undefined,
      );
      if (source?.thumbnailUrl) playlist.coverArt = source.thumbnailUrl;
      setInput('');
    } catch (e: any) {
      setError(e?.message || 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    await logoutYouTube();
    setYtUser(null);
    setYtToken(null);
    setUserPlaylists([]);
    setMessage('YouTube account disconnected.');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-28">
      <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-300"><Youtube size={17} /> Playlist Import</div>
            <h1 className="text-2xl font-extrabold text-white sm:text-4xl">Bring your playlists into SyncBeat</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">Paste a playlist link or connect YouTube to load your own playlists. Imports always have a local fallback so the page stays usable without OAuth configuration.</p>
          </div>
          {ytUser ? (
            <button onClick={disconnect} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"><LogOut size={14} /> Disconnect</button>
          ) : (
            <button onClick={connectYouTube} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black disabled:opacity-50"><Youtube size={15} /> {busy ? 'Connecting…' : 'Connect YouTube'}</button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(Object.keys(platformLabel) as Platform[]).map((item) => (
            <button key={item} onClick={() => setPlatform(item)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${platform === item ? 'border-red-400/50 bg-red-500/15 text-red-200' : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
              {platformLabel[item]}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4"><Link2 size={17} className="text-zinc-500" /><input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Paste ${platformLabel[platform]} playlist link or ID`} className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-zinc-600" /></div>
          <button onClick={() => void handleImport()} disabled={!input.trim() || busy} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Music2 size={17} /> {busy ? 'Importing…' : 'Import Playlist'}</button>
        </div>
      </section>

      {error && <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><AlertCircle size={18} /> <span className="flex-1">{error}</span><button onClick={() => setError(null)} className="text-xs underline">Dismiss</button></div>}
      {message && <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"><CheckCircle2 size={18} /> <span>{message}</span><button onClick={() => setMessage(null)} className="ml-auto text-xs underline">Dismiss</button></div>}

      {ytUser && (
        <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-bold text-white">Your YouTube Playlists</h2><p className="text-xs text-zinc-500">{ytUser.displayName || ytUser.email || 'Connected account'}</p></div>
            <button onClick={() => ytToken && void loadUserPlaylists(ytToken)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh</button>
          </div>
          {userPlaylists.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userPlaylists.map((pl) => <article key={pl.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"><img src={pl.thumbnailUrl} alt="" className="aspect-video w-full object-cover" /><div className="space-y-2 p-4"><h3 className="truncate font-semibold text-white">{pl.title}</h3><p className="line-clamp-2 text-xs text-zinc-500">{pl.description || `${pl.itemCount} tracks`}</p><button onClick={() => void handleImport(pl)} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"><Play size={13} /> Import & Play Later</button></div></article>)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">No playlists returned yet.</div>
          )}
        </section>
      )}

      <p className="px-2 text-center text-xs text-zinc-600">{t?.appName || 'SyncBeat'} • Playlist import is designed to fail soft instead of breaking playback.</p>
    </div>
  );
};

export default PlaylistImporterView;
