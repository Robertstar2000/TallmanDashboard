// Script to verify that the IDs in the database match what's displayed in the AdminSpreadsheet component
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Path to AdminSpreadsheet.tsx
const adminSpreadsheetPath = path.join(process.cwd(), 'components', 'admin', 'AdminSpreadsheet.tsx');
console.log(`AdminSpreadsheet path: ${adminSpreadsheetPath}`);

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
  
  // Check if all IDs are in the correct format
  if (rowFormatCount === rows.length) {
    console.log('\nSUCCESS: All rows in the database have the correct ID format.');
  } else {
    console.log('\nWARNING: Not all rows in the database have the correct ID format.');
    
    // List first 10 rows with incorrect ID format
    console.log('\nSample of rows with incorrect ID format:');
    let count = 0;
    rows.forEach(row => {
      const id = row.id;
      if ((id === null || id === '' || !/^row_\d+$/.test(id)) && count < 10) {
        console.log(`- ID: ${id || 'null'}, Chart Group: ${row.chart_group}, Variable: ${row.variable_name}`);
        count++;
      }
    });
  }
  
  // Check the AdminSpreadsheet component
  fs.readFile(adminSpreadsheetPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading AdminSpreadsheet.tsx:', err.message);
      closeDb();
      return;
    }
    
    console.log('\nAnalyzing AdminSpreadsheet component...');
    
    // Check if the component is displaying the ID correctly
    const idDisplay = data.match(/<TableCell>\s*<div[^>]*>\s*{row\.id}\s*<\/div>\s*<\/TableCell>/);
    if (idDisplay) {
      console.log('SUCCESS: AdminSpreadsheet component is displaying the ID field correctly.');
    } else {
      console.log('WARNING: AdminSpreadsheet component may not be displaying the ID field correctly.');
    }
    
    // Check if the component is using the ID for row highlighting
    const rowHighlighting = data.match(/className={activeRowId === row\.id \? .* : ''}/);
    if (rowHighlighting) {
      console.log('SUCCESS: AdminSpreadsheet component is using the ID field for row highlighting.');
    } else {
      console.log('WARNING: AdminSpreadsheet component may not be using the ID field for row highlighting.');
    }
    
    // Save results to a file for easier viewing
    const results = {
      databaseSummary: {
        totalRows: rows.length,
        rowFormatCount,
        numericFormatCount,
        nullOrEmptyCount,
        otherFormatCount
      },
      componentChecks: {
        idDisplayFound: !!idDisplay,
        rowHighlightingFound: !!rowHighlighting
      }
    };
    
    fs.writeFileSync('id-verification-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to id-verification-results.json');
    
    closeDb();
  });
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
