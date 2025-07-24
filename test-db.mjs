import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');

console.log('Testing database connection to:', DB_PATH);

try {
  // Try to open the database
  const db = new Database(DB_PATH, { readonly: true });
  console.log('Successfully connected to the database');
  
  // Check if tables exist
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table'"
  ).all();
  
  console.log('\nFound tables:');
  tables.forEach(table => console.log(`- ${table.name}`));
  
  // Check if the chart_data table exists and has data
  if (tables.some(t => t.name === 'chart_data')) {
    const rowCount = db.prepare('SELECT COUNT(*) as count FROM chart_data').get();
    console.log(`\nchart_data table has ${rowCount.count} rows`);
  }
  
  db.close();
} catch (error) {
  console.error('Error accessing the database:', error.message);
  process.exit(1);
}
