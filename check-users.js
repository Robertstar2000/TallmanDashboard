const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'dashboard.db');

try {
  const db = new Database(DB_PATH);
  
  console.log('=== Current Users in Database ===');
  const users = db.prepare('SELECT username, access_level, is_active FROM users ORDER BY username').all();
  users.forEach(user => {
    console.log(`${user.username} - ${user.access_level} - ${user.is_active ? 'Active' : 'Inactive'}`);
  });
  
  console.log('\n=== Checking specific users ===');
  const bobm = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get('BobM');
  console.log('BobM user:', bobm ? 'Found' : 'Not found');
  
  const robertstar = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get('Robertstar');
  console.log('Robertstar user:', robertstar ? 'Found' : 'Not found');
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
