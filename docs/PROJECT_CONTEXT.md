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

Existing capabilities to preserve/improve:
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

### Navigation decision
Primary mobile navigation is:
**Home / Discover / Sessions / Library / Profile**

### Sessions decision
Sessions is a **major first-class destination**, equal in importance to Home and Discover.

### Player decision
The player becomes a **music cockpit** rather than a conventional bottom bar. It should support a compact state and an expanded immersive state while maintaining fast access to essential playback controls.

### Mobile player priority
Three controls must always be instantly reachable:
1. Play / Pause
2. Forward
3. Like

### Social decision
Cineosync Music will support a **public discovery layer**, while still supporting private/friends-first experiences.

### Identity decision
The user's visible username/handle is a first-class identity across the product, not something hidden only inside settings.

### Discovery decision
Discovery should adapt to listener context: past activity and saved tastes for returning users; artists, languages, genres, moods, and goals for new users; eventually blended with time, mode, sessions, and lifestyle intent.

## 5. Stage B — UX / Information Architecture — LOCKED

### 5.1 App shell
Desktop: left navigation rail/expandable sidebar, central content stage, optional contextual right rail, persistent compact cockpit.

Mobile: 5-item bottom navigation Home / Discover / Sessions / Library / Profile; persistent compact cockpit above navigation when active; cockpit expands into a full-screen/near-full-screen experience; fixed UI must never obscure content, chat, or controls.

### 5.2 Home — "For You"
1. Greeting + current identity/presence
2. Continue listening / resume context
3. Personalized discovery
4. Recently played / familiar favorites
5. Mood & lifestyle contexts
6. Friends / public listening activity
7. Sessions worth joining
8. Curated editorial / emerging discovery

New-user state: progressive preference onboarding for artists, languages, genres, moods, and use cases.

### 5.3 Discover
Context-driven exploration: Search, regional/language trends, because-you-listened-to, artist/language/mood discovery, lifestyle modes, public rooms, community moments/recommendations.

### 5.4 Sessions
First-class social control center: discover public rooms, create, join by name/ID/link, invitations, active room, participants, shared playback, queue, chat/reactions, host controls, host transfer, public visibility.

### 5.5 Library
Liked, playlists, recently played, imported playlists, saved sessions/moments (future), supported offline/downloads.

### 5.6 Profile
Avatar, visible username, SyncBeat ID, listening identity, friends, friend requests, room invites, activity/privacy, account/auth, preferences, appearance/audio settings.

### 5.7 Music cockpit
Compact: artwork, track/artist, play/pause, forward, like, progress hint.
Expanded: large artwork/atmosphere, full controls, queue, lyrics, session context, share, playback settings, equalizer, output/quality controls.

## 6. Stage B Decisions — CONFIRMED

1. Home hero/personalized destination: **For You**.
2. Public rooms appear in both **Discover + Sessions**; Discover emphasizes editorial/recommended rooms, Sessions is the complete room discovery/control center.
3. **One recognizable Cineosync primary accent**, with restrained contextual variations for Focus/Gym/Couple.
4. **Immersive cockpit overlay/bottom-sheet**, not a separate route.
5. **Visible editable username/handle** for people-facing identity; **immutable SyncBeat ID** for backend identity.
6. **Progressive onboarding**: immediate exploration first, personalization prompts when useful.

## 7. Stage C — Visual Design Direction — LOCKED

### 7.1 Emotional core
User selected:
- **D — Editorial Luxury**
- **E — Intelligent**

The combined emotional direction is **Editorial Luxury × Intelligent Music**.

Cineosync should feel like a premium contemporary music/culture publication that understands the listener personally. It should be sophisticated and restrained, but the interface should visibly adapt to context rather than behaving like a static catalog.

### 7.2 Visual personality
- Quiet confidence rather than flashy futurism.
- Strong typography and editorial composition.
- Generous negative space.
- High-quality artwork/photography as visual anchors.
- Intelligent content hierarchy and contextual modules.
- Premium dark surfaces with subtle glass used selectively.
- Motion communicates state and intelligence rather than spectacle.
- Avoid obvious Spotify/Apple Music/YouTube Music imitation.

