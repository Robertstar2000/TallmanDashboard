// Test sqlite3 module directly
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'dashboard.db');

console.log('Testing sqlite3 module...');
console.log('Database path:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to SQLite database');
    
    // Test a simple query
    db.get("SELECT COUNT(*) as count FROM chart_data", (err, row) => {
      if (err) {
        console.error('❌ Query failed:', err.message);
      } else {
        console.log('✅ Query successful. Row count:', row.count);
      }
      
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
        process.exit(0);
      });
    });
  }
});
