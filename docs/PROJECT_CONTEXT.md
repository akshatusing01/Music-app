# Cineosync Music — Project Context

> Living source of truth for product decisions, UI direction, architecture, implementation milestones, bugs, and testing notes.
>
> **Rule:** Before any significant implementation change, update this file with the decision. After implementation, record the commit/deployment and verification status here.

## 0. Project Working Rules

- Product is evolving from a functional prototype into a real, polished app.
- Existing functionality should be preserved or improved while the UI is substantially redesigned.
- Work in explicit stages:
  1. Product/UI discovery and questions
  2. UX structure and information architecture
  3. Visual design system
  4. Technical architecture validation
  5. Implementation in controlled milestones
  6. Production verification and bug-fixing
  7. Polish/performance/security
- No major redesign should silently remove a working feature.
- No deployment should be called "ready" without checking the actual deployment/build/runtime status available to us.
- Mobile is a first-class target because the app is regularly tested on phones.
- Keep major product decisions in this file so future conversations can recover context from the repository.

## 1. Product Vision

**Final product name:** Cineosync Music

**Positioning:** A creative music + lifestyle platform. Music is the center, but the product extends into social listening, public discovery, focus/productivity, gym energy, couple experiences, and other music-led lifestyles.

**Product principle:** Familiar enough to understand immediately, but visually and experientially original enough that it does not feel like a Spotify/YouTube Music clone.

## 2. Current Functional Foundation

Existing capabilities to preserve/improve:
- Real YouTube music search/results
- Real YouTube playback
- Queue/player controls
- Real-time listening rooms
- Room invite links
- Room-name joining
- Host-authoritative playback synchronization
- Mobile autoplay fallback for synchronized YouTube playback
- Live chat/reactions
- Host transfer / automatic host promotion
- In-room YouTube search
- Focus timer / stopwatch / ambient sounds
- Library, likes, playlists, history
- Supabase-backed auth/cloud persistence foundation
- Profile avatar upload
- Persistent SyncBeat ID/friend-code foundation
- Friend requests
- Room invitations

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
The player becomes a **music cockpit** rather than a conventional bottom bar.
It should support a compact state and an expanded immersive state while maintaining fast access to essential playback controls.

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
Discovery should adapt to listener context:
- Returning users: past listening activity, saved tastes, recent behavior, and evolving preferences.
- New users: onboarding preferences such as artists, languages, genres, moods, and listening goals.
- Discovery should eventually blend these signals with context such as time, mode, sessions, and lifestyle intent.

## 5. Proposed Stage B — UX / Information Architecture Blueprint

### 5.1 App shell
Persistent shell should feel like one coherent music environment rather than a collection of pages.

Desktop:
- Left navigation rail / expandable sidebar
- Central content stage
- Optional contextual right rail
- Persistent compact music cockpit

Mobile:
- 5-item bottom navigation: Home / Discover / Sessions / Library / Profile
- Persistent compact cockpit above navigation when music is active
- Cockpit expands into a full-screen/near-full-screen Now Playing experience
- No controls or chat should be obscured by fixed UI

### 5.2 Home — "For You"
Home should be a personalized listening environment, not a generic dashboard.

Recommended hierarchy:
1. Greeting + current identity/presence
2. Continue listening / resume context
3. Personalized discovery
4. Recently played / familiar favorites
5. Mood & lifestyle contexts
6. Friends / public listening activity
7. Sessions worth joining
8. Curated editorial / emerging discovery

New-user state:
- Short preference onboarding rather than an empty feed.
- Ask for artists, languages, genres, moods, and use cases.
- Use those signals to immediately create a useful first home feed.

### 5.3 Discover
Discover is the exploration engine.

Sections should be context-driven instead of static:
- Search
- Trending in your language/region
- Because you listened to...
- Artist discovery
- Language discovery
- Mood discovery
- Lifestyle: Focus / Gym / Couple / Chill / Travel etc.
- Public rooms
- Community moments / recommendations

### 5.4 Sessions
Sessions is a primary destination and social control center.

Core states:
- Discover public rooms
- Create room
- Join existing room by name, ID, or link
- Invitations
- Active room
- Participants
- Shared playback
- Queue
- Chat/reactions
- Host controls
- Host transfer
- Room discovery/public visibility

The active room should feel like a distinct social space without removing the rest of the app's identity.

### 5.5 Library
Library should focus on the user's relationship with music:
- Liked
- Playlists
- Recently played
- Imported playlists
- Saved sessions/moments (future)
- Offline/downloads where supported

### 5.6 Profile
Profile should become a social identity hub:
- Avatar
- Visible username/handle
- SyncBeat ID
- Listening identity / genres / languages
- Friends
- Friend requests
- Room invites
- Listening activity/privacy
- Account/auth
- Preferences
- Appearance/audio settings

