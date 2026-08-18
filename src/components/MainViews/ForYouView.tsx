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
  const history = useMemo(() => persistenceService.getHistory(20), []);
  const recent = useMemo(() => history.map((x) => x.song).filter((song, i, arr) => arr.findIndex((s) => s.id === song.id) === i), [history]);
  const basis = recent.length ? recent : songs.slice(0, 8);
  const recommendations = useMemo(() => {
    const seen = new Set(recent.map((s) => s.id));
    const artists = new Set(recent.map((s) => s.artist));
    const tags = new Set(recent.flatMap((s) => s.tags || []));
    const score = (s: Song) => (artists.has(s.artist) ? 5 : 0) + (s.tags || []).filter((t) => tags.has(t)).length;
    return songs.filter((s) => !seen.has(s.id)).sort((a,b) => score(b) - score(a)).slice(0,8);
  }, [songs, recent]);
  const recentLabel = recent.length ? 'Based on what you have been listening to' : 'Starter picks from your current music space';

  return <div className="space-y-10 pb-10">
    <section className="rounded-[32px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,.045),rgba(255,255,255,.012))] p-6 sm:p-8 lg:p-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Cineosync Music · For You</p>
      <h1 className="mt-2 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-white sm:text-6xl">Music that feels like <em>you</em>.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">A quieter home for discovery. Continue where you left off, switch the moment, or find something that fits your taste.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => onNavigateTab('search')} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black"><Search size={15}/> Search music</button>
        <button onClick={() => onNavigateTab('sessions')} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white"><Users size={15}/> Listen together</button>
      </div>
    </section>

    {recent.length > 0 && <section className="space-y-4"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Your recent listening</p><h2 className="mt-1 text-2xl font-semibold text-white">Continue listening</h2></div><button onClick={() => onNavigateTab('library')} className="inline-flex items-center gap-1 text-xs text-zinc-500">History <ArrowRight size={13}/></button></div><div className="flex gap-3 overflow-x-auto pb-2">{recent.slice(0,8).map((song) => <button key={song.id} onClick={() => onPlaySong(song)} className="min-w-[190px] max-w-[190px] text-left"><div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><img src={song.coverArt} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer"/></div><p className="mt-2 truncate text-sm font-semibold text-white">{song.title}</p><p className="truncate text-xs text-zinc-500">{song.artist}</p></button>)}</div></section>}

<section className="space-y-4"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Personalized</p><h2 className="mt-1 text-2xl font-semibold text-white">For you</h2></div><span className="text-[11px] text-zinc-600">{recentLabel}</span></div>{basis.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{basis.map((song) => { const liked = likedSongIds.has(song.id); const active = currentSong?.id===song.id && isPlaying; return <div key={song.id} className={`flex items-center gap-3 rounded-2xl border p-2.5 ${active?'border-white/15 bg-white/[0.075]':'border-white/[0.06] bg-white/[0.025]'}`}><button onClick={()=>onPlaySong(song)} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"><img src={song.coverArt} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer"/></button><div className="min-w-0 flex-1"><button onClick={()=>onPlaySong(song)} className="block w-full truncate text-left text-sm font-semibold text-white">{song.title}</button><p className="truncate text-xs text-zinc-500">{song.artist}</p></div><button onClick={()=>onToggleLike(song.id)} className={`rounded-full p-2 ${liked?'text-[var(--cine-accent,#e11d48)]':'text-zinc-600'}`} aria-label="Like"><Heart size={15} fill={liked?'currentColor':'none'}/></button><button onClick={()=>onAddToQueue(song)} className="rounded-full p-2 text-zinc-600" aria-label="Queue"><Plus size={15}/></button></div>})}</div> : <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center"><p className="text-sm font-semibold text-white">Start listening to shape your For You.</p><p className="mt-1 text-xs text-zinc-500">Play a few real tracks and this space will use that activity.</p></div>}</section>

<section className="space-y-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Context</p><h2 className="mt-1 text-2xl font-semibold text-white">Choose the moment</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{moments.map((m)=><button key={m.id} onClick={()=>{onSelectExperience?.(m.id);onNavigateTab(m.id==='focus'?'focus':'home')}} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">{m.label}</span><ArrowRight size={15} className="text-zinc-600"/></div><p className="mt-1 text-xs text-zinc-500">{m.note}</p></button>)}</div></section>

{recommendations.length>0 && <section className="space-y-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Discovery</p><h2 className="mt-1 text-2xl font-semibold text-white">Something new</h2></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{recommendations.map((song)=><button key={song.id} onClick={()=>onPlaySong(song)} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-left"><img src={song.coverArt} alt="" className="h-14 w-14 rounded-xl object-cover" referrerPolicy="no-referrer"/><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{song.title}</span><span className="block truncate text-xs text-zinc-500">{song.artist}</span><span className="mt-1 block truncate text-[10px] text-zinc-600">Because it fits your listening pattern</span></span></button>)}</div></section>}

<section className="grid gap-3 md:grid-cols-3"><button onClick={()=>onNavigateTab('sessions')} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-left"><Radio size={19}/><h3 className="mt-3 text-sm font-semibold text-white">Public listening rooms</h3><p className="mt-1 text-xs text-zinc-500">Find people listening together.</p></button><button onClick={()=>onNavigateTab('library')} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-left"><ListMusic size={19}/><h3 className="mt-3 text-sm font-semibold text-white">Your library</h3><p className="mt-1 text-xs text-zinc-500">Liked music, playlists and history.</p></button><button onClick={onOpenAiGenerator} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-left"><Sparkles size={19}/><h3 className="mt-3 text-sm font-semibold text-white">Create a moment</h3><p className="mt-1 text-xs text-zinc-500">Build a mix around how you feel.</p></button></section>

{playlists.length>0 && <section className="space-y-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Library</p><h2 className="mt-1 text-2xl font-semibold text-white">Your collections</h2></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{playlists.slice(0,10).map(p=><button key={p.id} onClick={()=>onSelectPlaylist(p)} className="group text-left"><div className="aspect-square overflow-hidden rounded-2xl border border-white/10"><img src={p.coverArt} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" referrerPolicy="no-referrer"/></div><p className="mt-2 truncate text-sm font-semibold text-white">{p.title}</p><p className="text-xs text-zinc-500">{p.songIds.length} tracks</p></button>)}</div></section>}
  </div>;
};
