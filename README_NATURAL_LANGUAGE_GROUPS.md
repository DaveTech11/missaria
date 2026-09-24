# Natural-language group control + reports (this round)

## What changed

**1. Real AI intent understanding — `src/ai/intentClassifier.js` (new)**
A message that doesn't match any of `ownerRouter.js`'s existing regex
patterns now gets one AI call (reusing the same OpenRouter setup bot.js
already uses — `OPENROUTER_API_KEY`, model `google/gemini-2.5-flash` by
default, override with `INTENT_MODEL`) that classifies it into a tool +
arguments + which group was meant. This is additive: every regex pattern
that already worked still runs first and still works exactly as before —
the AI layer only fires as a fallback, and it's the *only* path for
non-owner admins (see below), since hand-writing regex for every phrasing
a stranger might use isn't practical the way it is for you.

So "give me a report on zuno group", "how's zuno doing", "what's the
status of zuno" all now work, without needing an exact phrase match.

**2. Group admins (not just you) can now DM Aria to control their group**
Previously every tool in `src/ai/tools/` was OWNER-only, and the whole
natural-language router hard-stopped for anyone who wasn't you. Now:
- Tools scoped to *one specific group* (moderation, anti-link, lock,
  warn/ban/mute, promote/demote/remove, group settings, invite link,
  rename, etc.) are `PERMISSION.GROUP_ADMIN` instead of `PERMISSION.OWNER`.
- Tools that affect the whole bot/account (list of all groups, create/
  leave a group, block/unblock, restart, profile) are still owner-only.
- `toolExecutor.js` — unchanged — already re-checks `isSenderGroupAdmin`
  against live WhatsApp state for every `GROUP_ADMIN` tool call, so this
  was safe to flip without touching the enforcement itself.
- If someone who isn't you DMs Aria, `ownerRouter.js` now checks whether
  they're an admin in any group where Aria is *also* admin
  (`groupResolver.listControllableGroups`). If yes, they can talk to her
  naturally about *that* group only — she resolves "in Zuno" the same way
  she does for you, but can never resolve a group outside their own list.
  If no, nothing changes for them (falls through, same as today).

**3. New tool: `getGroupReport`** (`src/ai/tools/reports.js`)
One combined report — member/admin counts, bot-admin status, anti-link,
lock status, edit-info restriction, warning counts — instead of having to
ask for moderation status and stats separately. This is what "give me
reports on X group" resolves to.

**4. "?" = question, no "?" = command**
Whether a message ends in "?" now decides what the AI classifier is even
allowed to pick:
- Ends in **"?"** → she only looks things up (report, moderation status,
  member/admin list, group settings, invite link) — she will never lock,
  unlock, kick, warn, ban, mute, rename, etc. from a question, even if the
  sentence sounds like a request ("can you lock zuno?" still just answers,
  doesn't lock it).
- **No "?"** → full tool set, including every action, exactly as before.

This is enforced twice: the tool *menu* handed to the AI is literally
smaller for a question (so there's nothing mutating to even pick from),
and the prompt also tells it "this is a question." Belt and suspenders.

## Try it
From a DM (you, or an admin of a group Aria also admins):
- "hey aria give me reports on zuno group"
- "how's the zuno group doing"
- "lock zuno" / "turn on anti-link in zuno"
- "warn John in zuno" / "kick +234... from zuno"

## Known limits / what I didn't do
- The AI classifier's tool menu is currently scoped to group-management +
  reporting (the thing you asked for). It doesn't expose every OWNER tool
  (scheduling, business/contacts/calls tools, etc.) — that's a much bigger
  prompt and higher chance of the model picking something risky from a
  huge menu. Easy to extend the manifest in `intentClassifier.js` later.
- `services/whatsappService.js` only calls the new non-owner path for DMs
  that pass a cheap keyword pre-filter (`GROUP_CONTROL_HINT_RE`) — just
  to avoid a group lookup on every random stranger's DM. This is a
  performance gate, not a security one; real authorization is unchanged.
- Every syntax-checked (`node --check`) clean across the whole project;
  I could not run it live (no network/WhatsApp session in this sandbox),
  so the actual AI-call path and live group lookups are unverified beyond
  that.
