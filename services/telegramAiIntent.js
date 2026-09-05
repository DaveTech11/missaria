'use strict';

// Miss Aria Telegram intent router.
// IMPORTANT: this module classifies and extracts intent only. It never executes
// Telegram actions. Execution remains behind the existing permission,
// confirmation, tool-registry and audit layers.

function clean(s, max = 1200) {
  return String(s || '').trim().slice(0, max);
}

function normalizeInput(text) {
  let raw = clean(text);
  raw = raw.replace(/^@?aria\b[\s,;:.-]*/i, '').trim();

  // Natural request prefixes. "can you ban..." is a request; "can I ban..."
  // is a question and is handled separately below.
  raw = raw.replace(/^(?:please\s+)+/i, '');
  raw = raw.replace(/^(?:could|can|would)\s+you\s+(?:please\s+)?/i, '');
  raw = raw.replace(/^would\s+you\s+mind\s+(?:please\s+)?/i, '');
  raw = raw.replace(/^i(?:'d|\s+would)\s+like\s+you\s+to\s+/i, '');
  return raw.trim();
}

function classify(text) {
  const raw = clean(text);
  if (!raw) return { kind: 'UNKNOWN', text: '' };

  const lower = raw.toLowerCase().trim();

  if (/^(?:yes|yeah|yep|yup|confirm|confirmed|approve|approved|do it|go ahead|proceed|okay|ok|sure)$/i.test(lower)) {
    return { kind: 'CONFIRMATION', text: raw };
  }

  if (/^(?:no|nope|cancel|cancel it|stop|never mind|nevermind|don't|do not|abort|forget it)$/i.test(lower) ||
      /^(?:actually\s+)?(?:don't|do not)\s+(?:do|execute|ban|kick|mute|lock|unlock|delete|remove)\b/i.test(lower)) {
    return { kind: 'CANCEL', text: raw };
  }

  // Image capability questions are questions, not image-generation commands.
  // Example: "can you generate an image?" asks whether Aria can do it.
  // "generate an image of a cat" is an actual command.
  if (/^(?:please\s+)?(?:can|could|would)\s+(?:you|u)\s+(?:please\s+)?(?:generate|create|make|draw|design|render)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|pic|photo|artwork|art|drawing)\b/i.test(lower)) {
    return { kind: 'QUESTION', text: raw };
  }

  // These are questions, not actions. In particular "can I ban..." must
  // never execute a ban.
  if (/^(?:what|why|how|when|where|who|which|is|are|am|do|does|did|will|would|should)\b.*\?*$/i.test(lower) ||
      /^(?:can|could|would|should)\s+i\b/i.test(lower) ||
      /\bwhat\s+would\s+happen\b/i.test(lower) ||
      /\bhow\s+would\s+it\s+work\b/i.test(lower)) {
    return { kind: 'QUESTION', text: raw };
  }

  // A question mark at the end is a strong signal unless the sentence is
  // clearly an imperative/request.
  if (/\?\s*$/.test(raw) && !/^(?:lock|unlock|mute|unmute|ban|kick|warn|remove|send|show|list|enable|disable|turn|restart|backup|remember)\b/i.test(lower)) {
    return { kind: 'QUESTION', text: raw };
  }

  const request = normalizeInput(raw);
  return { kind: request === raw ? 'COMMAND' : 'REQUEST', text: request };
}

function parseDuration(s) {
  if (!s) return null;
  const m = String(s).match(/(\d+)\s*(s|sec|secs|m|min|mins|h|hr|hrs|d|day|days)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  if (!Number.isFinite(n) || n <= 0) return null;
  if (u.startsWith('s')) return n * 1000;
  if (u.startsWith('m')) return n * 60000;
  if (u.startsWith('h')) return n * 3600000;
  return n * 86400000;
}

function parse(text) {
  const classification = classify(text);
  // Security/analytics questions that should execute a read-only lookup
  // instead of being sent to the generic AI question handler.
  const spamQuery = clean(text).replace(/^@?aria\b[\s,;:.-]*/i, '').trim();
  let sm = spamQuery.match(/^(?:who|which user|what user)\s+(?:is|are)\s+(?:causing|creating|sending)\s+(?:the\s+)?(?:most\s+)?spam(?:\s+(?:in|from|on))\s+(.+?)\??$/i);
  if (sm) return { type: 'spamTop', group: clean(sm[1]) };
  sm = spamQuery.match(/^(?:show|give me|list)\s+(?:the\s+)?(?:top|worst|most)\s+spam(?:mers)?(?:\s+(?:in|from|on))\s+(.+?)\??$/i);
  if (sm) return { type: 'spamTop', group: clean(sm[1]) };
  if (classification.kind === 'QUESTION' ||
      classification.kind === 'CONFIRMATION' ||
      classification.kind === 'CANCEL' ||
      classification.kind === 'UNKNOWN') {
    return { type: 'intentMeta', intentClass: classification.kind, original: classification.text };
  }

  const raw = classification.text;
  if (!raw) return { type: 'intentMeta', intentClass: 'UNKNOWN', original: '' };
  const lower = raw.toLowerCase();

  // Broad natural-language security/moderation aliases.
  let nm = raw.match(/^(?:protect|secure|guard|shield|watch)\s+(.+?)(?:\s+group)?$/i);
  if (nm) return { type: 'autoMod', enabled: true, group: clean(nm[1]), feature: 'auto-mod' };
  nm = raw.match(/^(?:disable|pause|stop|deactivate|switch off)\s+(?:auto[- ]?mod|automatic moderation|spam protection)(?:\s+(?:in|on|for)\s+)(.+)$/i);
  if (nm) return { type: 'autoMod', enabled: false, group: clean(nm[1]), feature: 'auto-mod' };
  nm = raw.match(/^(?:enable|activate|start|switch on)\s+(?:auto[- ]?mod|automatic moderation|spam protection)(?:\s+(?:in|on|for)\s+)(.+)$/i);
  if (nm) return { type: 'autoMod', enabled: true, group: clean(nm[1]), feature: 'auto-mod' };
  nm = raw.match(/^(?:show|give me|tell me)\s+(?:the\s+)?(?:safety|security|protection)\s+(?:status|report)(?:\s+(?:in|for|of)\s+)(.+)$/i);
  if (nm) return { type: 'securityHealth', group: clean(nm[1]) };
  nm = raw.match(/^(?:who|which)\s+(?:is|are)\s+(?:spamming|flooding|causing spam)(?:\s+(?:in|on|from)\s+)(.+?)(?:\?)?$/i);
  if (nm) return { type: 'spamTop', group: clean(nm[1]) };

  nm = raw.match(/^(?:make|keep)\s+(.+?)\s+(?:safe|clean|protected)(?:\s+(?:from\s+)?(?:spam|abuse|raids?|bad actors?))?$/i);
  if (nm) return { type: 'autoMod', enabled: true, group: clean(nm[1]), feature: 'auto-mod' };
  nm = raw.match(/^(?:start|begin)\s+protecting\s+(.+)$/i);
  if (nm) return { type: 'autoMod', enabled: true, group: clean(nm[1]), feature: 'auto-mod' };
  nm = raw.match(/^(?:protect|secure|guard|watch)\s+(.+?)\s+(?:from\s+)?(?:spam|raids?|flooding)$/i);
  if (nm) return { type: 'autoMod', enabled: true, group: clean(nm[1]), feature: 'anti-spam' };
  nm = raw.match(/^(?:auto[- ]?mod|automoderation|moderation|spam protection)\s+(?:on|enable|enabled|start)(?:\s+(?:in|for|on)\s+)(.+)$/i);
  if (nm) return { type: 'autoMod', enabled: true, group: clean(nm[1]), feature: 'auto-mod' };
  nm = raw.match(/^(?:auto[- ]?mod|automoderation|moderation|spam protection)\s+(?:off|disable|disabled|stop)(?:\s+(?:in|for|on)\s+)(.+)$/i);
  if (nm) return { type: 'autoMod', enabled: false, group: clean(nm[1]), feature: 'auto-mod' };

  // Conversational moderation:
  // "handle @john in Zuno — he's flooding the chat"
  let m = raw.match(/^handle\s+(@?[A-Za-z0-9_]{3,64}|\d+)\s+(?:in|on)\s+(.+?)(?:\s*[—–-]\s*|\s+because\s+)(.+)$/i);
  if (m) {
    const target = m[1];
    const group = clean(m[2]);
    const reason = clean(m[3]);
    let action = 'warn';
    let durationMs = null;
    if (/flood|flooding|spam|spamming|too many|rapid/i.test(reason)) {
      action = 'mute'; durationMs = 10 * 60000;
    } else if (/link|advertis|scam|phish/i.test(reason)) {
      action = 'mute'; durationMs = 30 * 60000;
    } else if (/harass|abuse|threat/i.test(reason)) {
      action = 'warn';
    }
    return { type: 'moderation', action, target, group, reason, durationMs, confidence: action === 'mute' ? 'high' : 'medium' };
  }

  // "remove this user from zack" / "kick them in zack" are resolved
  // from the replied-to/tagged Telegram user by the owner center.
  m = raw.match(/^(mute|ban|kick|warn|unmute|unban|remove)\s+(this\s+user|them|him|her)\s+(?:from|in|on)\s+(.+?)(?:\s+(?:for|because)\s+(.+))?$/i);
  if (m) {
    const action = m[1].toLowerCase() === 'remove' ? 'kick' : m[1].toLowerCase();
    const tail = clean(m[4] || '');
    const durationMs = action === 'mute' || action === 'ban' ? parseDuration(tail) : null;
    const reason = durationMs ? tail.replace(/^(?:for\s+)?\d+\s*(?:s|sec|secs|m|min|mins|h|hr|hrs|d|day|days)\b/i, '').trim() : tail.replace(/^because\s+/i, '');
    return { type: 'moderation', action, target: null, targetRef: m[2].toLowerCase(), group: clean(m[3]), reason: clean(reason), durationMs, confidence: 'high' };
  }

  // "ban john from zack", "mute john in zack"
  m = raw.match(/^(mute|ban|kick|warn|unmute|unban|remove)\s+(@?[A-Za-z0-9_]{2,64}|\d+)\s+(?:from|in|on)\s+(.+?)(?:\s+(?:for|because)\s+(.+))?$/i);
  if (m) {
    const action = m[1].toLowerCase() === 'remove' ? 'kick' : m[1].toLowerCase();
    const tail = clean(m[4] || '');
    const durationMs = action === 'mute' || action === 'ban' ? parseDuration(tail) : null;
    const reason = durationMs
      ? tail.replace(/^(?:for\s+)?\d+\s*(?:s|sec|secs|m|min|mins|h|hr|hrs|d|day|days)\b/i, '').trim()
      : tail.replace(/^because\s+/i, '');
    return { type: 'moderation', action, target: m[2], group: clean(m[3]), reason: clean(reason), durationMs, confidence: 'high' };
  }

  if (/^(?:check|run|do)\s+(?:a\s+)?(?:system\s+)?(?:health|diagnostic|diagnostics|self[- ]check)/i.test(lower)) return { type: 'diagnostics' };
  if (/^(?:show|give me|what(?:'s| is))\s+(?:my\s+)?(?:stats|statistics|activity|report)/i.test(lower)) return { type: 'stats' };
  if (/^(?:(?:show|list)\s+(?:my\s+)?groups?|which|what)\s+(?:groups\s+)?(?:am\s+i|i\s+am)\s+admin\s+in\s*\??$/i.test(lower) || /^(?:which|what)\s+groups\s+(?:are\s+you|is\s+aria)\s+admin\s+in\s*\??$/i.test(lower)) return { type: 'groups' };
  if (/^(?:show|list)\s+(?:my\s+)?groups?$/i.test(lower)) return { type: 'groups' };
  if (/^(?:show|list)\s+(?:my\s+)?(?:tasks|reminders)$/i.test(lower)) return { type: 'tasks' };
  if (/^(?:show|list)\s+(?:the\s+)?audit(?:\s+log)?$/i.test(lower)) return { type: 'audit' };
  if (/^(?:show|list)\s+(?:my\s+)?memory$/i.test(lower)) return { type: 'memory' };

  // "show me the security status in zack"
  m = raw.match(/^(?:show(?:\s+me)?|give me|check)\s+(?:the\s+)?security\s+(?:status|health)(?:\s+(?:in|for|of)\s+(.+))?$/i);
  if (m) return { type: 'securityHealth', group: clean(m[1] || '') };

  m = raw.match(/^(?:send|tell|post)\s+["“](.+?)["”]\s+(?:to|in)\s+(.+)$/i);
  if (m) return { type: 'sendMessage', text: clean(m[1], 4000), group: clean(m[2]) };

  if (/^(?:lock|shutdown|secure)\s+(?:all|every)\s+groups?/i.test(lower)) return { type: 'emergency', enabled: true };
  if (/^(?:unlock|restore|open)\s+(?:all|every)\s+groups?/i.test(lower)) return { type: 'emergency', enabled: false };

  // "lock zack group" / "unlock zack group"
  m = raw.match(/^(lock|unlock|shutdown|restore|open)\s+(?:the\s+)?(.+?)(?:\s+group)?$/i);
  if (m) {
    const action = /^(?:shutdown)$/i.test(m[1]) ? 'lock' :
      /^(?:restore|open)$/i.test(m[1]) ? 'unlock' : m[1].toLowerCase();
    return { type: 'groupPermission', action, group: clean(m[2]) };
  }

  m = raw.match(/^(?:enable|turn on|disable|turn off)\s+(?:anti[- ]link|links?)\s+(?:in|on)\s+(.+)$/i);
  if (m) return { type: 'antiLink', enabled: /^(?:enable|turn on)/i.test(raw), group: clean(m[1]) };

  m = raw.match(/^(?:enable|turn on|disable|turn off)\s+(?:anti[- ]?spam|auto[- ]?spam|auto[- ]?mod|moderation)\s+(?:in|on)\s+(.+)$/i);
  if (m) return { type: 'autoMod', enabled: /^(?:enable|turn on)/i.test(raw), group: clean(m[1]), feature: /anti[- ]?spam|auto[- ]?spam/i.test(m[0]) ? 'anti-spam' : 'auto-mod' };

  m = raw.match(/^(?:enable|turn on|disable|turn off)\s+(?:auto[- ]?mod|moderation)\s+(?:in|on)\s+(.+)$/i);
  if (m) return { type: 'autoMod', enabled: /^(?:enable|turn on)/i.test(raw), group: clean(m[1]) };

  if (/^(?:restart|reboot)(?:\s+the\s+(?:bot|system))?$/i.test(lower)) return { type: 'restart' };
  if (/^(?:create|make)\s+(?:a\s+)?backup$/i.test(lower)) return { type: 'backup' };

  m = raw.match(/^remember(?:\s+that)?\s+(.+)$/i);
  if (m) return { type: 'memoryAdd', text: clean(m[1]) };

  return { type: 'intentMeta', intentClass: classification.kind, original: raw };
}

module.exports = { parse, classify, parseDuration };
