# Cineosync Music — Stage D Architecture Audit

## Purpose
This audit defines the implementation boundary for the redesign. Preserve working music/session capabilities while replacing accumulated prototype UI patterns with a coherent product architecture.

## Architectural principles
1. One source of truth per concern.
2. Typed component contracts; no ad-hoc prop aliases.
3. Playback state is separate from presentation state.
4. Session state is server-authoritative.
5. Supabase owns durable identity/social/profile data.
6. WebSocket room state owns ephemeral realtime session state.
7. YouTube is a playback provider, not the product identity.
8. Design primitives contain no business logic.
9. Mobile is first-class.
10. Every major feature has loading, empty, error, offline/reconnect, and permission states.

## Target architecture
```text
src/
  app/                  # shell, routes, providers, error boundaries
  design/               # tokens, primitives, patterns
  features/             # discovery, playback, sessions, library, profile, social, focus, onboarding
  data/                 # youtube, supabase, realtime, storage adapters
  state/                # playback, session, user, library stores
  shared/               # domain types, hooks, utilities
```

The migration is incremental; do not perform a risky all-at-once rewrite.

## Responsibility boundaries
**App shell:** routing, global providers, navigation, responsive layout, top-level boundaries. No playback/chat/recommendation logic.

**Playback engine:** provider lifecycle, normalized track, queue, play/pause, seek, next/previous, progress, likes, provider synchronization. UI only observes it.

**Session engine:** room membership, host, shared track/queue, authoritative playback snapshot, chat, presence, host transfer, invites, reconnect.

**Discovery:** search, recommendation modules, personalization inputs, public room discovery, editorial/contextual collections.

**Social:** profiles, usernames, SyncBeat IDs, friends, friend requests, room invitations, activity visibility.

**Auth/profile:** Supabase Auth is identity authority; profile rows are durable metadata; avatars belong to authenticated user storage paths.

**Design system:** visual composition only; never directly call Supabase, WebSocket, or YouTube APIs.

## State model
**User:** auth session, profile, username, SyncBeat ID, avatar, preferences, privacy.

**Playback:** provider, track, queue, index, playing, position, duration, volume/mute, repeat, shuffle, liked.

**Session:** room ID/name, host ID, participants, shared playback snapshot, queue, chat, connection, invitations.

**UI:** cockpit expansion, selected tab, sheets/modals, search/filter state, transient notifications.

UI state must never become a hidden substitute for domain state.

## Session synchronization contract
Server-authoritative fields:
- roomId
- version
- serverTimestamp
- track
- position
- playing
- playbackRate
- queue
- hostId

Clients reconcile their local YouTube player to this snapshot. Non-host local play/pause/seek cannot silently create a new room timeline. Monotonic versions reject stale events.

## Room lifecycle
**Create:** authenticate → create room identity → creator becomes host → broadcast snapshot.

**Join:** validate room name/ID/link → never create a room on failed lookup → return snapshot → presence → reconcile player.

**Disconnect:** remove participant → deterministic host election if required → broadcast updated snapshot.

**Transfer:** only current host may transfer → target must be active → increment version → broadcast.

## Playback boundary
YouTube IFrame API is hidden behind a normalized Track/playback adapter. The rest of Cineosync must not depend on YouTube-specific UI. This keeps future legal providers possible without rewriting the product.

## Auth/social boundary
Supabase Auth is account identity. People-facing identity is editable unique username + avatar. Stable backend identity is immutable UUID/SyncBeat ID. Social actions require authentication.

## UI migration
**Keep initially:** working provider adapters, Supabase connection/auth primitives, WebSocket transport while normalized, validated persistence utilities.

**Refactor:** App prop wiring, duplicated auth/controller logic, mixed UI/domain state, player/session coupling, room URL/name parsing, mobile fixed-player layout, profile/social service boundaries.

**Replace:** legacy dashboard UI, obsolete prototype paths, generic AI-generated artwork/tracks, UI exposing YouTube as product identity, conflicting component contracts.

**New:** Cineosync design system, Editorial Luxury × Intelligent shell, For You, Discover, Music Cockpit, redesigned Sessions, social identity surfaces, progressive onboarding.

## Implementation sequence
### D1 — Foundation
Freeze functional baseline; add design tokens; establish domain types; add global error/loading/offline boundaries; remove obsolete prototype assets/dead UI.

### D2 — Shell
Responsive shell; five-tab navigation; desktop rail/contextual layout; mobile safe-area and viewport rules.

### D3 — Cockpit
Compact + expanded cockpit; normalized playback state; touch targets and stacking validation.

### D4 — For You / Discover
Editorial modules and recommendation placeholders using existing search/history data; new-user state.

### D5 — Sessions
Rebuild room UI on normalized session state without breaking realtime; two-device playback/chat validation.

### D6 — Library/Profile/Social
Rebuild library/profile; auth entry; avatar, username, SyncBeat ID, friends, room invites.

### D7 — QA
Mobile browser matrix, desktop responsive matrix, two-device realtime, authentication, search/playback/queue, reconnect/error tests.

## Non-negotiable acceptance criteria
- Search remains functional.
- Real tracks play without making YouTube the product identity.
- Joined members receive the same track and host-authoritative timeline.
- Non-host controls cannot permanently desynchronize the room.
- In-room search does not leave the room.
- Room-name lookup never silently creates a room.
- Chat remains usable on small screens.
- Host transfer is server-authoritative.
- Authenticated users have durable username/avatar/SyncBeat identity.
- Friend/room invitations require authenticated identities.
- No production secrets in client bundles.
- No default/demo AI-generated tracks or images in production UI.
- Touch targets, keyboard navigation, contrast, reduced motion and error states are handled.

## Risks
- YouTube mobile autoplay restrictions.
- WebSocket durability across serverless deployment instances.
- In-memory room state disappearing across restarts/instance changes.
- Duplicate events/reconnect races.
- Stale playback events.
- Supabase RLS errors.
- Public room spam/abuse.
- Client-side provider secrets.

## Stage D status
Architecture direction approved. Next: design-token specification and screen-by-screen implementation plan before major UI rewrite.
