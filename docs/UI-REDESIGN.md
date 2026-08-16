# SyncBeat UI Redesign Blueprint

This branch begins the 2026 product redesign of SyncBeat.

## Product position

SyncBeat is a personal music operating system: music discovery + listening together + focus + personal collection.

The interface should borrow proven information-architecture patterns from major music/social products without visually copying them.

## Navigation

Desktop:
- Home
- Discover
- Your Library
- Listening Rooms
- Focus
- collection shortcuts
- AI Mix
- Import

Mobile:
- Home
- Discover
- Library
- Rooms
- You

The persistent player sits above mobile navigation and remains the primary global control surface.

## Visual language

- cinematic dark neutral foundation
- restrained violet/rose accent system
- editorial hierarchy instead of dashboard grids
- medium information density
- artwork is the emotional layer
- glass is used sparingly for depth, not as the default component style
- rounded corners are purposeful and consistent
- motion communicates state and navigation

## Signature concepts

### Listening Rooms
A room is a music lounge, not a video call. Current song, synchronized playback, presence, shared queue, chat and reactions are the core.

### Moments
A reaction can be attached to an exact playback position. Example: `❤️ 02:17 — this part hits different.`

### Focus Rooms
Listening Rooms can become quiet shared focus spaces with synchronized music and timers.

### AI Mix
Gemini can generate structured playlist intents, but recommendations must resolve to real songs available from the application's catalog/provider integrations.

## Implementation rule

Redesign the UI in layers. Preserve the existing audio engine, WebSocket synchronization, song/playlist models and working feature behavior while progressively replacing the prototype presentation.
