// Script to restore default connection settings
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Default connection settings from server.ts
const DEFAULT_P21_CONFIG = {
  dsn: 'P21Play',
  database: 'P21Play',
  user: 'SA',
  password: 'Ted@Admin230',
  type: 'P21',
  options: {
    trustServerCertificate: true,
    encrypt: false,
    driver: 'ODBC Driver 17 for SQL Server'
  }
};

const DEFAULT_POR_CONFIG = {
  server: '10.10.20.13',
  database: 'POR',
  user: 'SA',
  password: '',
  type: 'POR',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

async function restoreDefaultConnections() {
  try {
    console.log('Restoring default connection settings...');
    
    // Get the database path
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Using database at: ${dbPath}`);
    
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.error(`Database file does not exist at ${dbPath}`);
      return;
    }
    
    // Open the database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Check if server_configs table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='server_configs'
    `);
    
    if (!tableExists) {
      console.log('Creating server_configs table...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS server_configs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          server_name TEXT NOT NULL,
          host TEXT,
          port INTEGER,
          database TEXT,
          username TEXT,
          password TEXT,
          created_at TEXT,
          updated_at TEXT,
          config TEXT,
          server TEXT
        )
      `);
    } else {
      // Clear existing configurations
      console.log('Clearing existing server configurations...');
      await db.run('DELETE FROM server_configs');
    }
    
    // Insert default P21 configuration
    console.log('Adding default P21 configuration...');
    await db.run(`
      INSERT INTO server_configs (
        server_name, host, port, database, username, password, 
        created_at, updated_at, config, server
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'P21',
      '',
      1433,
      DEFAULT_P21_CONFIG.database,
      DEFAULT_P21_CONFIG.user,
      DEFAULT_P21_CONFIG.password,
      new Date().toISOString(),
      new Date().toISOString(),
      JSON.stringify(DEFAULT_P21_CONFIG),
      'P21'
    ]);
    
    // Insert default POR configuration
    console.log('Adding default POR configuration...');
    await db.run(`
      INSERT INTO server_configs (
        server_name, host, port, database, username, password, 
        created_at, updated_at, config, server
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'POR',
      DEFAULT_POR_CONFIG.server,
      0,
      DEFAULT_POR_CONFIG.database,
      DEFAULT_POR_CONFIG.user,
      DEFAULT_POR_CONFIG.password,
      new Date().toISOString(),
      new Date().toISOString(),
      JSON.stringify(DEFAULT_POR_CONFIG),
      'POR'
    ]);
    
    // Verify the configurations were added
    const configs = await db.all('SELECT * FROM server_configs');
    console.log(`Successfully added ${configs.length} server configurations`);
    
    // Close the database
    await db.close();
    
    console.log('Default connection settings restored successfully!');
  } catch (error) {
    console.error('Error restoring default connection settings:', error);
  }
}

// Run the function
restoreDefaultConnections();
