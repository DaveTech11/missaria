# Miss Aria — Telegram Owner Center v4

## Telegram transport
All **new owner-center Telegram actions** use the existing `node-telegram-bot-api` `bot` instance. The new owner services do not call `api.telegram.org` directly and do not expose arbitrary Telegram method dispatch.

## Added
- Tool Registry with explicit allow-listed Telegram tools
- Owner-only authorization on every tool
- Confirmation tokens for destructive actions
- Multi-group controls and bulk emergency lockdown
- Group lock/unlock and anti-link control
- User moderation: ban, kick, mute, unmute, warn, unban, promote, demote
- Group admin listing through Telegram's administrator endpoint
- Natural-language owner command engine
- Scheduler v2 with once/daily/weekly schedules, timezone field, pause/resume, edit, run-now, retry and history
- Auto-moderation: links, blacklist, caps and flood detection
- Real-time local analytics for Telegram messages/groups/actions
- Security diagnostics and audit log
- JSON state backups and safe restore of known state containers
- Persistent owner memory notes
- Emergency mode for verified admin groups
- Better `/aria` control-center keyboard

## Examples

```text
Aria, list my groups
Aria, lock Zuno
Aria, turn anti-link on in Zuno
Aria, enable auto-mod in Zuno
Aria, mute 123456 for 30m in Zuno
Aria, ban 123456 in Zuno
Aria, promote 123456 in Zuno
Aria, send "hello" to Zuno
Aria, schedule a message tomorrow at 9 AM saying "hello" to Zuno
Aria, edit task abc1234567 saying "updated message"
Aria, remember that my default group is Zuno
Aria, lock every group
Aria, create a backup
```

## Security boundaries
No new owner feature provides `eval`, `new Function`, shell execution, arbitrary filesystem commands, or arbitrary Telegram method names. Telegram API limitations are respected; for example, the Bot API can list administrators but does not provide a general endpoint for enumerating every group participant.

Existing WhatsApp services and commands are left intact.
