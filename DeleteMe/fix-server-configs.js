// Script to create the server_configs table if it doesn't exist
const sqlite3 = require('better-sqlite3');
const path = require('path');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Fixing database at: ${dbPath}`);

function main() {
  try {
    // Open the database
    const db = sqlite3(dbPath);
    
    // Check if server_configs table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='server_configs'
    `).get();
    
    if (!tableExists) {
      console.log('Creating server_configs table...');
      
      // Create the server_configs table with all required columns
      db.exec(`
        CREATE TABLE server_configs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          server_name TEXT NOT NULL,
          host TEXT NOT NULL,
          port INTEGER NOT NULL,
          database TEXT NOT NULL,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          config TEXT DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default configurations
      db.exec(`
        INSERT INTO server_configs (server_name, host, port, database, username, password, config)
        VALUES 
          ('P21', 'localhost', 1433, 'P21', 'sa', 'password', '{"enabled": true}'),
          ('POR', 'localhost', 1433, 'POR', 'sa', 'password', '{"enabled": true}')
      `);
      
      console.log('Created server_configs table with default configurations');
    } else {
      // Check if server column exists
      const columns = db.prepare("PRAGMA table_info(server_configs)").all();
      const hasServerColumn = columns.some(col => col.name === 'server');
      
      if (!hasServerColumn) {
        console.log('Adding server column to server_configs table...');
        
        // Add the server column
        db.exec(`ALTER TABLE server_configs ADD COLUMN server TEXT NOT NULL DEFAULT server_name`);
        
        console.log('Added server column to server_configs table');
      } else {
        console.log('server column already exists in server_configs table');
      }
    }
    
    // Verify the table
    const configCount = db.prepare('SELECT COUNT(*) as count FROM server_configs').get().count;
    console.log(`Verification: ${configCount} configurations in server_configs table`);
    
    if (configCount === 0) {
      console.log('Adding default configurations...');
      
      // Insert default configurations
      db.exec(`
        INSERT INTO server_configs (server_name, host, port, database, username, password, config)
        VALUES 
          ('P21', 'localhost', 1433, 'P21', 'sa', 'password', '{"enabled": true}'),
          ('POR', 'localhost', 1433, 'POR', 'sa', 'password', '{"enabled": true}')
      `);
      
      console.log('Added default configurations');
    }
    
    // Display the current schema for verification
    console.log('\nCurrent server_configs schema:');
    const schema = db.prepare("PRAGMA table_info(server_configs)").all();
    schema.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    db.close();
    console.log('Database fix completed successfully');
  } catch (error) {
    console.error('Error fixing database:', error);
  }
}

main();
