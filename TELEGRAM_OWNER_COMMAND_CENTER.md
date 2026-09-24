# Miss Aria — Telegram Owner Command Center

This upgrade is **Telegram-only** for the requested owner/group-control experience. Existing WhatsApp code is not used by these Telegram owner features.

## Owner authentication
The Telegram owner is identified only by numeric Telegram user ID:
`OWNER_TELEGRAM_ID` (recommended), falling back to the project's existing `OWNER_ID` for compatibility.

A display name, username, or message claiming to be the owner is never trusted.

Example `.env`:
`OWNER_TELEGRAM_ID=123456789`

## Persistent scheduler
`services/telegramScheduler.js` stores tasks in `data/telegram_scheduler.sqlite`, so tasks survive restarts.

Each task contains:
`id`, `ownerJid`, `targetJid`, `action`, `payload`, `schedule`, `createdAt`, `status` (plus `lastRunAt` for recurring-task bookkeeping).

Only the configured Telegram owner can create/cancel tasks. Actions are allow-listed: `sendMessage`, `lock`, `unlock`, `antiLink`, and `welcomeMessage`.

## Owner center
Commands:
`/aria`, `/owner`, `/menu`, `/status`, `/groups`, `/tasks`, `/diagnostics`, `/help`, `/restart`

Natural language is also supported for the owner, including:
- `Aria`
- `Aria, what is your status?`
- `Aria, list my groups.`
- `Aria, which groups are you admin in?`
- `Aria, run diagnostics.`
- `Aria, show my reminders.`
- `Aria, schedule a reminder in Zuno tomorrow at 9 AM saying the meeting starts at 10.`
- `Aria, cancel reminder <task-id>`

## Security
No AI interface is given arbitrary JavaScript, `eval`, `new Function`, arbitrary shell commands, or arbitrary filesystem access. Telegram operations are explicit and allow-listed.

## Telegram API reality
The Bot API cannot enumerate every group a human belongs to, cannot expose a complete participant list, and cannot let a bot promote itself to administrator. The UI therefore verifies admin status live and reports unsupported operations honestly.
