import { Database } from 'sqlite3';
import { promises as fs } from 'fs';
import { join } from 'path';

let db: Database | null = null;

export const initTestDb = async () => {
  if (db) return db;

  try {
    db = new Database(':memory:', (err) => {
      if (err) {
        console.error('Error opening test database:', err);
        throw err;
      }
    });

    // Read and execute the SQL setup script
    const sqlScript = await fs.readFile(join(process.cwd(), 'lib', 'db', 'test-data.sql'), 'utf-8');
    
    return new Promise<Database>((resolve, reject) => {
      db?.exec(sqlScript, (err) => {
        if (err) {
          console.error('Error initializing test database:', err);
          reject(err);
        } else {
          console.log('Test database initialized successfully');
          resolve(db!);
        }
      });
    });
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
};

export const executeTestQuery = async (query: string): Promise<number> => {
  if (!db) {
    await initTestDb();
  }

  return new Promise((resolve, reject) => {
    db?.get(query, (err, row) => {
      if (err) {
        console.error('Error executing test query:', err);
        reject(err);
      } else {
        // Get the first column of the first row
        const value = row ? Object.values(row)[0] : 0;
        resolve(Number(value) || 0);
      }
    });
  });
};

export const closeTestDb = async () => {
  return new Promise<void>((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing test database:', err);
          reject(err);
        } else {
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};
