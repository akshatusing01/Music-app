import React, { useMemo } from 'react';
import { ArrowRight, Heart, ListMusic, Play, Plus, Radio, Search, Sparkles, Users } from 'lucide-react';
import { Song, Playlist, SupportedLanguage, ExperienceMode } from '../../types';
import { persistenceService } from '../../services/persistenceService';

interface Props { songs: Song[]; playlists: Playlist[]; currentSong: Song | null; isPlaying: boolean; onPlaySong: (song: Song) => void; onAddToQueue: (song: Song) => void; likedSongIds: Set<string>; onToggleLike: (id: string) => void; onOpenAiGenerator: () => void; onSelectPlaylist: (p: Playlist) => void; onSelectExperience?: (mode: ExperienceMode) => void; onNavigateTab: (tab: any) => void; language: SupportedLanguage; }

const moments: Array<{id: ExperienceMode; label: string; note: string}> = [
  { id: 'focus', label: 'Focus', note: 'Quiet concentration' },
  { id: 'gym', label: 'Gym', note: 'High-energy momentum' },
  { id: 'love', label: 'Couple', note: 'Romantic listening' },
  { id: 'chill', label: 'Chill', note: 'Slow down' },
  { id: 'friends', label: 'Friends', note: 'Shared energy' },
  { id: 'bollywood', label: 'Bollywood', note: 'Hindi-first discovery' },
];

