# Miss Aria Premium Coding

Coding/developer agent requests are Premium-gated. Premium users have coding access automatically. Free users can unlock coding for **100 points for 5 hours** with `/coding unlock`.

Commands:
- `/coding` — show coding access
- `/coding status` — check access
- `/coding unlock` — spend 100 points and unlock 5 hours

The gate is enforced both in the Telegram handler and inside the agent runner so coding cannot be reached by bypassing the command handler.


## Coding AI provider
All Premium Coding / Code Studio requests use the Rebix Claude Haiku 4.5 endpoint via `services/claudeHaiku.js`: `https://api-rebix.vercel.app/api/claude-haiku?q=...`.
