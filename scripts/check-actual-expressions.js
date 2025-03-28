// Script to check the actual SQL expressions in the database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Function to check the actual SQL expressions in the database
async function checkActualExpressions() {
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Get the table schema
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('\nTables in the database:');
    tables.forEach(table => {
      console.log(`- ${table.name}`);
    });
    
    // Get the column names for the chart_data table
    const columns = await db.all("PRAGMA table_info(chart_data)");
    console.log('\nColumns in the chart_data table:');
    columns.forEach(column => {
      console.log(`- ${column.name}`);
    });
    
    // Check Accounts expressions
    console.log('\nChecking Accounts expressions in the database...');
    
    const accountIds = [
      '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', // Payable
      '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', // Receivable
      '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41'  // Overdue
    ];
    
    for (const id of accountIds) {
      const row = await db.get('SELECT * FROM chart_data WHERE id = ?', id);
      
      if (row) {
        console.log(`ID: ${row.id}, DataPoint: ${row.DataPoint}`);
        console.log(`Value: ${row.value}`);
        console.log(`SQL Expression: ${row.production_sql_expression}`);
        console.log('---');
      } else {
        console.log(`ID: ${id} not found in the database`);
        console.log('---');
      }
    }
    
    // Close the database connection
    await db.close();
    
  } catch (error) {
    console.error('Error checking SQL expressions:', error);
  }
}

// Run the function
checkActualExpressions();
