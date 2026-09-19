# Miss Aria V20 Unified Upgrade

This build layers the V16/V17/V18/V19/V20 workspace on top of the previous V15 command-center package.

## Included
- Unified AI/media command center
- Research and coding workspace entry points
- Image Studio/File AI/Music/Media/Games navigation
- Voice AI entry point
- Favorites store
- Block/unblock/report commands
- Privacy controls entry point
- Achievements and streak profile
- Account/profile statistics
- Advanced admin center entry point
- Protected web dashboard with `/health` and `/admin`
- No-signup flow preserved
- Existing tiny-caps/rich-text UI preserved
- Existing chat archive, saved response and AI-mode systems preserved

## Render
Set:
- `TELEGRAM_BOT_TOKEN` (or `BOT_TOKEN`)
- `ARIA_DASHBOARD_KEY` to a long random secret if you want the `/admin` dashboard enabled.

Render supplies `PORT` automatically. `/health` returns JSON and `/admin?key=...` is protected by `ARIA_DASHBOARD_KEY`.

Do not commit `.env` or generated `data/` files.
