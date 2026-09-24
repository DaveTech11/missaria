# /tiktok — post a video to a user's TikTok account

## What it does
- `/linktiktok` — a user connects their TikTok account (OAuth, PKCE, no password ever touches the bot).
- `/tiktok` (as a reply to a video, or as the caption on a video you send) — uploads that video to the replying user's TikTok, using the Content Posting API's Direct Post flow. Text after the command becomes the TikTok title, e.g. `/tiktok my clip 🔥`.
- `/unlinktiktok` — forgets that user's stored tokens.

Each Telegram user connects **their own** TikTok account — there's no shared/bot-owned TikTok account involved.

## One-time setup (you, the bot owner)

1. Go to https://developers.tiktok.com/ and create an app.
2. Add the **Login Kit** and **Content Posting API** products to it.
3. Under Login Kit → redirect URIs, add:
   `https://<your-render-app>.onrender.com/tiktok/callback`
   (Render sets `RENDER_EXTERNAL_URL` automatically, which the bot uses to build this — just make sure the URI you register matches exactly, including `https://` and no trailing slash before `/tiktok/callback`.)
4. Request the `video.publish` scope for Direct Post (also works with just `video.upload` — see the note below).
5. Copy the **Client Key** and **Client Secret** into your environment:
   ```
   TIKTOK_CLIENT_KEY=your_client_key
   TIKTOK_CLIENT_SECRET=your_client_secret
   ```
   Optional override if you don't want the auto-detected Render URL:
   ```
   TIKTOK_REDIRECT_URI=https://your-domain.com/tiktok/callback
   ```

## The "private until audited" restriction — this is TikTok's rule, not a bug
Until your app passes TikTok's compliance audit, **every video it posts is forced into private/self-only visibility**, no matter what privacy level is requested, and only up to 5 distinct users can post through an unaudited app in a rolling 24-hour window. This is documented TikTok platform behavior for all unaudited Content Posting API clients — the bot already defaults to `SELF_ONLY` and tells the user this in the confirmation message, so there's no surprise "why is my video private" moment. Once you submit for audit and pass it, posts made with a broader `privacy_level` will actually go public.

## Files added
- `memory/tiktokTokens.js` — per-user token store (in-memory, same pattern as `memory/codeState.js`)
- `services/tiktokAuth.js` — OAuth/PKCE flow, token refresh, the `/tiktok/callback` HTTP handler
- `services/tiktokUpload.js` — `creator_info/query` → `video/init` → chunked `FILE_UPLOAD` → `status/fetch` polling
- `handlers/tiktokHandler.js` — the three Telegram commands
- `server/ariaDashboard.js` — added the `/tiktok/callback` route (it already receives `ctx.bot`, which is needed to message the user once the connection completes)

## Limits worth knowing
- Downloads capped at ~45MB per video (Telegram's own Bot API file-download limit is ~20MB unless you're running a local Bot API server with a higher cap — the bot will tell the user if a video is too big rather than fail silently).
- TikTok caps the Content Posting API at 6 requests/minute per user access token — fine for normal use, but rapid repeated `/tiktok` taps from the same user could hit it.
