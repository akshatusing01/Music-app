# Authentication + Data Completion Pass

## Scope

This pass makes authentication and persistence explicit production contracts.

### Authentication
- Supabase Auth is the identity provider.
- Email/password sign-up and sign-in remain supported.
- Google OAuth is implemented through `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- OAuth redirects back to the current application origin.
- The deployed application's origin must be registered in Supabase Auth URL configuration and the Google provider must be enabled/configured in Supabase. These provider-console settings cannot safely be created from the frontend repository.
- Auth state is persisted and auto-refreshed by the Supabase client.

### Durable user data
Authenticated user data should be persisted under the authenticated user's UUID, with RLS enforcing ownership:
- profiles
- likes
- listening_history
- playlists
- playlist_tracks
- friends / friend_requests
- room_invitations
- user preferences / onboarding state
- avatar storage objects

### Security rules
- Never put a Supabase service-role key in Vite/client environment variables.
- Client uses only the publishable/anon key.
- All private user tables require RLS.
- Users can read/write only records they are authorized to access.
- Public profile/discovery data should expose only explicitly public fields.

## Current code audit

The application already has:
- Supabase client with persistent sessions and URL session detection.
- Auth controller and modal.
- Google OAuth invocation.
- Cloud loading for profiles, likes, playlists and listening history.
- Cloud writes for likes, playlists, history and profiles.

## Remaining release gate

Because the Supabase management connector is unavailable in this execution, database migrations/RLS/provider settings cannot be applied or verified from this pass. They must be verified in the Supabase dashboard before declaring authentication/data completion.

Required production checks:
1. Enable Google provider and add Google OAuth credentials.
2. Add production Vercel origin to Supabase Redirect URLs.
3. Confirm `profiles`, `likes`, `listening_history`, `playlists`, `playlist_tracks` and social tables exist.
4. Confirm RLS policies for each table.
5. Confirm Storage avatar bucket + authenticated-user ownership policy.
6. Test Google login on production mobile and desktop.
7. Test session persistence after refresh/reopen.
8. Test logout and account switching.
9. Test data isolation using two accounts.
10. Test avatar upload/read/delete ownership.

## Button functionality standard

Every visible action must either:
- perform a real domain action,
- navigate to a real destination/state,
- open a functional modal/sheet,
- or be removed/marked unavailable.

No decorative controls are acceptable in production.
