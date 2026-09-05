# Miss Aria Telegram Owner Center v2

Telegram-only owner control upgrade.

## Owner authentication
Set `OWNER_TELEGRAM_ID` to the numeric Telegram user ID of the owner. The existing `OWNER_ID` is accepted as a fallback for compatibility.

## Added
- Owner dashboard with inline controls
- Stats and process diagnostics
- Audit log
- Confirmation tokens with expiry and one-time use
- Safe restart confirmation
- Group lock/unlock and anti-link controls
- Admin lookup
- Moderation log viewer
- Persistent tasks with pause/resume/cancel
- Run-now task execution
- Natural-language send/anti-link/status/group/task commands
- Allow-listed Telegram operations only; no eval, shell, arbitrary filesystem tools

## Important
Telegram Bot API limits still apply. A bot cannot enumerate every group a human belongs to, cannot self-promote, and cannot expose a complete participant list through a general participant endpoint.
