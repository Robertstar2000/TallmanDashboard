// Script to create a test user for login
const Database = require('better-sqlite3');
const path = require('path');

// Initialize database connection
const dbPath = path.join(process.cwd(), 'dashboard.db');
const db = new Database(dbPath);

// Create users table if it doesn't exist
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    access_level TEXT NOT NULL CHECK (access_level IN ('user', 'admin', 'super_admin')),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

try {
  console.log('Creating users table...');
  db.exec(createTableSQL);
  
  // Check if test user already exists
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@tallman.com');
  
  if (existingUser) {
    console.log('Test user already exists:', existingUser);
  } else {
    // Create test user
    const insertUser = db.prepare(`
      INSERT INTO users (email, display_name, access_level, is_active, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = insertUser.run(
      'admin@tallman.com',
      'Admin User',
      'super_admin',
      1,
      'Test admin user for development'
    );
    
    console.log('Test user created successfully!');
    console.log('Email: admin@tallman.com');
    console.log('Access Level: super_admin');
    console.log('User ID:', result.lastInsertRowid);
  }
  
  // List all users
  console.log('\nAll users in database:');
  const allUsers = db.prepare('SELECT * FROM users').all();
  console.table(allUsers);
  
} catch (error) {
  console.error('Error creating test user:', error);
} finally {
  db.close();
}
