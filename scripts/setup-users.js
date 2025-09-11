const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');
const DATA_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Read and execute schema
const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const statements = schema.split(';').filter(stmt => stmt.trim());
for (const stmt of statements) {
  if (stmt.trim()) {
    try {
      db.exec(stmt);
    } catch (error) {
      console.error('Error executing schema statement:', error);
    }
  }
}

// Initial users to add
const users = [
  {
    username: 'BobM',
    email: 'BobM@tallman.com',
    display_name: 'Bob M',
    access_level: 'admin',
    is_active: true,
    notes: 'System Administrator'
  },
  {
    username: 'admin',
    email: 'admin@tallmanequipment.com',
    display_name: 'Administrator',
    access_level: 'admin',
    is_active: true,
    notes: 'Default Admin Account'
  },
  {
    username: 'demo',
    email: 'demo@tallmanequipment.com',
    display_name: 'Demo User',
    access_level: 'user',
    is_active: true,
    notes: 'Demo Account'
  },
  {
    username: 'importer',
    email: 'importer@tallmanequipment.com',
    display_name: 'Data Importer',
    access_level: 'user',
    is_active: true,
    notes: 'Data Import Account'
  }
];

// Insert users with case-insensitive handling
// First, check if user already exists (case-insensitive)
const checkUser = db.prepare(`
  SELECT id FROM users WHERE LOWER(username) = LOWER(?)
`);

const insertUser = db.prepare(`
  INSERT INTO users (username, email, display_name, access_level, is_active, notes)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const updateUser = db.prepare(`
  UPDATE users SET email = ?, display_name = ?, access_level = ?, is_active = ?, notes = ?
  WHERE LOWER(username) = LOWER(?)
`);

console.log('Setting up initial users...');

for (const user of users) {
  try {
    const existingUser = checkUser.get(user.username);
    
    if (existingUser) {
      // Update existing user
      updateUser.run(
        user.email,
        user.display_name,
        user.access_level,
        user.is_active ? 1 : 0,
        user.notes,
        user.username
      );
      console.log(`✓ Updated user: ${user.username} (${user.access_level})`);
    } else {
      // Insert new user
      insertUser.run(
        user.username,
        user.email,
        user.display_name,
        user.access_level,
        user.is_active ? 1 : 0,
        user.notes
      );
      console.log(`✓ Added user: ${user.username} (${user.access_level})`);
    }
  } catch (error) {
    console.error(`✗ Failed to add/update user ${user.username}:`, error);
  }
}

// Verify users were added
const users_count = db.prepare('SELECT COUNT(*) as count FROM users').get();
console.log(`\nTotal users in database: ${users_count.count}`);

// List all users
const all_users = db.prepare('SELECT username, email, access_level, is_active FROM users ORDER BY username').all();
console.log('\nCurrent users:');
all_users.forEach(user => {
  const status = user.is_active ? 'Active' : 'Inactive';
  console.log(`  ${user.username} (${user.email}) - ${user.access_level} - ${status}`);
});

db.close();
console.log('\nUser setup completed!');
