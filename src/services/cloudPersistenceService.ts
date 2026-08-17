import type { Playlist, Song, UserProfile } from '../types';
import { supabase } from './supabaseClient';

const trackPayload = (song: Song) => ({
  track_id: song.id,
  title: song.title,
  artist: song.artist,
  artwork: song.artwork,
  youtube_video_id: song.youtubeVideoId ?? null,
});

export const cloudPersistenceService = {
  get enabled() { return Boolean(supabase); },

  async loadUserData() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [profile, likes, playlists, history] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('likes').select('track_id').eq('user_id', user.id),
      supabase.from('playlists').select('*, playlist_tracks(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('listening_history').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(100),
    ]);

    if (profile.error || likes.error || playlists.error || history.error) {
      throw profile.error ?? likes.error ?? playlists.error ?? history.error;
    }

    return {
      profile: profile.data,
      likedIds: (likes.data ?? []).map((row) => row.track_id as string),
      playlists: (playlists.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        coverUrl: row.cover_url ?? '',
        songIds: (row.playlist_tracks ?? []).sort((a: any, b: any) => a.position - b.position).map((track: any) => track.track_id),
        isPublic: row.is_public,
      } as Playlist)),
      history: (history.data ?? []).map((row) => ({
        song: { id: row.track_id, title: row.title ?? 'Unknown track', artist: row.artist ?? 'Unknown artist', artwork: row.artwork ?? '', youtubeVideoId: row.youtube_video_id ?? undefined } as Song,
        playedAt: new Date(row.played_at).getTime(),
        source: row.source ?? 'unknown',
      })),
    };
  },

  async setLiked(song: Song, liked: boolean) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (liked) await supabase.from('likes').upsert({ user_id: user.id, ...trackPayload(song) });
    else await supabase.from('likes').delete().eq('user_id', user.id).eq('track_id', song.id);
  },

  async savePlaylist(playlist: Playlist, songs: Song[]) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('playlists').upsert({
      id: playlist.id.startsWith('playlist-') ? undefined : playlist.id,
      user_id: user.id,
      name: playlist.name,
      description: playlist.description ?? '',
      cover_url: playlist.coverUrl ?? '',
      is_public: false,
    });
    if (error) throw error;
    const { data: saved } = await supabase.from('playlists').select('id').eq('user_id', user.id).eq('name', playlist.name).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const playlistId = saved?.id;
    if (!playlistId) return;
    await supabase.from('playlist_tracks').delete().eq('playlist_id', playlistId);
    const rows = playlist.songIds.map((id, position) => {
      const song = songs.find((item) => item.id === id);
      return song ? { playlist_id: playlistId, position, ...trackPayload(song) } : null;
    }).filter(Boolean);
    if (rows.length) await supabase.from('playlist_tracks').insert(rows);
  },

  async recordHistory(song: Song, source: string) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('listening_history').insert({ user_id: user.id, ...trackPayload(song), source });
  },

  async saveProfile(profile: UserProfile) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id,
      username: profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32),
      display_name: profile.name,
      avatar_url: profile.avatar || null,
      status_message: profile.statusMessage || null,
      presence_mode: profile.presenceMode,
      language: profile.language,
      theme: profile.theme,
      audio_quality: profile.quality,
      favorite_genres: profile.favoriteGenres,
      updated_at: new Date().toISOString(),
    });
  },
};
