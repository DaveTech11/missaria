# Miss Aria V10 Upgrade

## Menu
- Normal /start uses a separate user-focused menu with the same structured card style as the owner panel.
- Inline buttons are arranged 3 per row.
- Multi-page navigation uses PREV / page / NEXT.
- Admin panel remains restricted to bot admins and keeps the requested card structure.

## User features surfaced
Profile, Premium, Aria Agent, Coding Studio, Image Generation, Web Research, File Tools, Browser, Voice AI, Skills, Automation, History, AI Tools, Settings, Games, Downloads, Protection, Leaderboard, Help, Support, Developer, Add to Group.

## Admin features surfaced
Users, statistics, sessions, audit logs, moderation, system status, premium, admin management, ban/mute shortcuts, maintenance, backup, cache, AI/provider status, coding usage, jobs, integrations, memory and owner-only restart confirmation.

## Safety
High-impact admin operations remain admin/owner gated. Restart requires an owner confirmation. API keys are only reported as connected/not set; values are never displayed.

## Environment flags
- `ARIA_AGENT_MODE=true` enables the Aria agent command gateway.
- `ARIA_AGENT_LOCAL_TOOLS=true` enables restricted local tools.
- `ARIA_AGENT_ADVANCED_INTEGRATIONS=true` enables advanced integration paths where implemented.
