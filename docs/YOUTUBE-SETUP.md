# Real YouTube Search + Playback

The app now uses the official YouTube Data API for search and the official YouTube IFrame Player API for playback.

## 1. Create the API key

In Google Cloud Console:

1. Create/select a project.
2. Enable **YouTube Data API v3**.
3. Create an API key.
4. Restrict the key to the YouTube Data API.
5. Add HTTP referrer restrictions for your development and production origins.

For local development, allow the origin used by the app, for example:

`http://localhost:3000/*`

For production, restrict the key to the deployed domain.

## 2. Configure the app

Add:

`VITE_YOUTUBE_API_KEY=your_key_here`

Do not commit the key.

## 3. Search behavior

The app calls `search.list` with:

- `type=video`
- `videoEmbeddable=true`
- `videoSyndicated=true`
- `regionCode=IN`

It then calls `videos.list` to obtain duration and final embeddability metadata.

## 4. Playback behavior

Search results contain a YouTube video ID. The app passes that ID to the official YouTube IFrame Player API.

The application does not download, extract, proxy, or host YouTube audio.

The embedded player remains visible and retains YouTube's native player controls/branding.

## 5. Quota

YouTube search requests consume Data API quota. Keep the app's debounce and result limits in place for personal/limited-public usage.

## 6. Room synchronization

The existing WebSocket room layer synchronizes:

- play/pause
- seek position
- current track
- playback rate
- room queue state

The server remains authoritative for room playback state. Clients correct playback drift against the server state.
