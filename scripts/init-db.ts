import { initializeDatabaseTables, getDb } from '../lib/db/sqlite';
import * as fs from 'fs';
import * as path from 'path';

// Initialize the database with test data
async function main() {
  console.log('Initializing database...');
  try {
    // Force delete the existing database file
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    if (fs.existsSync(dbPath)) {
      console.log(`Removing existing database at ${dbPath}`);
      fs.unlinkSync(dbPath);
      console.log('Database file removed successfully');
    }
    
    // Make sure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      console.log(`Creating data directory at ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const db = await getDb();
    await initializeDatabaseTables(db);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main();
