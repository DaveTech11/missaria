// src/automation/taskStore.js
//
// Persistence for scheduled owner tasks (spec §10). Uses its own SQLite
// file (data/scheduler.sqlite) rather than the project's existing
// aria.sqlite — I haven't inspected that database's schema, and a
// dedicated file avoids any risk of colliding with tables it already has.
//
// Schema matches the spec exactly: id, ownerJid, targetJid, action,
// payload, schedule, createdAt, status — plus lastRunAt, which the spec's
// field list doesn't include but recurring tasks need to know they've
// already fired for the current period.

const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = path.join(DB_DIR, "scheduler.sqlite");

let db = null;

function getDb() {
  if (db) return db;
  fs.mkdirSync(DB_DIR, { recursive: true });
  const Database = require("better-sqlite3"); // lazy require: don't fail module load if not yet installed
  db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS owner_tasks (
      id TEXT PRIMARY KEY,
      ownerJid TEXT NOT NULL,
      targetJid TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      schedule TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      status TEXT NOT NULL,
      lastRunAt INTEGER
    );
  `);
  return db;
}

function insert(task) {
  getDb()
    .prepare(
      `INSERT INTO owner_tasks (id, ownerJid, targetJid, action, payload, schedule, createdAt, status, lastRunAt)
       VALUES (@id, @ownerJid, @targetJid, @action, @payload, @schedule, @createdAt, @status, @lastRunAt)`
    )
    .run({
      ...task,
      payload: JSON.stringify(task.payload),
      schedule: JSON.stringify(task.schedule),
      lastRunAt: task.lastRunAt || null,
    });
}

function update(id, fields) {
  const sets = Object.keys(fields)
    .map((k) => `${k} = @${k}`)
    .join(", ");
  getDb()
    .prepare(`UPDATE owner_tasks SET ${sets} WHERE id = @id`)
    .run({ ...fields, id });
}

function deserialize(row) {
  return { ...row, payload: JSON.parse(row.payload), schedule: JSON.parse(row.schedule) };
}

function getAllActive() {
  return getDb().prepare(`SELECT * FROM owner_tasks WHERE status = 'active'`).all().map(deserialize);
}

function getByOwner(ownerJid) {
  return getDb().prepare(`SELECT * FROM owner_tasks WHERE ownerJid = ? ORDER BY createdAt DESC`).all(ownerJid).map(deserialize);
}

function getById(id) {
  const row = getDb().prepare(`SELECT * FROM owner_tasks WHERE id = ?`).get(id);
  return row ? deserialize(row) : null;
}

module.exports = { insert, update, getAllActive, getByOwner, getById };
