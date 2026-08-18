# Cineosync Music — D5 Sessions Hardening

## Goal

Make Sessions resilient enough for repeated mobile use, reconnects and public discovery while preserving the working host-authoritative model.

## Required behavior

- Host remains authoritative for shared playback.
- Non-host play/pause/seek attempts never become the room timeline.
- Every authoritative playback update carries a monotonic room-state version.
- Clients ignore stale playback/queue/host events.
- Reconnecting clients reconcile from the latest room snapshot before rendering controls.
- Searching inside a room never navigates away.
- Joining by room name performs lookup only; failed lookup never creates a room.
- Join links remain shareable and parseable.
- Chat remains usable above the Music Cockpit on small screens.
- Host transfer is validated by the server.
- Host disconnect deterministically promotes the earliest active participant.

## Server state contract

Add a `version` counter to the room. Increment it for:
- current track changes
- play/pause
- seek
- rate changes
- queue updates
- host transfer
- relevant room metadata changes

Snapshots should include `serverTimestamp` so clients can extrapolate playing position once, and only once.

## Client reconciliation

Client keeps `lastRoomVersion` and ignores lower versions. On snapshot/reconnect:
1. replace room state
2. set last version
3. reconcile player
4. render controls

For a playing snapshot:
`authoritativePosition = snapshot.position + (now - snapshot.serverTimestamp) / 1000 * snapshot.playbackRate`

Do not add another time delta when the player adapter already received the corrected target position.

## Mobile layout

- Safe-area aware session content.
- Chat composer always reachable.
- Fixed Music Cockpit cannot cover chat input.
- Participants and host controls remain scrollable.
- Search results remain inside the active room.
- Interactive targets minimum 44px.

## Public discovery direction

Discover may surface public rooms; Sessions is the full room management workspace.
A public-room card should contain room name, host username, participant count, current track when available, mood/context and Join action.

## Verification checklist

- two phones join same room
- host plays / pauses / seeks
- guest taps controls and remains aligned with host
- host changes track while guest is active
- guest reloads while room is playing
- websocket reconnects after network interruption
- host transfer keeps playback state intact
- chat stays usable on narrow mobile viewport
- room link joins correct room
- bad room name produces error and does not create a room
