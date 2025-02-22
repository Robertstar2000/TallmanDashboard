import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Database } from 'sqlite';

let testDb: Database | null = null;

export async function getTestDb(): Promise<Database> {
  if (!testDb) {
    testDb = await open({
      filename: ':memory:',
      driver: sqlite3.Database
    });
    await initializeTestDb();
  }
  return testDb;
}

async function initializeTestDb() {
  if (!testDb) return;

  // Create test tables
  await testDb.exec(`
    CREATE TABLE IF NOT EXISTS test_orders (
      id INTEGER PRIMARY KEY,
      date TEXT,
      value REAL
    );

    CREATE TABLE IF NOT EXISTS test_inventory (
      id INTEGER PRIMARY KEY,
      item TEXT,
      quantity INTEGER
    );

    -- Insert some test data
    INSERT OR REPLACE INTO test_orders (id, date, value) VALUES 
      (1, date('now'), 1000),
      (2, date('now'), 2000),
      (3, date('now'), 3000);

    INSERT OR REPLACE INTO test_inventory (id, item, quantity) VALUES
      (1, 'Item A', 100),
      (2, 'Item B', 200),
      (3, 'Item C', 300);
  `);

  console.log('Test database initialized');
}
