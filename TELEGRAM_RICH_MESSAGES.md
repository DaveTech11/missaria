# Miss Aria — Telegram Rich Messages

Miss Aria now has a Telegram Rich Message compatibility layer based on the
validated Bloom Petal implementation.

### What changed
- Rich cards can use Telegram `sendRichMessage`.
- `reply_markup` stays a normal top-level Telegram keyboard.
- Rich cards support photos, semantic headings, dividers and real tables.
- AI companion replies try the rich card first.
- Existing HTML/photo sending remains the automatic fallback.
- `/rich` or `/richdemo` shows the Telegram-specific rich UI.

### Files
- `utils/telegramRichMessage.js`
- `handlers/13_aria_ai_companion.js`

### Safety
Rich messages are an enhancement. If Telegram rejects `sendRichMessage`,
Miss Aria automatically sends the previous HTML/photo format instead.
