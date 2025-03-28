// A simple script to fix the database by ensuring chart_group values are properly set
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Database path
const dbPath = path.join(dataDir, 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Fix chart_group values in the database
db.serialize(() => {
  // Check if chart_data table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='chart_data'", (err, row) => {
    if (err) {
      console.error('Error checking for chart_data table:', err.message);
      closeDb();
      return;
    }

    if (!row) {
      console.log('chart_data table does not exist, nothing to fix.');
      closeDb();
      return;
    }

    // Get all rows from chart_data
    db.all("SELECT id, chart_group, variable_name FROM chart_data", (err, rows) => {
      if (err) {
        console.error('Error getting chart_data rows:', err.message);
        closeDb();
        return;
      }

      console.log(`Found ${rows.length} rows in chart_data`);

      // Check for rows with null or empty chart_group
      const rowsToFix = rows.filter(row => !row.chart_group || row.chart_group.trim() === '');
      console.log(`Found ${rowsToFix.length} rows with missing chart_group`);

      if (rowsToFix.length === 0) {
        console.log('No rows need fixing.');
        closeDb();
        return;
      }

      // Update each row with a missing chart_group
      const stmt = db.prepare("UPDATE chart_data SET chart_group = ? WHERE id = ?");
      
      rowsToFix.forEach(row => {
        // Determine an appropriate chart_group based on the variable_name
        let chartGroup = 'Uncategorized';
        
        const varName = row.variable_name ? row.variable_name.toLowerCase() : '';
        
        if (varName.includes('aging') || varName.includes('current') || varName.includes('days')) {
          chartGroup = 'AR Aging';
        } else if (varName.includes('payable') || varName.includes('receivable') || varName.includes('overdue')) {
          chartGroup = 'Accounts';
        } else if (varName.includes('new') || varName.includes('prospect')) {
          chartGroup = 'Customer Metrics';
        } else if (varName.includes('order')) {
          if (varName.includes('day') || varName.includes('today') || varName.includes('yesterday')) {
            chartGroup = 'Daily Orders';
          } else if (varName.includes('web')) {
            chartGroup = 'Web Orders';
          }
        } else if (varName.includes('p21') || varName.includes('por') || varName.includes('total')) {
          chartGroup = 'Historical Data';
        } else if (varName.includes('stock') || varName.includes('inventory')) {
          chartGroup = 'Inventory';
        } else if (varName.includes('rental')) {
          chartGroup = 'POR Overview';
        } else if (varName.includes('columbus') || varName.includes('addison') || varName.includes('lake city')) {
          chartGroup = 'Site Distribution';
        } else if (varName.includes('sales') || varName.includes('profit') || varName.includes('margin') || 
                  varName.includes('count') || varName.includes('rate') || varName.includes('turnover')) {
          chartGroup = 'Key Metrics';
        }
        
        console.log(`Updating row ${row.id} with chart_group: ${chartGroup}`);
        stmt.run(chartGroup, row.id);
      });
      
      stmt.finalize(() => {
        console.log('Chart group updates completed.');
        
        // Create a cache-busting file to force a refresh of the chart data
        const cacheBustFile = path.join(dataDir, 'cache-bust.txt');
        fs.writeFileSync(cacheBustFile, new Date().toISOString());
        console.log(`Created cache-busting file at ${cacheBustFile}`);
        
        closeDb();
      });
    });
  });
});

// Function to close the database connection
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
}
