# Refactor layout

`bot.js` is now the application bootstrap only. It creates the Telegram client,
creates the runtime, connects services, registers handlers, and starts the bot.

- `core/runtime.js` — shared application state, configuration, helpers and services used by handlers.
- `connectors/index.js` — service/feature connectors and global Telegram message patching.
- `handlers/index.js` — handler registry.
- `handlers/01_*.js` … `08_*.js` — extracted Telegram event/command handlers, kept in original registration order.
- Existing `services/`, `commands/`, `utils/`, `games/`, etc. remain intact.

No handler code was intentionally rewritten; it was moved behind a runtime context
to reduce the risk of changing behavior during the structural refactor.

IMPORTANT: the original source contained hard-coded API-key material. Rotate any
real keys that were ever exposed and place replacement values in `.env`.

## Agent V2 additions

The Hermes-style layer now has persistent task history (`agent/taskStore.js`), recent agent conversation sessions (`agent/session.js`), risk helpers (`agent/policy.js`), richer planner context, and agent utility commands. High-impact tools continue to require confirmation.
