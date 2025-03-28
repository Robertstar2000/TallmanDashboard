import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'dashboard.db');
const db = new Database(dbPath);

// Create your tables here if needed
db.exec(`
  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('Database initialized successfully');
db.close();
