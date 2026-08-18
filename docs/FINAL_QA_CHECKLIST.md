# Cineosync Music — Final QA Checklist

## Production gate

A production deployment is only considered release-ready when:
- Vercel deployment status is SUCCESS.
- `/api/health` returns `status: ok`.
- No new build/type errors are reported.
- Current `main` commit is the deployed commit.

## Music

- YouTube search returns real playable results.
- Selecting a result loads the Music Cockpit.
- Play/pause/next/previous/seek/like behave correctly.
- Queue changes do not break playback.
- Search/discovery never shows fabricated tracks.

## Sessions

- Create public/private room.
- Join by exact room ID.
- Join by exact room name.
- Join by invite URL.
- Invalid room name returns an error without creating a room.
- Host changes song.
- Host pauses/plays/seeks.
- Guest cannot become playback authority.
- Guest local controls snap back to host state.
- Host transfer works.
- Host disconnect promotes a participant.
- Chat works on narrow mobile screens.
- Search inside room does not leave the room.
- Guest reload/reconnect reconciles to current room state.

## Social / identity

- Auth entry point is visible and usable.
- Email sign-in/sign-up works when Supabase auth is configured.
- Google sign-in works when the Supabase Google provider and production redirect are configured.
- Username remains visible throughout the UI.
- SyncBeat ID is stable and copyable.
- Avatar can be uploaded from device.
- Friend request send/accept/decline works.
- Room invitation send/accept/decline works.

## Mobile

- Bottom navigation never overlaps content.
- Music Cockpit never blocks chat/composer.
- Touch targets are at least 44px.
- Safe-area insets are respected.
- Keyboard/input focus remains usable.

## Accessibility / polish

- Focus-visible states exist.
- Reduced motion is respected.
- Empty/loading/error states are intentional.
- Text contrast remains readable.
- No obsolete Firebase assets/config remain.
- No generated placeholder avatars or seeded recent searches remain in user-facing production surfaces.

## Verification note

Automated/deployment verification and real-device verification are different gates. The latter must be performed on the deployed site with at least two browsers/devices for realtime session behavior.
