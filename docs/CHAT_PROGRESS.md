# Cineosync Music — Conversation Progress Ledger

This file is a compact recovery log for future ChatGPT/Codex sessions. The detailed product source of truth remains `docs/PROJECT_CONTEXT.md`; visual implementation rules remain `docs/DESIGN_SYSTEM.md`; architecture remains `docs/ARCHITECTURE_AUDIT.md`.

## Current state — 2026-08-18

### Product decisions
- Final product name: **Cineosync Music**.
- Positioning: creative **Music + Lifestyle** platform.
- Primary mobile navigation: **Home / Discover / Sessions / Library / Profile**.
- Sessions is a first-class destination.
- Public room discovery is available from Discover and Sessions.
- Player direction: **Music Cockpit**.
- Essential mobile player controls: Play/Pause, Forward, Like.
- Visual foundation: **Obsidian + subtle glass + restrained accent**.
- Emotional design core: **Editorial Luxury × Intelligent Music**.
- Design language must be original, not a Spotify/YouTube Music clone.
- Discovery should adapt to history, behavior, preferences, language, artists, genres, moods, context and social signals.
- Visible editable username everywhere; immutable internal SyncBeat ID for backend identity.
- Progressive onboarding.

### Existing functionality that must remain protected
- Real YouTube search and playback
- Queue and playback controls
- Realtime listening rooms
- Host-authoritative synchronization
- Room links/name joining
- Chat/reactions
- Host transfer
- In-room search without leaving the room
- Focus/timer/stopwatch/ambient modes
- Library/likes/playlists/history
- Supabase auth/profile/avatar/cloud persistence
- Friend requests and room invitations

## Completed milestones

### D1 — Design foundation
`5929396d86e07c403b02d195db3a127605206ccd`
- `docs/DESIGN_SYSTEM.md`
- Tokens and reusable component rules defined.

### D2 — App shell
Relevant commits:
- `c48568dca6f265eef8f7364757cf3bcc0d4c7664`
- `6292fb2a0df7561d4e9708fa21aaad85291d53d6`
- `4ebdc374f496b0bbe8e47498e808ca8b04bce9bb`
- `41a04a40550ae919c31208dafb46d362d3f6cf4a`

The Cineosync shell/navigation was implemented. Vercel deployment completed successfully afterward.

### D3 — Music Cockpit
`f93b755815327c1d2e3bba0ee3df83e794bdf12a`

Vercel status: **SUCCESS**
Deployment target recorded by GitHub: `https://vercel.com/akshatusing01-1782s-projects/music-app/5Gbkh3NyYMiaPjUKuBVrqEv1TtHW`

D3 changes include:
- Legacy player presentation replaced with the Cineosync Music Cockpit direction.
- YouTube remains an invisible playback provider rather than visible product UI.
- Compact player state.
- Expanded Now Playing/Cockpit state.
- Mobile-safe controls and focus-visible states.
- Progress/seek interaction.
- Like, playback, queue-adjacent controls, save/share/lyrics/equalizer access.
- No visible embedded YouTube video in the product player.

## Active milestone — D4: For You + Discover
Plan: `docs/D4_DISCOVERY_PLAN.md`
Status note: `docs/D4_STATUS.md`

### D4 implementation started
- Added a dedicated `ForYouView` driven by real local listening history.
- Recent listening is deduplicated and shown as Continue Listening.
- For You scoring uses recently played artists and track tags from the existing data model.
- New-user state uses currently available real tracks rather than fabricated/demo recommendations.
- Contextual lifestyle moments are first-class UI actions.
- Library, Sessions and mix creation remain directly reachable.
- Existing `HomeView` route now re-exports `ForYouView`, so the App shell keeps its current contract.

Latest D4 wiring commit: `4a389f23cb0ee8083f842682e832b03085cb77bb`

### Playlist import production pass
- Real YouTube public playlist import implemented with YouTube Data API pagination and deleted/private track filtering.
- Spotify PKCE import implemented as metadata-to-playable-YouTube matching.
- CSV/M3U/M3U8 import implemented with real YouTube matching.
- Fake/default fallback tracks are not used on import failure.
- Production mobile testing exposed a runtime `o is not a function` error when pressing **Import playlist**.
- Root cause: `App.tsx` rendered `PlaylistImporterView` with an obsolete `onImport` prop while the component requires `onImportPlaylist` plus its required playlist/data callbacks.
- Fixed in commit `38f0403e9483379d8d93882f12d6586cf4063db8` by wiring the required importer callbacks and data.

### Mobile player visibility + playback mode pass
`b1e2aa8c76e880345e70eb2fd5ff87f6440ed4e1`
- Fixed the mobile player being rendered underneath the fixed bottom navigation.
- Compact player now sits above the mobile navigation lane and remains fully clickable.
- Desktop placement remains flush to the viewport bottom.
- Added a real **Audio / Video** mode switch to the Music Cockpit for YouTube-backed tracks.
- Audio mode keeps YouTube as the invisible playback provider.
- Video mode exposes the actual YouTube video inside the Cineosync cockpit while keeping Cineosync playback controls authoritative.
- Video mode can be opened from the compact player on supported screens.
- Kept the existing seek, play/pause, next/previous, shuffle, repeat, volume, quality, lyrics, equalizer, save and share controls.
- The YouTube iframe itself remains unbranded as the product UI; it is only exposed when the user explicitly chooses Video mode.

## Working rule
Every significant product decision or implementation milestone must be recorded here and/or in the appropriate detailed docs. Never claim a feature is fully verified unless it has actually been tested in the relevant production environment.
