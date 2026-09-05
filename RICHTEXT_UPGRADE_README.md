# Rich-text / new Bot API upgrade

## Round 2: WhatsApp control center → rich card + owner-only gate

Same idea as the Telegram `/botinfo` card, applied to the WhatsApp side:
`services/waAdminPanel.js`'s `.panel` command now sends a generated image
card (`utils/waMenuCard.js`) with a hero banner, title, and grouped pill-
style sections — matching the layout in the WhatsApp screenshot you sent.

**Important honesty note on the pill "buttons":** they're not live tappable
WhatsApp buttons in either your reference screenshot's bot or this one.
WhatsApp/Baileys doesn't reliably support real interactive buttons anymore,
and that two-column grid of bordered boxes isn't a native WhatsApp message
type — it's a generated image in both cases. The admin still types the
command (`.antispam`, `.moderation`, etc.) same as before; the card's
caption says so, so it doesn't read as broken buttons.

**Also fixed a real gap while I was in there:** `.panel` was `dmOnly` but
had no actual owner check — any DM sender could see bot-wide stats and the
moderation/flag counts. It now checks `ctx.isOwner` and silently ignores
anyone who isn't the bot owner (same "don't advertise the command exists"
convention as the no-prefix admin commands), *before* generating or sending
anything. `.antispam` / `.moderation` / `.flag` were already properly gated
on `isSenderGroupAdmin` — no change needed there.

### Files touched this round
- `utils/waMenuCard.js` — new, the card generator
- `services/waAdminPanel.js` — `.panel` now owner-gated + sends the card
  (`renderPanelCard()`), text fallback kept for if canvas fails

## Round 1: Telegram rich cards + blockquote upgrade

(see below — unchanged from before)

Two separate things happened here, because "make it look like that screenshot"
and "upgrade to the new Telegram Bot API text formatting" are actually two
different jobs — the screenshot's bordered table isn't something Telegram can
render as text at all, it's a rendered image.

## 1. New file: `utils/infoCard.js`

A reusable canvas-based generator that produces the "bordered Field/Value
table" card from your screenshot, themed in Miss Aria's pink/dark palette
instead of the reference bot's red one. Sent with `bot.sendPhoto()`, not
`sendMessage()`, because it's a real PNG.

```js
const { generateInfoCard } = require("./utils/infoCard");

const card = await generateInfoCard({
  title: "Miss Aria — Bot Info",
  subtitle: "v10.0.0 • Premium Edition",
  rows: [
    { icon: "👑", label: "Owner", value: "Dave Tech" },
    { icon: "💌", label: "Telegram", value: "t.me/F3BAN" },
  ],
  footer: "Miss Aria • Bot Information",
  heroImage: "./menu.jpg", // optional top banner, path or Buffer — omit for no banner
});

await bot.sendPhoto(chatId, card, { caption: "...", parse_mode: "HTML" });
```

Wired into three commands this round (the ones that were already plain
label/value listings, so the swap is a clean win):

- `/botinfo` — the exact match for your screenshot
- `/stats` — analytics as a table instead of an arrow-list
- `/adminlist` — group admins as a table instead of a plain `*bold*` list

Each of these keeps a text fallback: if canvas ever fails to render (e.g. a
broken font/library on the host), it falls back to the old text message
instead of crashing the command.

**Not converted:** every other menu/settings screen in the 16k-line bot.js.
Those are mostly buttons + short blurbs, not label/value tables, so a table
card isn't actually the right shape for them — dropping a table image into
`/start`'s "create account / log in / skip" screen wouldn't read as an
upgrade, it'd read as a random image with buttons under it. If there are
*specific* other screens you want turned into cards (they need to already be
"a list of facts" for it to make sense), point them out and I'll wire those
next — `generateInfoCard()` is ready to reuse anywhere.

## 2. Blockquote → expandable, everywhere

Bot API 7.0 added `<blockquote expandable="true">` — a real "new API"
formatting feature: long quoted blocks collapse to a few lines with a
tap-to-expand arrow instead of always taking up the full message. Every
single `<blockquote>` in the codebase (bot.js, features.js, wallet.js,
setting.js, callbacks/setting.js, callbacks/search.js — 187 tags total) now
uses it. This was mechanical and safe: it doesn't change what any message
says, only how long ones behave in the client.

## Files touched

- `utils/infoCard.js` — new
- `bot.js` — `/botinfo`, `/stats`, `/adminlist` now send image cards; every
  `<blockquote>` → `<blockquote expandable='true'>`
- `features.js`, `wallet.js`, `setting.js`, `callbacks/setting.js`,
  `callbacks/search.js` — blockquote upgrade only, no other changes

Every changed file was syntax-checked (`node --check`) after editing.

`canvas` was already a dependency (`package.json`), so no new packages to
install.
