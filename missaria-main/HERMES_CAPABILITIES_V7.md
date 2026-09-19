# Miss Aria — Hermes-style Capability Matrix V7

Aria now exposes a Hermes-inspired architecture while keeping the Miss Aria personality and Telegram-first UX.

## Capability groups
- Web: search + extraction + safe URL reading.
- Browser: safe navigation adapter; full interactive browser requires an explicitly configured provider.
- Terminal/files: workspace-scoped file operations and allow-listed development commands.
- Coding: premium or 100 points unlocks 5 hours; clean architecture, checkpoints, tests, security review, explanations and interactive follow-up actions.
- Planning: multi-step plans, todo lists, result inspection and confirmation gates.
- Memory: persistent memories plus session search/recall.
- Skills: reusable Markdown skills and progressive loading.
- Automation: persistent reminders/scheduled tasks.
- Delegation: isolated sub-work units; provider-backed subagents can be connected later.
- Git: status, diff and recent history helpers.
- Media: image generation through existing provider; vision/TTS/video adapters are provider-gated.
- Computer use: explicit opt-in adapter; never enabled by default.
- MCP: discovery/readiness adapter; each server must be explicitly allow-listed before execution.
- Hosting: Render and Railway connectors remain owner-only.
- Telegram: group management, messaging, moderation and owner tools from the existing registry.

## Safety
High/critical actions require confirmation. Local tools are disabled unless `agentPolicy.allowLocalTools=true`; advanced integrations require `agentPolicy.allowAdvancedIntegrations=true`.

## Important
This is Hermes-style compatibility, not a claim that every external Hermes provider is magically available without credentials. Provider-specific capabilities need their corresponding API keys, drivers or MCP servers.