### 5.7 Music cockpit
Compact state:
- Artwork
- Track / artist
- Play/pause
- Forward
- Like
- Progress hint

Expanded cockpit:
- Large artwork / visual atmosphere
- Full playback controls
- Queue
- Lyrics
- Session context
- Share
- Playback settings
- Equalizer
- Output/quality controls

The cockpit should feel like the app's signature interaction, not a generic media bar.

## 6. Discovery / Recommendation Architecture Direction

Future recommendation system should be modular and explainable.

Signal groups:
- Explicit preferences: artists, languages, genres, moods
- Behavioral: plays, skips, repeats, likes, saves, playlist edits
- Context: time, day, device, current mode, focus/gym/couple intent
- Social: friends' activity, public room trends, shared listening
- Freshness: new releases, emerging artists, changing tastes

Recommendation output types:
- Track rows
- Artist modules
- Mood collections
- Contextual mixes
- Public room recommendations
- "Because you listened to..." explanations

Do not make recommendations feel like an opaque algorithmic feed.

## 7. Design System Direction

### Color
- Base: near-black obsidian surfaces
- Secondary: graphite/charcoal surfaces
- Glass: restrained translucent white/gray layers
- Accent: one primary restrained accent with limited semantic supporting colors
- Status colors reserved for states, not decoration

### Typography
- Strong display style for identity/headings
- Highly readable UI/body text
- Monospace only for technical/session metadata where useful
- Clear typographic hierarchy rather than excessive font-size variation

### Surfaces
- Soft rounded geometry, but not every element as a floating card
- Use sections, dividers, depth and whitespace to avoid card overload
- Glass primarily for high-value overlays/cockpit/session surfaces

### Motion
- Subtle and purposeful
- Transitions reinforce navigation, playback state, room state, and mood
- Avoid animation for decoration alone

## 8. Architecture Direction Before Implementation

The UI redesign should separate concerns clearly:

### App shell state
Navigation, modal state, viewport-specific layout, player visibility.

### Playback domain
Current track, queue, position, playback state, YouTube player lifecycle.

### Session domain
Room membership, host, room state, shared queue, shared playback authority, chat/reactions.

### Identity/social domain
Auth, profile, username, SyncBeat ID, friends, friend requests, room invites.

### Discovery domain
Search, recommendation signals, discovery feed, public rooms.

### Library domain
Likes, playlists, history, imports, downloads.

### Focus/lifestyle domain
Focus timer, stopwatch, ambient sound, mood/mode contexts.

Avoid a single `App.tsx` becoming the permanent owner of every domain.

## 9. Stage B Questions — Pending Product Decisions

1. Home hero/first viewport name: **For You**, **Your Flow**, **Cineosync**, **Listen Now**, or another name.
2. Public-room presentation: Discover, Sessions, or both with different presentations.
3. Accent behavior: one global restrained accent vs context/mode-specific accent variants.
4. Expanded cockpit presentation: full-screen route, bottom sheet, or immersive overlay.
5. Username semantics: globally unique/editable username vs stable SyncBeat ID plus editable username.
6. Onboarding: upfront preference setup vs progressive non-blocking setup.

## 10. Decision Log

### 2026-08-18 — Product redesign reset
**Decision:** Stop treating the current UI as final. Begin a structured redesign while preserving/improving functionality.

**Decision:** Maintain a living project-context file in the repository so important product/architecture decisions remain available across future conversations.

**Decision:** Redesign will happen through discovery → UX architecture → visual system → technical architecture → implementation → verification.

### 2026-08-18 — Stage A product direction locked
**Decision:** Product positioning is **music + lifestyle**, with a creative and unique identity.

**Decision:** Personalized discovery should adapt to user history and, for new users, explicit preferences such as artists, languages and genres.

**Decision:** Primary navigation is **Home / Discover / Sessions / Library / Profile**.

**Decision:** Sessions is a **major destination** rather than a secondary feature.

**Decision:** The player should become a **music cockpit**.

**Decision:** On mobile, Play/Pause, Forward and Like are the three always-reachable controls.

**Decision:** Visual system direction is **Obsidian + subtle glass + restrained accent color**.

**Decision:** The design language should be distinct and not a visual copy of mainstream platforms.

**Decision:** Cineosync Music includes a **public discovery layer** in addition to private/friends-first experiences.

**Decision:** Usernames/handles are visible first-class identity throughout the app.

**Decision:** Product name is **Cineosync Music**.

**Decision:** Stage A is substantially complete. Proceed to Stage B information architecture refinement, then Stage C visual system, then technical architecture and implementation.

## 11. Future Decision Template

### [DATE] — [Decision title]
**Context:**

**Decision:**

**Why:**

**Alternatives considered:**

**Impact on architecture/UI:**

**Implementation milestone:**

**Commit:**

**Deployment:**

**Verification:**

**Known follow-ups:**
