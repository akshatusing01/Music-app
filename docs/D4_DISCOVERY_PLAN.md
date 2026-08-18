# Cineosync Music — D4 Discovery Implementation Plan

## Status

**D4 is now the active milestone.**

## Objective

Turn the new Cineosync shell into a useful discovery experience while preserving the existing real search, playback, library and session engines.

## Product behavior

### For You

Priority order:
1. Continue Listening — use real recent listening/history data.
2. Personalized recommendations — use existing likes, history and available preferences.
3. New-user taste setup — only when useful data is absent.
4. Mood/lifestyle modules — Focus, Gym, Couple, Chill, Travel and similar contexts.
5. Social activity — friends/public listening where data is available and privacy permits.
6. Recommended public sessions.
7. Editorial/emerging discovery.

### Discover

Primary exploration modes:
- Search
- Artists
- Languages
- Genres
- Moods
- Lifestyle modes
- Public sessions
- Contextual recommendation modules

## Data rules

- Do not introduce fake/demo tracks or albums as production discovery content.
- Prefer real data already available through the application's search, history, likes, playlists and session systems.
- If a module has insufficient data, show an intentional empty/first-use state instead of fabricated content.
- Recommendation labels should explain why content appears when practical (for example, "Because you played …").
- Discovery must not interrupt an active session or navigate a user out of a room.

## New-user experience

A new user should be able to explore immediately.
If personalization needs more information, present a concise progressive setup for:
- favorite artists
- languages
- genres
- moods/use cases

Do not force a long onboarding wall before the user can use the product.

## UI direction

Editorial Luxury × Intelligent Music:
- large curated visual anchors
- strong typography
- generous whitespace
- compact high-information track rows
- restrained glass only for transient/high-value controls
- no generic dashboard card grid
- no excessive AI badges

## Technical boundary

D4 must consume normalized discovery/playback contracts. UI components must not directly own YouTube, Supabase or WebSocket logic.

## Acceptance criteria

- Search remains functional.
- Existing playback remains functional.
- For You can render real recent listening data when available.
- New users receive a useful first-use state without fake content.
- Discover supports existing search/exploration capabilities.
- Public sessions can be surfaced without breaking room state.
- Navigation remains stable on mobile.
- Music Cockpit remains persistent and usable.
- No default AI-generated tracks/images are added.
- Loading, empty and error states are intentional and accessible.

## Next implementation sequence

1. Inspect current data available to Home/Discover.
2. Normalize recommendation/display models.
3. Build reusable discovery modules.
4. Compose For You.
5. Compose Discover.
6. Test navigation + playback + session continuity.
7. Record production verification and deployment status.
