// Script to directly check the IDs in the database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Get all rows with their IDs
db.all(`
  SELECT id, chart_group, variable_name 
  FROM chart_data 
  ORDER BY id
`, (err, rows) => {
  if (err) {
    console.error('Error getting rows:', err.message);
    closeDb();
    return;
  }
  
  console.log(`Found ${rows.length} rows in the database`);
  
  // Print the first 20 rows to check their IDs
  console.log('\nFirst 20 rows:');
  rows.slice(0, 20).forEach((row, index) => {
    console.log(`${index + 1}. ID: ${row.id || 'null'}, Chart Group: ${row.chart_group}, Variable: ${row.variable_name}`);
  });
  
  // Count different ID formats
  let rowFormatCount = 0;
  let numericFormatCount = 0;
  let nullOrEmptyCount = 0;
  let otherFormatCount = 0;
  
  rows.forEach(row => {
    const id = row.id;
    
    if (id === null || id === '') {
      nullOrEmptyCount++;
    } else if (/^row_\d+$/.test(id)) {
      rowFormatCount++;
    } else if (/^\d+$/.test(id)) {
      numericFormatCount++;
    } else {
      otherFormatCount++;
    }
  });
  
  console.log('\nDatabase ID Format Summary:');
  console.log(`- Total rows: ${rows.length}`);
  console.log(`- row_XXX format: ${rowFormatCount}`);
  console.log(`- Numeric format: ${numericFormatCount}`);
  console.log(`- Null or empty: ${nullOrEmptyCount}`);
  console.log(`- Other format: ${otherFormatCount}`);
  
  // If there are any rows with incorrect formats, list them
  if (numericFormatCount > 0 || nullOrEmptyCount > 0 || otherFormatCount > 0) {
    console.log('\nRows with incorrect ID format:');
    rows.forEach(row => {
      const id = row.id;
      if (id === null || id === '' || !/^row_\d+$/.test(id)) {
        console.log(`- ID: ${id || 'null'}, Chart Group: ${row.chart_group}, Variable: ${row.variable_name}`);
      }
    });
  }
  
  closeDb();
});

// Function to close the database
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}
