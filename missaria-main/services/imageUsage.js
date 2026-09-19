"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "data", "image-usage.json");
const DAILY_LIMIT = 3;

function day() {
  return new Date().toISOString().slice(0, 10);
}

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8") || "{}"); }
  catch { return {}; }
}

function save(db) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2), "utf8");
}

function isPremium(ctx, userId) {
  return !!(ctx?.isBotAdmin?.(userId) || ctx?.isPremiumActive?.(userId) || ctx?.getPlan?.(userId) === "premium");
}

function status(ctx, userId) {
  if (isPremium(ctx, userId)) return { premium: true, used: 0, limit: null, remaining: null };
  const db = load();
  const key = String(userId);
  const row = db[key];
  if (!row || row.date !== day()) return { premium: false, used: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT };
  const used = Math.min(Number(row.used) || 0, DAILY_LIMIT);
  return { premium: false, used, limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - used) };
}

function consume(ctx, userId) {
  const before = status(ctx, userId);
  if (before.premium) return { allowed: true, premium: true, ...before };
  if (before.remaining <= 0) return { allowed: false, premium: false, ...before };

  const db = load();
  const key = String(userId);
  const row = db[key] && db[key].date === day()
    ? db[key]
    : { date: day(), used: 0 };

  row.used = Math.min(DAILY_LIMIT, (Number(row.used) || 0) + 1);
  db[key] = row;
  save(db);

  return {
    allowed: true,
    premium: false,
    used: row.used,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - row.used)
  };
}

module.exports = { DAILY_LIMIT, status, consume, isPremium };
