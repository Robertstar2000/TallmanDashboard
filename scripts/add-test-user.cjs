#!/usr/bin/env node
/**
 * Adds or updates a test admin user in the local SQLite users table.
 * Usage (PowerShell):
 *   node scripts/add-test-user.cjs --email bob@example.com --password "Rm2214ri#" --name "Bob Test"
 */

const path = require('path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const Database = require('better-sqlite3');

// ---------------- parse CLI args ------------------
const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^--/, '');
  const val = args[i + 1];
  argMap[key] = val;
}

const email = (argMap.email || 'bob@example.com').toLowerCase();
const password = argMap.password || 'Rm2214ri#';
const name = argMap.name || 'Bob Admin';

if (!email || !password) {
  console.error('Email and password are required.');
  process.exit(1);
}

// --------------- open DB -------------------------
const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');
const db = new Database(DB_PATH);

db.pragma('foreign_keys = ON');

try {
  db.transaction(() => {
    const passHash = bcrypt.hashSync(password, 10);

    const row = db.prepare('SELECT id FROM users WHERE LOWER(email)=LOWER(?)').get(email);
    if (row) {
      db.prepare(`UPDATE users
                  SET password = ?, name = ?, role='admin', status='active', is_ldap_user = 0, updated_at=CURRENT_TIMESTAMP
                  WHERE id = ?`).run(passHash, name, row.id);
      console.log(`Updated existing user: ${email}`);
    } else {
      const id = randomUUID();
      db.prepare(`INSERT INTO users (id, email, password, name, role, status, is_ldap_user, created_at, updated_at)
                  VALUES (?, ?, ?, ?, 'admin', 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).run(id, email, passHash, name);
      console.log(`Inserted new user: ${email}`);
    }
  })();

  console.log('Success.');
  process.exit(0);
} catch (err) {
  console.error('Failed to add/update user:', err.message);
  process.exit(1);
}
