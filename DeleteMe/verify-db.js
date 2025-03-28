const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(path.join(process.cwd(), 'data', 'dashboard.db'));

// Check if data exists
db.get('SELECT COUNT(*) as count FROM chart_data', (err, row) => {
  if (err) {
    console.error('Error checking data:', err);
    process.exit(1);
  }
  
  console.log('Current row count:', row?.count || 0);
  
  if (!row || row.count === 0) {
    console.log('No data found, initializing...');
    require('./init-db.js');
  }
});
