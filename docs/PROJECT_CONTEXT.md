# Cineosync Music — Project Context

> Living source of truth for product decisions, UI direction, architecture, implementation milestones, bugs, and testing notes.
>
> **Rule:** Before any significant implementation change, update this file with the decision. After implementation, record the commit/deployment and verification status here.

## 0. Project Working Rules
- Product is evolving from a functional prototype into a real, polished app.
- Existing functionality should be preserved or improved while the UI is substantially redesigned.
- Work in explicit stages: discovery/questions → UX/IA → visual design → technical architecture → controlled implementation → production verification → polish/security.
- No major redesign should silently remove a working feature.
- No deployment should be called "ready" without checking the actual deployment/build/runtime status available to us.
- Mobile is a first-class target.
- Keep major product decisions in this file so future conversations can recover context from the repository.

## 1. Product Vision
**Final product name:** Cineosync Music

**Positioning:** A creative music + lifestyle platform. Music is the center, but the product extends into social listening, public discovery, focus/productivity, gym energy, couple experiences, and other music-led lifestyles.

**Product principle:** Familiar enough to understand immediately, but visually and experientially original enough that it does not feel like a Spotify/YouTube Music clone.

## 2. Current Functional Foundation
- Real YouTube music search/results and playback
- Queue/player controls
- Real-time listening rooms
- Room invite links and room-name joining
- Host-authoritative playback synchronization and mobile autoplay fallback
- Live chat/reactions
- Host transfer / automatic host promotion
- In-room YouTube search
- Focus timer / stopwatch / ambient sounds
- Library, likes, playlists, history
- Supabase-backed auth/cloud persistence foundation
- Profile avatar upload
- Persistent SyncBeat ID/friend-code foundation
- Friend requests and room invitations

## 3. Current Technical Foundation
- Frontend: React + TypeScript + Vite
- Hosting/deployment: Vercel
- Realtime room transport: WebSocket endpoint under `/api/ws`
- Database/auth/storage: Supabase
- YouTube playback: YouTube IFrame Player API
- Local persistence remains for graceful fallback/offline-first behavior

## 4. Redesign Goals
### Product character
- Creative, premium, atmospheric, music-first.
- Lifestyle-oriented rather than simply a streaming catalog.
- Strong sense of identity, presence, mood, and context.
- Public discovery should coexist with personal/private experiences.

### Visual direction
- **Obsidian + subtle glass + restrained accent color**.
- Avoid heavy neon, excessive gradients, noisy glassmorphism, and generic AI-dashboard aesthetics.
- Introduce depth through typography, spacing, shadows, translucency, artwork, and motion rather than many colors.
- Establish a new visual language instead of copying existing music platforms.

### Navigation
**Home / Discover / Sessions / Library / Profile**

### Sessions
Sessions is a **major first-class destination**.

### Player
The player is a **signature Music Cockpit** with compact and expanded states.

### Mobile essentials
Play/Pause, Forward, Like must remain immediately reachable.

### Social
Cineosync Music supports a **public discovery layer**, while still supporting private/friends-first experiences.

### Identity
Visible editable username/handle is a first-class identity. Immutable internal SyncBeat ID remains the backend identity.

### Discovery
Adapt to past activity and saved tastes for returning users; artists, languages, genres, moods and goals for new users; eventually blend with time, mode, sessions and lifestyle intent.

## 5. Stage B — UX / Information Architecture — LOCKED
- Home: **For You** personalized listening environment.
- Discover: search + contextual exploration + public rooms.
- Sessions: complete room discovery/control center.
- Library: liked, playlists, recent, imports and future saved moments.
- Profile: avatar, username, SyncBeat ID, listening identity, friends, requests, invites, privacy and account settings.
- Music Cockpit: compact + immersive expanded overlay.

## 6. Stage C — Visual Design Direction — LOCKED
**Emotional core: Editorial Luxury × Intelligent Music.**

Cineosync should feel like a premium contemporary music/culture publication that understands the listener personally.

Core principles:
- Quiet confidence rather than flashy futurism.
- Strong typography and editorial composition.
- Generous negative space.
- High-quality artwork/photography as visual anchors.
- Intelligent content hierarchy and contextual modules.
- Premium dark surfaces with subtle glass used selectively.
- Motion communicates state and intelligence rather than spectacle.
- Avoid obvious Spotify/Apple Music/YouTube Music imitation.

## 7. Stage D — Architecture — APPROVED
- UI/design system is separated from domain logic.
- Playback state is separate from presentation state.
- Session state is server-authoritative.
- Supabase owns durable identity/social/profile data.
- WebSocket room state owns ephemeral realtime session state.
- YouTube is a playback provider, not the product's visible identity.
- Mobile is first-class.

