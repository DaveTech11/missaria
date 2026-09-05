// src/automation/scheduler.js
//
// Spec §10: persistent scheduler, tasks survive restart. Task creation
// independently re-checks isOwner (never trusts the caller), same defense-
// in-depth principle as toolExecutor.js.
//
// isDue()/computeNextWeeklyOrDaily() are pure functions with no DB or
// socket dependency, specifically so the actual scheduling DECISIONS can be
// unit-tested directly (see the test run in this conversation) without
// needing better-sqlite3 installed or a real WhatsApp connection.

const crypto = require("crypto");
const store = require("./taskStore");
const { isOwner } = require("../owner/ownerAuth");
const toolExecutor = require("../ai/toolExecutor");

const TICK_MS = 30 * 1000;
let sockProvider = null; // (task) => sock | null, wired at boot — see setSockProvider below
let timer = null;

/** Boot wiring: call once with a function that returns the live sock to send as.
 * Receives the FULL task (not just ownerJid) — in a multi-agent setup the
 * task's payload._agentId (set by ownerRouter.js at creation time, when
 * known) says which paired agent connection should send it, since that's
 * the connection actually in the target group. Falls back to whatever the
 * provider does when _agentId isn't set (e.g. the first active agent). */
function setSockProvider(fn) {
  sockProvider = fn;
}

function newId() {
  return crypto.randomBytes(6).toString("hex");
}

/**
 * Pure: given one task and "now", decide whether it should fire this tick.
 * `now` and task times are plain millisecond timestamps.
 */
function isDue(task, nowMs) {
  if (task.status !== "active") return false;
  const s = task.schedule;
  if (s.type === "once") {
    return nowMs >= new Date(s.runAt).getTime();
  }
  if (s.type === "daily" || s.type === "weekly") {
    const now = new Date(nowMs);
    if (s.type === "weekly" && now.getDay() !== s.dayOfWeek) return false;
    const scheduledMinuteOfDay = s.hour * 60 + s.minute;
    const nowMinuteOfDay = now.getHours() * 60 + now.getMinutes();
    // Fire once we've reached-or-passed the scheduled minute...
    if (nowMinuteOfDay < scheduledMinuteOfDay) return false;
    // ...but only once per period: skip if already run today.
    if (task.lastRunAt) {
      const last = new Date(task.lastRunAt);
      const sameDay = last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate();
      if (sameDay) return false;
    }
    return true;
  }
  return false;
}

/** Pure: which tasks in a list are due right now. Exposed for testing. */
function computeDueTasks(tasks, nowMs) {
  return tasks.filter((t) => isDue(t, nowMs));
}

async function runTask(task) {
  const sock = sockProvider ? sockProvider(task) : null;
  if (!sock) {
    console.error(`scheduler: no live sock for owner ${task.ownerJid}, task ${task.id} skipped this tick`);
    return; // leave it active — will retry next tick once reconnected
  }

  const result = await toolExecutor.execute(task.action, { sock, senderJid: task.ownerJid, groupJid: task.targetJid }, task.payload);

  if (task.schedule.type === "once") {
    store.update(task.id, { status: result.success ? "completed" : "failed" });
  } else {
    store.update(task.id, { lastRunAt: Date.now() }); // stays active for the next occurrence
  }

  if (!result.success) {
    console.error(`scheduler: task ${task.id} (${task.action}) failed: ${result.error?.message}`);
  }
}

async function tick() {
  let due;
  try {
    due = computeDueTasks(store.getAllActive(), Date.now());
  } catch (err) {
    console.error("scheduler: failed to load tasks:", err.message);
    return;
  }
  for (const task of due) {
    await runTask(task).catch((err) => console.error(`scheduler: task ${task.id} threw:`, err.message));
  }
}

function start() {
  if (timer) return;
  timer = setInterval(() => tick().catch((err) => console.error("scheduler tick error:", err.message)), TICK_MS);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

/**
 * Creates a task. Re-checks isOwner independently — never trusts that
 * whatever called this already verified it (same principle as every tool
 * in toolExecutor.js).
 */
function createTask({ ownerJid, targetJid, action, payload, schedule }) {
  if (!isOwner(ownerJid)) {
    return { success: false, data: null, error: { code: "UNAUTHORIZED", message: "Only the owner can create scheduled tasks." } };
  }
  const task = {
    id: newId(),
    ownerJid,
    targetJid,
    action,
    payload,
    schedule,
    createdAt: Date.now(),
    status: "active",
    lastRunAt: null,
  };
  store.insert(task);
  return { success: true, data: task, error: null };
}

function cancelTask(id, ownerJid) {
  const task = store.getById(id);
  if (!task) return { success: false, data: null, error: { code: "TASK_NOT_FOUND", message: "No task with that ID." } };
  if (task.ownerJid !== ownerJid) {
    return { success: false, data: null, error: { code: "UNAUTHORIZED", message: "That task doesn't belong to you." } };
  }
  store.update(id, { status: "cancelled" });
  return { success: true, data: { id }, error: null };
}

function listTasks(ownerJid) {
  return store.getByOwner(ownerJid).filter((t) => t.status === "active");
}

module.exports = { setSockProvider, start, stop, tick, createTask, cancelTask, listTasks, isDue, computeDueTasks };
