# Cineosync Music — Real Playlist Import

## Supported sources

### YouTube
- Public YouTube playlist URLs/IDs are imported directly through YouTube Data API v3.
- `VITE_YOUTUBE_API_KEY` is required.
- Pagination is handled, deleted/private videos are skipped, and every imported track keeps its YouTube video ID for playback.
- YouTube account OAuth remains optional for loading a user's own playlists.

### Spotify
- Spotify import uses Authorization Code with PKCE; no client secret is shipped to the browser.
- Required environment values: `VITE_SPOTIFY_CLIENT_ID` and an exact HTTPS `VITE_SPOTIFY_REDIRECT_URI`.
- The user authorizes playlist-read scopes, Cineosync reads playlist metadata/items, then matches each track to a playable YouTube result.
- Spotify access/refresh tokens are kept in browser storage for the connector. If Spotify returns an expired refresh token, the connector clears it and requires reauthorization.

### CSV / M3U
- CSV accepts `title,artist` headers or two-column artist/title rows.
- M3U/M3U8 accepts exported playlist paths and derives track metadata from filenames.
- Each imported entry is matched against YouTube before it is added.

## No fake fallback

A failed import is now an error. Cineosync never fills an imported playlist with unrelated demo/default songs.

## Playback model

Imported Spotify and file-export tracks are metadata imports. Cineosync uses matching playable YouTube videos for playback rather than downloading or streaming protected Spotify content.

## Production checklist

- [ ] Add YouTube API key to Vercel.
- [ ] Create Spotify Developer app if Spotify import is desired.
- [ ] Add the exact Vercel HTTPS URL to Spotify's redirect URI allowlist.
- [ ] Set `VITE_SPOTIFY_CLIENT_ID` and `VITE_SPOTIFY_REDIRECT_URI` in Vercel.
- [ ] Redeploy after environment changes.
- [ ] Test one public YouTube playlist.
- [ ] Test one Spotify playlist after OAuth configuration.
- [ ] Test one CSV/M3U export.
- [ ] Confirm imported playlists persist in Cineosync Library.