## 8. Stage D1 — Design System — APPROVED
- Obsidian/graphite surfaces
- restrained single Cineosync accent via CSS variables
- editorial + neutral typography model
- 4px spacing base
- selective glass
- restrained depth and motion
- minimum 44px interactive targets
- reduced-motion support
- reusable component contracts

## 9. Stage D2 — App Shell — IMPLEMENTED
The shell now uses the new Cineosync direction with:
- Home / Discover / Sessions / Library / Profile navigation
- responsive desktop sidebar
- mobile navigation drawer/bottom navigation
- safe-area-aware layout
- session connection indicator
- cleaner search/header/profile actions

D2 commits:
- `c48568d`
- `6292fb2`
- `4ebdc37`
- context update `41a04a4`

Vercel status for the D2 context commit: **success**.

## 10. Stage D3 — Music Cockpit — IMPLEMENTED

### D3 objectives
- Replace the legacy YouTube-exposing player presentation with a Cineosync-owned Music Cockpit.
- Keep YouTube as the hidden playback provider.
- Prevent player controls from overlapping on mobile.
- Make compact playback and expanded immersive playback coherent.
- Keep Play/Pause, Forward and Like immediately accessible.

### D3 implementation
`src/components/AudioPlayerBar.tsx` was redesigned.

Key behavior:
- YouTube IFrame remains mounted as an invisible playback provider; its video UI is no longer rendered inside the Cineosync player.
- Compact cockpit replaces the previous multi-row/video-heavy player.
- Mobile uses a compact two-zone control layout with safe-area support.
- Expanded cockpit opens as a full-screen immersive overlay with artwork, title/artist, progress, playback controls, Like, queue entry point and secondary actions.
- Existing callbacks for lyrics, equalizer, sharing, downloads, shuffle, repeat, next/previous and seek remain wired.
- Playback provider calls remain in the existing player path to reduce risk to working YouTube playback.

D3 commit:
- `f93b755815327c1d2e3bba0ee3df83e794bdf12a`

### D3 verification boundary
Code changes are committed. Production deployment/real-device behavior must still be verified after Vercel finishes the new commit. In particular, test:
1. Search → play real track.
2. Play/pause from compact cockpit.
3. Open/close expanded cockpit.
4. Seek and next/previous.
5. Mobile safe-area and touch controls.
6. Session host playback and joined-member sync.
7. Search while inside a session.
8. No visible YouTube video/player UI.

## 11. Next Milestones
1. D4 — For You / Discover redesign using existing search/history data
2. D5 — Sessions workspace redesign without changing realtime contract
3. D6 — Library/Profile/Social redesign
4. D7 — Onboarding/personalization
5. D8 — Production QA, accessibility, performance, security

## 12. Decision & Change Log
- 2026-08-18: Product direction locked as Cineosync Music: creative music + lifestyle platform.
- 2026-08-18: Primary mobile navigation locked to Home / Discover / Sessions / Library / Profile.
- 2026-08-18: Sessions confirmed as a major first-class destination.
- 2026-08-18: Player direction locked as signature Music Cockpit.
- 2026-08-18: Mobile essential controls locked: Play/Pause, Forward, Like.
- 2026-08-18: Visual base locked: Obsidian + subtle glass + restrained accent.
- 2026-08-18: Design language must be original rather than a Spotify/YouTube Music clone.
- 2026-08-18: Public discovery layer confirmed.
- 2026-08-18: Visible username/handle confirmed as first-class identity.
- 2026-08-18: Final product name confirmed: Cineosync Music.
- 2026-08-18: Stage B recommendations accepted: For You, public rooms in Discover + Sessions, one core accent system, immersive cockpit overlay, username + immutable SyncBeat ID, progressive onboarding.
- 2026-08-18: Stage C emotional core selected: Editorial Luxury + Intelligent.
- 2026-08-18: Stage C visual principles documented and locked.
- 2026-08-18: Stage D architecture audit documented and approved.
- 2026-08-18: Stage D1 design system foundation documented and approved.
- 2026-08-18: Stage D2 shell implemented and deployed successfully.
- 2026-08-18: Stage D3 Music Cockpit implemented; awaiting fresh production verification after deployment.

## 13. Verification Notes
- This document is intentionally kept in-repo so future sessions can recover product decisions without relying on conversation context.
- Feature verification must distinguish code/build verification from real multi-device/browser verification.
- Never claim realtime/mobile/autoplay behavior is fully verified unless it has actually been tested in the relevant environment.
