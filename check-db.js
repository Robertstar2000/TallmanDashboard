const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'dashboard.db');

try {
  const db = new Database(DB_PATH);
  
  // Check if users table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
  console.log('Users table exists:', tables.length > 0);
  
  if (tables.length > 0) {
    // Check existing users
    const users = db.prepare('SELECT username, access_level FROM users').all();
    console.log('Existing users:', users);
  }
  
  db.close();
} catch (error) {
  console.error('Database error:', error.message);
}
