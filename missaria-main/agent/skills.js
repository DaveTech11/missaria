'use strict';
const fs = require('fs');
const path = require('path');

class SkillStore {
  constructor(root) {
    this.root = root;
    fs.mkdirSync(root, { recursive: true });
  }
  list() {
    return fs.readdirSync(this.root).filter(x => x.endsWith('.md')).map(name => {
      const content = fs.readFileSync(path.join(this.root,name),'utf8');
      return { name: name.replace(/\.md$/,''), content };
    });
  }
  find(query) {
    const q = String(query||'').toLowerCase();
    return this.list().filter(s => s.content.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0,5);
  }
  save(name, body) {
    const safe = String(name||'skill').replace(/[^a-z0-9_-]/gi,'-').toLowerCase().slice(0,80);
    fs.writeFileSync(path.join(this.root, safe + '.md'), String(body||'').trim() + '\n');
    return safe;
  }
}
module.exports = { SkillStore };
