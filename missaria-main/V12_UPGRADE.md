# Miss Aria V12 — AI Companion Upgrade

This build keeps the no-signup Telegram flow and adds a unified companion layer.

## Included
- No signup gate for Telegram chat or image generation.
- Persistent AI mode preference: Chat/Auto, Coding, Research, Creative, Tutor.
- Automatic mode detection when Chat/Auto is selected.
- `/ai` and `/modes` mode selector.
- `/memory` toggle and history clearing.
- `/clear`, `/regenerate`, `/continue`, `/improve`.
- `/v12` and `/features` companion dashboards.
- AI reply action buttons: regenerate, mode, improve, continue, clear, usage.
- Persistent preference file: `data/aria-preferences.json`.
- Existing image, media, games, premium and admin systems preserved.
- Rich Telegram HTML and tiny-caps formatting preserved.

## Important
The bot still uses the existing configured AI/media providers and existing command handlers. V12 adds the companion controls around those systems rather than replacing provider implementations.

Do not commit `.env` or API keys.
