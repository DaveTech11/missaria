# Hermes-style Miss Aria Agent

This upgrade keeps Miss Aria's existing female/girl identity and branding. Hermes is
used only as the architecture inspiration.

## Agent capabilities
- iterative planning before tool execution
- safe allow-listed Telegram tools
- persistent per-user SQLite memory
- searchable memory recall
- reusable Markdown skills
- confirmation gates for high-impact actions
- existing owner/admin permissions remain enforced by Telegram Tool Registry
- provider stays compatible with the existing DeepSeek service

## Enable

Set:

`ARIA_AGENT_MODE=true`

Then restart the bot.

Use:

`/agent list my groups`

or:

`/agent lock the group named Example`

High-impact operations ask for confirmation before execution.

## Important

The agent does not receive raw Telegram API methods, shell execution, eval, arbitrary
filesystem access, or arbitrary HTTP tools. All Telegram actions remain behind the
existing permission/registry layer.

The existing Miss Aria handlers remain in place; this is an additive agent layer.
