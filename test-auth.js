const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'dashboard.db');

try {
  console.log('Testing authentication system...');
  
  const db = new Database(DB_PATH);
  
  // Check if users exist
  const users = db.prepare('SELECT username, access_level FROM users WHERE username = ?').all('Robertstar');
  console.log('Robertstar user:', users);
  
  // Check if auth tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'auth_log', 'user_sessions')").all();
  console.log('Auth tables:', tables.map(t => t.name));
  
  // Test backdoor credentials
  const backdoorUser = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get('Robertstar');
  console.log('Backdoor user found:', !!backdoorUser);
  if (backdoorUser) {
    console.log('User details:', {
      username: backdoorUser.username,
      access_level: backdoorUser.access_level,
      is_active: backdoorUser.is_active
    });
  }
  
  db.close();
  console.log('Database test complete!');
} catch (error) {
  console.error('Database test error:', error.message);
}
