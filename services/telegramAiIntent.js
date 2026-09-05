'use strict';

// Safe natural-language intent parser for the Telegram owner control unit.
// It only maps text to allow-listed actions; it never executes Telegram calls.

function clean(s, max = 500) { return String(s || '').trim().slice(0, max); }

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
  const raw = clean(text, 1200).replace(/^aria[,\s:-]*/i, '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  // Conversational moderation: "handle @john in Zuno — he's flooding the chat"
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

  // More natural moderation forms.
  m = raw.match(/^(mute|ban|kick|warn|unmute|unban|remove)\s+(@?[A-Za-z0-9_]{3,64}|\d+)\s+(?:from|in|on)\s+(.+?)(?:\s+(?:for|because)\s+(.+))?$/i);
  if (m) {
    const action = m[1].toLowerCase() === 'remove' ? 'kick' : m[1].toLowerCase();
    const tail = clean(m[4] || '');
    const durationMs = action === 'mute' || action === 'ban' ? parseDuration(tail) : null;
    const reason = durationMs ? tail.replace(/^(?:for\s+)?\d+\s*(?:s|sec|secs|m|min|mins|h|hr|hrs|d|day|days)\b/i, '').trim() : tail.replace(/^because\s+/i, '');
    return { type: 'moderation', action, target: m[2], group: clean(m[3]), reason: clean(reason), durationMs, confidence: 'high' };
  }

  if (/^(?:check|run|do)\s+(?:a\s+)?(?:system\s+)?(?:health|diagnostic|diagnostics|self[- ]check)/i.test(lower)) return { type: 'diagnostics' };
  if (/^(?:show|give me|what(?:'s| is))\s+(?:my\s+)?(?:stats|statistics|activity|report)/i.test(lower)) return { type: 'stats' };
  if (/^(?:show|list)\s+(?:my\s+)?groups?$/i.test(lower)) return { type: 'groups' };
  if (/^(?:show|list)\s+(?:my\s+)?(?:tasks|reminders)$/i.test(lower)) return { type: 'tasks' };
  if (/^(?:show|list)\s+(?:the\s+)?audit(?:\s+log)?$/i.test(lower)) return { type: 'audit' };
  if (/^(?:show|list)\s+(?:my\s+)?memory$/i.test(lower)) return { type: 'memory' };

  m = raw.match(/^(?:send|tell|post)\s+["“](.+?)["”]\s+(?:to|in)\s+(.+)$/i);
  if (m) return { type: 'sendMessage', text: clean(m[1], 4000), group: clean(m[2]) };

  if (/^(?:lock|shutdown|secure)\s+(?:all|every)\s+groups?/i.test(lower)) return { type: 'emergency', enabled: true };
  if (/^(?:unlock|restore|open)\s+(?:all|every)\s+groups?/i.test(lower)) return { type: 'emergency', enabled: false };

  m = raw.match(/^(lock|unlock)\s+(.+)$/i);
  if (m) return { type: 'groupPermission', action: m[1].toLowerCase(), group: clean(m[2]) };

  m = raw.match(/^(?:enable|turn on|disable|turn off)\s+(?:anti[- ]link|links?)\s+(?:in|on)\s+(.+)$/i);
  if (m) return { type: 'antiLink', enabled: /^(?:enable|turn on)/i.test(raw), group: clean(m[1]) };

  m = raw.match(/^(?:enable|turn on|disable|turn off)\s+(?:auto[- ]?mod|moderation)\s+(?:in|on)\s+(.+)$/i);
  if (m) return { type: 'autoMod', enabled: /^(?:enable|turn on)/i.test(raw), group: clean(m[1]) };

  if (/^(?:restart|reboot)(?:\s+the\s+(?:bot|system))?$/i.test(lower)) return { type: 'restart' };
  if (/^(?:create|make)\s+(?:a\s+)?backup$/i.test(lower)) return { type: 'backup' };

  m = raw.match(/^remember(?:\s+that)?\s+(.+)$/i);
  if (m) return { type: 'memoryAdd', text: clean(m[1]) };

  return null;
}

module.exports = { parse, parseDuration };