### 7.3 Color system
- Primary foundation: near-black obsidian.
- Supporting surfaces: graphite/charcoal.
- Glass: low-opacity neutral translucent surfaces with controlled blur.
- Brand accent: one restrained Cineosync accent, used sparingly for actions, progress, active states and key identity moments.
- Semantic colors only where they communicate state.
- Artwork can provide contextual color atmosphere, but must not redefine the core brand palette.

### 7.4 Typography
Typography should carry a large part of the identity.
- Display/headline face: distinctive editorial character, used selectively for major titles and identity moments.
- UI/body face: highly legible, neutral, modern.
- Strong hierarchy through size, weight, tracking and whitespace rather than excessive decorative styling.
- Track metadata remains compact and highly scannable.
- Monospace only for technical/session metadata when it adds meaning.

### 7.5 Layout language
- Editorial asymmetry is allowed on larger screens.
- Mobile remains structured and predictable despite the editorial aesthetic.
- Prefer composition and sections over endless rounded cards.
- Use large visual anchors followed by dense-but-readable supporting lists.
- Content should feel curated rather than algorithmically dumped onto the screen.

### 7.6 Glass and surfaces
- Glass is a supporting material, not the identity itself.
- Use it for cockpit, overlays, session controls, contextual floating tools and high-value transient UI.
- Avoid applying blur/transparency to every container.
- Surfaces should have subtle borders, depth and separation without excessive shadows.

### 7.7 Intelligent UI behavior
The interface should adapt based on context:
- New vs returning listener
- Current listening activity
- Current mode (Focus/Gym/Couple/etc.)
- Session participation
- Time/context where useful
- Personal preferences

Examples:
- A returning listener sees Continue Listening and behavior-based recommendations first.
- A new listener sees a concise preference setup and immediately useful starter music.
- A user inside a session sees room context without losing access to music discovery.
- The cockpit changes density based on compact/expanded state.

The UI should explain recommendation intent where appropriate (e.g. "Because you played…") rather than pretending the algorithm is magic.

### 7.8 Motion language
- Editorial, smooth, restrained.
- Use spring/ease transitions for cockpit expansion, page/module reveals, session state and contextual recommendations.
- Avoid constant floating animations or decorative motion.
- Respect reduced-motion preferences.

## 8. Stage C — Component Principles

Reusable primitives will be designed before full screens:
- App shell/navigation
- Typography tokens
- Surface/section primitives
- Buttons and icon buttons
- Search field
- Track row
- Artist row
- Album/artwork tile
- Playlist module
- Recommendation module
- Mood/lifestyle module
- Room card
- Participant/avatar stack
- Chat message/input
- Music cockpit compact/expanded
- Progress/seek control
- Queue drawer
- Modal/sheet
- Toast/notification
- Empty/loading/error states

Each component must have responsive, accessible states before being composed into screens.

## 9. Discovery / Recommendation Architecture Direction

Future recommendation system should be modular and explainable.

Signals: explicit preferences; plays/skips/repeats/likes/saves; context; social activity; freshness.

Outputs: track rows, artist modules, mood collections, contextual mixes, public room recommendations, explainable because-you-listened-to modules.

## 10. Implementation Milestones — PLANNED

1. Visual tokens and primitives
2. App shell + responsive navigation
3. For You/Home
4. Discover
5. Sessions
6. Music Cockpit
7. Library
8. Profile/social/auth
9. Onboarding/personalization
10. Polish/accessibility/performance
11. Production QA

**Implementation rule:** Do not rewrite the whole UI until the visual tokens/primitives are documented and approved. Build reusable primitives first, then compose screens from them.

## 11. Decision & Change Log

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

## 12. Verification Notes

- This document is intentionally kept in-repo so future sessions can recover product decisions without relying on conversation context.
- Feature verification must distinguish code/build verification from real multi-device/browser verification.
- Never claim realtime/mobile/autoplay behavior is fully verified unless it has actually been tested in the relevant environment.
