const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'dashboard.db');

try {
  const db = new Database(DB_PATH);
  
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, display_name, access_level, is_active, created_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    ['BobM', 'BobM@tallmanequipment.com', 'Bob M', 'super_admin', 1, 'System', 'Initial super admin user'],
    ['admin', 'admin@tallmanequipment.com', 'System Administrator', 'admin', 1, 'System', 'Default admin user'],
    ['demo', 'demo@tallmanequipment.com', 'Demo User', 'user', 1, 'System', 'Demo user for testing'],
    ['importer', 'importer@tallmanequipment.com', 'Data Importer', 'admin', 1, 'System', 'User for data import operations'],
    ['Robertstar', 'robertstar@tallmanequipment.com', 'Robert Star', 'super_admin', 1, 'System', 'System developer account']
  ];

  const transaction = db.transaction((userList) => {
    for (const user of userList) {
      try {
        insertUser.run(...user);
        console.log(`Added user: ${user[0]} (${user[3]})`);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          console.log(`User ${user[0]} already exists, skipping...`);
        } else {
          console.error(`Error adding user ${user[0]}:`, error.message);
        }
      }
    }
  });

  transaction(users);
  
  // Verify users were added
  const allUsers = db.prepare('SELECT username, access_level, display_name FROM users ORDER BY username').all();
  console.log('\nAll users in database:');
  allUsers.forEach(user => {
    console.log(`  ${user.username} - ${user.access_level} - ${user.display_name}`);
  });
  
  db.close();
  console.log('\nUser setup complete!');
} catch (error) {
  console.error('Database error:', error.message);
}
