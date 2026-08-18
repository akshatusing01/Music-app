# Cineosync Music — Project Context

> Living source of truth for product decisions, UI direction, architecture, implementation milestones, bugs, and testing notes.
>
> **Rule:** Before any significant implementation change, update this file with the decision. After implementation, record the commit/deployment and verification status here.

## Product
- Final name: **Cineosync Music**
- Positioning: creative music + lifestyle platform with social listening and public discovery.
- Emotional core: **Editorial Luxury × Intelligent Music**.
- Visual base: Obsidian + subtle glass + restrained accent.

## Locked UX
- Mobile primary navigation: **Home / Discover / Sessions / Library / Profile**.
- Sessions is a first-class destination.
- Home personalized destination: **For You**.
- Public rooms appear in Discover and Sessions.
- Player direction: signature **Music Cockpit**.
- Always-reachable mobile controls: Play/Pause, Forward, Like.
- Visible editable username; immutable internal SyncBeat ID.
- Progressive onboarding.

## Existing functionality to preserve/improve
- Real YouTube search/results and playback
- Queue/player controls
- Realtime listening rooms
- Room links and room-name joining
- Host-authoritative synchronization
- Mobile autoplay fallback
- Chat/reactions
- Host transfer
- In-room search
- Focus timer/stopwatch/ambient sounds
- Library/likes/playlists/history
- Supabase auth/cloud persistence
- Avatar upload
- Friend requests and room invitations

## Technical foundation
- React + TypeScript + Vite
- Vercel
- Supabase Auth/Database/Storage
- WebSocket realtime transport under `/api/ws`
- YouTube IFrame Player API
- Local persistence fallback

## Architecture rules
- One source of truth per concern.
- Playback state is separate from UI state.
- Session state is server-authoritative.
- Supabase owns durable identity/social/profile data.
- WebSocket owns ephemeral room state.
- YouTube is a provider adapter, not the product identity.
- UI components do not call providers directly.
- Mobile is first-class.
- Every major feature needs loading/empty/error/reconnect states.

## D1 — Design System
- Semantic obsidian surfaces and text tokens.
- Single Cineosync accent token.
- Editorial typography hierarchy.
- 4px spacing base.
- Restrained glass for cockpit/overlays/session controls.
- Minimum 44px touch targets.
- Visible focus states and reduced-motion support.
- Build tokens → primitives → patterns → screens.

## D2 — App Shell — IMPLEMENTED
The first working shell migration is now on `main`.

### Implemented
- Replaced legacy YouTube-like header branding with **Cineosync Music** branding.
- Reworked desktop header into a restrained obsidian/glass shell.
- Desktop navigation now prioritizes Home, Discover, Sessions, Library and Profile.
- Added compact session connection status.
- Added restrained language/profile/action controls.
- Added responsive mobile navigation drawer.
- Added fixed five-item mobile bottom navigation.
- Added mobile safe-area/content-bottom reservation so fixed navigation does not cover screens.
- Reworked desktop sidebar to match the new visual language and five-primary-destination structure.
- Kept Focus accessible as a secondary lifestyle mode rather than making it a sixth primary destination.
- Preserved existing App-level playback/session/domain handlers rather than replacing them during shell migration.
- Removed visible legacy YouTube Music branding from the shell.
- Removed the stock remote avatar from the new shell; profile currently uses a neutral local placeholder until the authenticated profile/avatar surface is migrated.

### D2 commits
- Navbar shell: `c48568dca6f265eef8f7364757cf3bcc0d4c7664`
- Design/shell CSS: `6292fb2a0df7561d4e9708fa21aaad85291d53d6`
- Desktop sidebar: `4ebdc374f496b0bbe8e47498e808ca8b04bce9bb`

### Verification status
- GitHub commit status for latest D2 commit reports Vercel deployment **pending** at the time of recording.
- Code has been changed through the GitHub integration, but a live mobile/desktop browser QA pass has **not** been claimed here.
- Next verification must cover: production build, mobile navigation, player/cockpit stacking, room chat visibility, active-room navigation persistence, search-in-room behavior, and desktop sidebar/header layout.

## Next milestones
1. D3 — Music Cockpit migration
2. D4 — For You / Discover
3. D5 — Sessions UI migration
4. D6 — Library/Profile/Social/Auth
5. D7 — full production QA

## Change log
- 2026-08-18: Product direction locked as Cineosync Music.
- 2026-08-18: Editorial Luxury × Intelligent selected as emotional core.
- 2026-08-18: Five-item mobile navigation locked.
- 2026-08-18: D1 design system documented.
- 2026-08-18: D2 shell implemented on main.