export const ForYouView: React.FC<Props> = ({ songs, playlists, currentSong, isPlaying, onPlaySong, onAddToQueue, likedSongIds, onToggleLike, onOpenAiGenerator, onSelectPlaylist, onSelectExperience, onNavigateTab }) => {
  const history = useMemo(() => persistenceService.getHistory(32), []);
  const recent = useMemo(() => history.map((x) => x.song).filter((song, i, arr) => arr.findIndex((s) => s.id === song.id) === i), [history]);
  const recommendations = useMemo(() => {
    const seen = new Set(recent.map((s) => s.id));
    const artists = new Set(recent.map((s) => s.artist));
    const tags = new Set(recent.flatMap((s) => s.tags || []));
    const score = (s: Song) => (artists.has(s.artist) ? 8 : 0) + (s.tags || []).filter((t) => tags.has(t)).length * 2;
    return songs.filter((s) => !seen.has(s.id)).sort((a, b) => score(b) - score(a)).slice(0, 10);
  }, [songs, recent]);
  const featureSong = recent[0] || songs[0] || null;
  const secondarySongs = (recent.length ? recent.slice(1, 5) : songs.slice(1, 5));

  return <div className="cine-page cine-home-page">
    <section className="cine-editorial-hero">
      <div className="cine-hero-copy">
        <span className="cine-eyebrow">CINEOSYNC · FOR YOU</span>
        <h1>{recent.length ? <>Sound, <em>in your language.</em></> : <>Your next favorite<br /><em>starts here.</em></>}</h1>
        <p>{recent.length ? 'A listening space shaped by what you actually play, save and explore.' : 'Tell us what you love through your first plays, and Cineosync will quietly adapt around you.'}</p>
        <div className="cine-actions">
          <button className="cine-primary-action" onClick={() => onNavigateTab('search')}><Search size={16} /> Discover music</button>
          <button className="cine-quiet-action" onClick={() => onNavigateTab('sessions')}><Users size={16} /> Listen together</button>
        </div>
      </div>
      {featureSong && <button className="cine-hero-art" onClick={() => onPlaySong(featureSong)} aria-label={`Play ${featureSong.title}`}>
        <img src={featureSong.coverArt} alt="" referrerPolicy="no-referrer" />
        <span className="cine-hero-overlay" />
        <span className="cine-hero-play"><Play size={18} fill="currentColor" /></span>
        <span className="cine-hero-meta"><b>{featureSong.title}</b><small>{featureSong.artist}</small></span>
      </button>}
    </section>

    {secondarySongs.length > 0 && <section className="cine-section">
      <div className="cine-section-head"><div><span className="cine-eyebrow">RECENTLY</span><h2>Continue listening</h2></div><button className="cine-link-action" onClick={() => onNavigateTab('library')}>View history <ArrowRight size={14} /></button></div>
      <div className="cine-rail">
        {secondarySongs.map((song) => <button key={song.id} className="cine-rail-item" onClick={() => onPlaySong(song)}>
          <span className="cine-rail-art"><img src={song.coverArt} alt="" referrerPolicy="no-referrer" /><span className="cine-rail-play"><Play size={15} fill="currentColor" /></span></span>
          <span className="cine-rail-title">{song.title}</span><span className="cine-rail-sub">{song.artist}</span>
        </button>)}
      </div>
    </section>}

    <section className="cine-section">
      <div className="cine-section-head"><div><span className="cine-eyebrow">PERSONALIZED</span><h2>For you</h2></div><span className="cine-section-note">{recent.length ? 'Built from your listening' : 'A first set of real picks'}</span></div>
      {recommendations.length ? <div className="cine-track-table">{recommendations.slice(0, 8).map((song, index) => {
        const liked = likedSongIds.has(song.id); const active = currentSong?.id === song.id && isPlaying;
        return <div key={song.id} className={`cine-track-row ${active ? 'is-active' : ''}`}>
          <span className="cine-track-index">{String(index + 1).padStart(2, '0')}</span>
          <button className="cine-track-art" onClick={() => onPlaySong(song)}><img src={song.coverArt} alt="" referrerPolicy="no-referrer" />{active && <span className="cine-equalizer">•••</span>}</button>
          <button className="cine-track-main" onClick={() => onPlaySong(song)}><b>{song.title}</b><small>{song.artist}{song.album ? ` · ${song.album}` : ''}</small></button>
          <button className={`cine-row-icon ${liked ? 'is-liked' : ''}`} onClick={() => onToggleLike(song.id)} aria-label="Like"><Heart size={16} fill={liked ? 'currentColor' : 'none'} /></button>
          <button className="cine-row-icon" onClick={() => onAddToQueue(song)} aria-label="Add to queue"><Plus size={16} /></button>
        </div>;
      })}</div> : <div className="cine-empty-state"><span className="cine-empty-mark">01</span><div><b>Start with a real track.</b><p>Play a few songs and Cineosync will build recommendations from your actual listening.</p></div></div>}
    </section>

    <section className="cine-section">
      <div className="cine-section-head"><div><span className="cine-eyebrow">YOUR STATE OF MIND</span><h2>Choose the moment</h2></div></div>
      <div className="cine-moment-grid">{moments.map((m, index) => <button key={m.id} className="cine-moment" onClick={() => { onSelectExperience?.(m.id); onNavigateTab(m.id === 'focus' ? 'focus' : 'home'); }}><span className="cine-moment-no">0{index + 1}</span><span><b>{m.label}</b><small>{m.note}</small></span><ArrowRight size={15} /></button>)}</div>
    </section>

    <section className="cine-feature-row">
      <button className="cine-feature-card" onClick={() => onNavigateTab('sessions')}><span className="cine-feature-icon"><Radio size={18} /></span><span><small>PUBLIC LISTENING</small><b>People are listening together.</b><em>Find a room and join the moment.</em></span><ArrowRight size={17} /></button>
      <button className="cine-feature-card" onClick={onOpenAiGenerator}><span className="cine-feature-icon"><Sparkles size={18} /></span><span><small>CREATE A MOMENT</small><b>Shape a mix around how you feel.</b><em>Let Cineosync build the mood.</em></span><ArrowRight size={17} /></button>
      <button className="cine-feature-card" onClick={() => onNavigateTab('library')}><span className="cine-feature-icon"><ListMusic size={18} /></span><span><small>YOUR LIBRARY</small><b>Everything you decided to keep.</b><em>Liked music, playlists, history and imports.</em></span><ArrowRight size={17} /></button>
    </section>

    {playlists.length > 0 && <section className="cine-section">
      <div className="cine-section-head"><div><span className="cine-eyebrow">COLLECTIONS</span><h2>Your playlists</h2></div><button className="cine-link-action" onClick={() => onNavigateTab('library')}>Open library <ArrowRight size={14} /></button></div>
      <div className="cine-playlist-grid">{playlists.slice(0, 8).map((playlist) => <button key={playlist.id} className="cine-playlist-card" onClick={() => onSelectPlaylist(playlist)}><div className="cine-playlist-art"><img src={playlist.coverArt} alt="" referrerPolicy="no-referrer" /></div><b>{playlist.title}</b><small>{playlist.songIds.length} tracks</small></button>)}</div>
    </section>}
  </div>;
};
