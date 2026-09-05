# Miss Aria v11 — Smart Autonomous Moderation

Telegram-only upgrade. WhatsApp functionality is unchanged.

## Added
- Raid protection based on rapid member joins and message spikes.
- Temporary automatic group lockdown with automatic restore.
- Incident records for raid activations and automatic recovery.
- Admin-aware moderation remains in place; Telegram group admins are ignored by normal Auto-Mod.
- Group-admin natural language controls for raid protection.
- Group health output now includes Raid Protection state and a safety recommendation.
- Existing allow-listed tools, confirmation flow, action journal, automation rules and v10 group authorization remain intact.

## Examples
- `Aria, enable raid protection in Zuno`
- `Aria, disable raid protection in Zuno`
- `Aria, health Zuno`
- `Aria, simulate lock Zuno`

Raid protection is disabled by default for existing groups until an owner or authorized group admin enables it.
