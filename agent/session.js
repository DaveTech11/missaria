'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

class AgentSessionStore {
  constructor(dataDir) {
    const dir = dataDir || path.join(process.cwd(), 'data');
    fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(path.join(dir, 'aria-agent-sessions.sqlite'));
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS turns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        chat_id TEXT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_agent_turns_user ON turns(user_id, created_at DESC);
    `);
  }
  add({ userId, chatId, role, content }) {
    this.db.prepare('INSERT INTO turns(user_id,chat_id,role,content,created_at) VALUES(?,?,?,?,?)')
      .run(String(userId), chatId == null ? null : String(chatId), String(role), String(content).slice(0, 8000), Date.now());
  }
  recent(userId, limit=12) {
    const rows = this.db.prepare('SELECT role,content,created_at FROM turns WHERE user_id=? ORDER BY created_at DESC LIMIT ?')
      .all(String(userId), Math.max(1, Math.min(30, Number(limit)||12)));
    return rows.reverse();
  }
  clear(userId) {
    return this.db.prepare('DELETE FROM turns WHERE user_id=?').run(String(userId)).changes;
  }
  close() { try { this.db.close(); } catch {} }
}
module.exports = { AgentSessionStore };
