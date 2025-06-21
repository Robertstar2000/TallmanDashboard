#!/usr/bin/env node
/**
 * Adds or updates a test admin user in the local SQLite users table
 * Usage: node scripts/add-test-user.js --email bob@example.com --password "Rm2214ri#" --name "Bob"
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const Database = require('better-sqlite3');

const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i += 2) {
  argMap[args[i].replace(/^--/, '')] = args[i + 1];
}
const email = argMap.email || 'bob@example.com';
const password = argMap.password || 'Rm2214ri#';
const name = argMap.name || 'Bob Admin';

const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');
const db = new Database(DB_PATH);

db.pragma('foreign_keys = ON');

db.exec("BEGIN TRANSACTION");
try {
  const findStmt = db.prepare('SELECT id FROM users WHERE LOWER(email)=LOWER(?)');
  const existing = findStmt.get(email);
  const passHash = bcrypt.hashSync(password, 10);
  if (existing) {
    const upd = db.prepare('UPDATE users SET password=?, name=?, role="admin", status="active", is_ldap_user=0, updated_at=CURRENT_TIMESTAMP WHERE id=?');
    upd.run(passHash, name, existing.id);
    console.log('Updated existing user', email);
  } else {
    const id = randomUUID();
    const ins = db.prepare(`INSERT INTO users (id, email, password, name, role, status, is_ldap_user, created_at, updated_at) VALUES (?,?,?,?, 'admin','active',0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
    ins.run(id, email, passHash, name);
    console.log('Inserted new user', email);
  }
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  console.error('Failed to add test user', err);
  process.exit(1);
} finally {
  db.close();
}
