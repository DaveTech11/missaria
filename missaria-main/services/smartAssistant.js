// services/smartAssistant.js
// Small, dependency-free helpers used by Miss Aria's natural-language layer.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function detectIntent(text) {
  const value = String(text || '').trim().toLowerCase();
  if (!value) return 'empty';
  if (/\b(generate|create|make|draw|design|render)\b.*\b(image|picture|photo|art|logo|portrait)\b/i.test(value)) return 'image';
  if (/^(broadcast|broadcast this|announce this|send this to everyone)\s*[:\-]?\s*$/i.test(value)) return 'broadcast';
  if (/\b(what can you do|help me|your features|show me what you can do)\b/i.test(value)) return 'help';
  if (/\b(are you alive|are you online|bot status|aria status|system status)\b/i.test(value)) return 'status';
  return 'chat';
}

function progressBar(percent, size = 10) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const filled = Math.round((p / 100) * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}

async function withRetry(task, options = {}) {
  const retries = Math.max(0, Number(options.retries ?? 2));
  const baseDelay = Math.max(100, Number(options.baseDelay ?? 700));
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await sleep(baseDelay * (attempt + 1));
    }
  }
  throw lastError || new Error('Operation failed');
}

function isRecoverableTelegramError(error) {
  const code = String(error?.response?.body?.error_code || error?.code || '');
  const message = String(error?.message || '').toLowerCase();
  return /429|500|502|503|504/.test(code) || /timeout|network|socket|econnreset|etimedout|temporarily unavailable/.test(message);
}

module.exports = { detectIntent, progressBar, withRetry, isRecoverableTelegramError, sleep };
