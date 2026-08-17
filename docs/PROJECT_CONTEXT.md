# SyncBeat / Cineosync Music — Project Context

> Living source of truth for product decisions, UI direction, architecture, implementation milestones, bugs, and testing notes.
>
> **Rule:** Before any significant implementation change, update this file with the decision. After implementation, record the commit/deployment and verification status here.

## 0. Project Working Rules

- Product is evolving from a functional prototype into a real, polished app.
- Existing functionality should be preserved or improved while the UI is substantially redesigned.
- We will work in explicit stages:
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

## 1. Product Vision

Working concept: **premium social music listening platform**.

Core idea: personal music discovery + real-time shared listening + chat/reactions + focus/productivity experiences.

Important existing capabilities:
- Real YouTube music search/results
- Real YouTube playback
- Queue/player controls
- Real-time listening rooms
- Room invite links
- Room-name joining
- Shared host-authoritative playback synchronization
- Live chat/reactions
- Host transfer / automatic host promotion
- In-room YouTube search
- Focus timer / stopwatch / ambient sounds
- Library, likes, playlists, history
- Supabase-backed auth/cloud persistence foundation
- Profile avatar upload
- SyncBeat user ID/friend-code foundation
- Friend requests
- Room invitations

## 2. Current Technical Foundation

- Frontend: React + TypeScript + Vite
- Hosting/deployment: Vercel
- Realtime room transport: WebSocket endpoint under `/api/ws`
- Database/auth/storage: Supabase
- YouTube playback: YouTube IFrame Player API
- Existing local persistence remains part of the app for graceful fallback

## 3. Current UX Problems / Redesign Motivation

Known problems accumulated through prototype iterations:
- Mobile controls and fixed player can overlap content.
- Session UI can become too dense on small screens.
- Navigation and feature placement need a clearer platform-like structure.
- Some features are visually buried even when functional.
- Prototype/demo remnants must be removed from the final experience.
- UI needs stronger hierarchy, spacing, discoverability, and consistency.

## 4. Non-Negotiable Functional Principles

### Listening sessions
- Host is authoritative for shared playback timeline.
- Joined members should not create an independent playback timeline when using shared controls.
- Mobile autoplay restrictions must be handled gracefully with a user-gesture fallback.
- Joining a room by name must never create a fake/nonexistent room.
- Invite links must resolve to real existing rooms.
- Search/change-track must not accidentally disconnect a user from the active room.

### Identity/social
- Authenticated users should have a persistent account identity.
- Each user should have a readable unique SyncBeat ID/friend code.
- Profile pictures can be selected from the device and stored in Supabase Storage.
- Friend requests and room invitations must be tied to authenticated identities.

## 5. Redesign Process

### Stage A — Discovery
We ask questions about:
- target users and highest-value use cases
- product positioning
- navigation model
- content hierarchy
- player behavior
- sessions UX
- mobile-first interaction priorities
- social graph and profile experience
- visual personality

### Stage B — UX / Information Architecture
We define:
- app shell
- primary navigation
- secondary navigation
- home/dashboard structure
- search/discovery structure
- library structure
- session/room structure
- profile/social structure
- player hierarchy
- mobile navigation and gestures

### Stage C — Visual System
We define:
- color system
- typography
- spacing/grid
- surfaces/cards
- iconography
- motion
- artwork treatment
- states: loading/empty/error/offline/live

### Stage D — Architecture
We map UI features to:
- React component boundaries
- state ownership
- local persistence
- Supabase tables/auth/storage
- realtime WebSocket events
- YouTube player lifecycle
- routing/deep links

### Stage E — Implementation
Implementation happens in small, verifiable milestones. Each milestone records:
- scope
- affected files
- commit SHA
- deployment
- verification status
- known limitations

## 6. Decision Log

### 2026-08-18 — Product redesign reset
**Decision:** Stop treating the current UI as final. Begin a structured redesign while preserving/improving functionality.

**Decision:** Maintain a living project-context file in the repository so important product/architecture decisions remain available across future conversations.

**Decision:** Redesign will happen through discovery → UX architecture → visual system → technical architecture → implementation → verification.

## 7. Current Implementation Notes

- Supabase project: `vpkrrdhqpgzelcrsulec`
- Production site: `music-app-navy-iota.vercel.app`
- Main GitHub repository: `akshatusing01/Music-app`
- Current branch of record: `main`

## 8. Open Questions — Stage A

Answer these before we lock the new information architecture.

### A. Product positioning
1. What should the app feel like in one sentence: **premium music platform**, **social listening network**, **music + focus lifestyle app**, or a deliberate combination?
2. Which use case deserves the strongest emphasis on the home screen: solo listening, discovering music, listening with friends/couple, or focus/gym sessions?

### B. Navigation
3. For the primary mobile navigation, would you prefer:
   - Home / Search / Sessions / Library / Profile
   - Home / Discover / Sessions / Library / Profile
   - a custom 5-item structure you already have in mind?
4. Should Sessions feel like a first-class destination equal to Home, or more like a mode entered from music/search?

### C. Player
5. Should the player behave more like a modern compact bottom sheet (tap to expand), or a persistent mini-player with a separate full-screen Now Playing page?
6. Which 3 controls must always be instantly reachable on mobile?

### D. Visual direction
7. Do you want to retain the current dark/premium/neon aesthetic, or move toward something more refined/minimal such as **Obsidian + soft glass + restrained accent color**?
8. Should the redesign feel closer to mainstream music platforms for familiarity, or intentionally distinctive/experimental?

### E. Social experience
9. Should the app feel primarily private/friends-only, or gradually support public discovery of rooms/profiles?
10. Should the SyncBeat ID be prominently visible like a username/handle, or remain mostly inside Profile/Friends?

### F. Product naming
11. Is the product name for the new UI **SyncBeat**, **Cineosync Music**, or are we still deciding?

---

## 9. Future Decision Template

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
