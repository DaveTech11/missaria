'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

class AgentTaskStore {
  constructor(dataDir) {
    const dir = dataDir || path.join(process.cwd(), 'data');
    fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(path.join(dir, 'aria-agent-tasks.sqlite'));
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        chat_id TEXT,
        prompt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        result TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_agent_tasks_user ON tasks(user_id, updated_at DESC);
    `);
  }
  create({ userId, chatId, prompt }) {
    const now = Date.now();
    const r = this.db.prepare('INSERT INTO tasks(user_id,chat_id,prompt,status,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run(String(userId), chatId == null ? null : String(chatId), String(prompt).slice(0, 4000), 'running', now, now);
    return this.get(r.lastInsertRowid);
  }
  update(id, status, result) {
    this.db.prepare('UPDATE tasks SET status=?, result=?, updated_at=? WHERE id=?')
      .run(String(status), result == null ? null : JSON.stringify(result).slice(0, 12000), Date.now(), Number(id));
    return this.get(id);
  }
  get(id) { return this.db.prepare('SELECT * FROM tasks WHERE id=?').get(Number(id)); }
  recent(userId, limit=10) {
    return this.db.prepare('SELECT * FROM tasks WHERE user_id=? ORDER BY updated_at DESC LIMIT ?')
      .all(String(userId), Math.max(1, Math.min(50, Number(limit)||10)));
  }
  close() { try { this.db.close(); } catch {} }
}
module.exports = { AgentTaskStore };
