import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';

let testDb: Database | null = null;

export async function openTestDb(): Promise<Database> {
  if (!testDb) {
    testDb = await new Promise<Database>((resolve, reject) => {
      const db = new sqlite3.Database(':memory:', (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    });
  }
  return testDb;
}

async function getTestDb(): Promise<Database> {
  return await openTestDb();
}

export async function initializeTestDb(): Promise<void> {
  const db = await getTestDb();
  await new Promise<void>((resolve, reject) => {
    db.exec(`
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
    `, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  console.log('Test database initialized');
}

export async function closeTestDb(): Promise<void> {
  if (testDb) {
    await new Promise<void>((resolve, reject) => {
      testDb!.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    testDb = null;
  }
}
