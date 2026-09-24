'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

class AgentMemory {
  constructor({ dataDir, userId }) {
    this.userId = String(userId);
    const dir = dataDir || path.join(process.cwd(), 'data');
    fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(path.join(dir, 'aria-agent-memory.sqlite'));
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'memory',
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_mem_user ON memories(user_id);
    `);
  }
  add(content, kind='memory') {
    const text = String(content || '').trim().slice(0, 1800);
    if (!text) return null;
    const now = Date.now();
    const stmt = this.db.prepare(
      'INSERT INTO memories(user_id,kind,content,created_at,updated_at) VALUES(?,?,?,?,?)'
    );
    const r = stmt.run(this.userId, String(kind), text, now, now);
    return { id: r.lastInsertRowid, kind, content: text };
  }
  search(query, limit=8) {
    const q = String(query || '').toLowerCase().trim();
    if (!q) return [];
    const rows = this.db.prepare(
      'SELECT id,kind,content,created_at,updated_at FROM memories WHERE user_id=? ORDER BY updated_at DESC LIMIT 200'
    ).all(this.userId);
    const terms = q.split(/\s+/).filter(Boolean);
    return rows.map(r => {
      const hay = r.content.toLowerCase();
      let score = 0;
      for (const t of terms) if (hay.includes(t)) score += 1;
      return { ...r, score };
    }).filter(r => r.score > 0).sort((a,b)=>b.score-a.score || b.updated_at-a.updated_at).slice(0, limit);
  }
  recent(limit=10) {
    return this.db.prepare(
      'SELECT id,kind,content,created_at,updated_at FROM memories WHERE user_id=? ORDER BY updated_at DESC LIMIT ?'
    ).all(this.userId, Math.max(1, Math.min(50, Number(limit)||10)));
  }
  close() { try { this.db.close(); } catch {} }
}
module.exports = { AgentMemory };
