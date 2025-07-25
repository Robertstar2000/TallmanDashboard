import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'dashboard.db');
const DATA_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function setupInitialUsers() {
  const db = new Database(DB_PATH);
  
  try {
    // Ensure tables exist by running schema
    const schemaPath = path.join(__dirname, '..', 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    const statements = schema.split(';').filter(stmt => stmt.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          db.exec(stmt);
        } catch (error) {
          // Ignore table already exists errors
          if (!error.message.includes('already exists')) {
            console.error('Error executing schema statement:', error);
          }
        }
      }
    }

    // Check if users already exist
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    
    if (existingUsers.count > 0) {
      console.log(`Database already has ${existingUsers.count} users. Skipping initial setup.`);
      return;
    }

    // Insert initial users
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, display_name, access_level, is_active, created_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const initialUsers = [
      {
        username: 'BobM',
        email: 'BobM@tallmanequipment.com',
        display_name: 'Bob M',
        access_level: 'super_admin',
        is_active: true,
        created_by: 'System',
        notes: 'Initial super admin user'
      },
      {
        username: 'admin',
        email: 'admin@tallmanequipment.com',
        display_name: 'System Administrator',
        access_level: 'admin',
        is_active: true,
        created_by: 'System',
        notes: 'Default admin user'
      },
      {
        username: 'demo',
        email: 'demo@tallmanequipment.com',
        display_name: 'Demo User',
        access_level: 'user',
        is_active: true,
        created_by: 'System',
        notes: 'Demo user for testing'
      },
      {
        username: 'importer',
        email: 'importer@tallmanequipment.com',
        display_name: 'Data Importer',
        access_level: 'admin',
        is_active: true,
        created_by: 'System',
        notes: 'User for data import operations'
      },
      {
        username: 'Robertstar',
        email: 'robertstar@tallmanequipment.com',
        display_name: 'Robert Star',
        access_level: 'super_admin',
        is_active: true,
        created_by: 'System',
        notes: 'System developer account'
      }
    ];

    const transaction = db.transaction((users) => {
      for (const user of users) {
        insertUser.run(
          user.username,
          user.email,
          user.display_name,
          user.access_level,
          user.is_active,
          user.created_by,
          user.notes
        );
      }
    });

    transaction(initialUsers);

    console.log(`Successfully created ${initialUsers.length} initial users:`);
    initialUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.access_level}): ${user.display_name}`);
    });

    // Verify users were created
    const users = db.prepare('SELECT username, access_level, display_name FROM users ORDER BY username').all();
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`  ${user.username} - ${user.access_level} - ${user.display_name}`);
    });

  } catch (error) {
    console.error('Error setting up initial users:', error);
  } finally {
    db.close();
  }
}

// Run the setup
console.log('Setting up initial users for Tallman Dashboard...');
setupInitialUsers();
console.log('Initial user setup complete!');
