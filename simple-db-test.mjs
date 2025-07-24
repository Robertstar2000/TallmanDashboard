// Simple database test using ES modules
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'data', 'dashboard.db');

console.log('=== Database Test ===');
console.log('Database path:', DB_PATH);

try {
  console.log('Opening database...');
  const db = new Database(DB_PATH);
  console.log('✅ Database opened successfully');
  
  // Check if chart_data table exists
  console.log('Checking for chart_data table...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chart_data'").all();
  console.log('Chart_data table exists:', tables.length > 0);
  
  if (tables.length > 0) {
    // Check row count
    console.log('Counting rows...');
    const count = db.prepare("SELECT COUNT(*) as count FROM chart_data").get();
    console.log('Total rows in chart_data:', count.count);
    
    if (count.count === 0) {
      console.log('⚠️  The chart_data table is empty! This is likely the cause of the API error.');
      console.log('The dashboard needs data to be populated in the chart_data table.');
    } else {
      console.log('✅ Data exists in chart_data table');
    }
  } else {
    console.log('❌ chart_data table does not exist - schema may not be initialized');
  }
  
  db.close();
  console.log('Database connection closed');
  
} catch (error) {
  console.error('❌ Database error:', error.message);
}
