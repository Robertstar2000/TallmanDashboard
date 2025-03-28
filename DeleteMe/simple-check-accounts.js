const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Simple script to check the Accounts data in the SQLite database
 */
async function simpleCheckAccounts() {
  console.log('=== Simple Check of Accounts Data ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the SQLite database
    console.log('\n--- Connecting to SQLite database ---');
    
    // Open the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ Connected successfully to SQLite database');
    
    // Get the Accounts rows from the SQLite database
    const accountsRows = await db.all(`
      SELECT id, chart_group, variable_name, value, 
             sql_expression, production_sql_expression,
             server_name, db_table_name, last_updated
      FROM chart_data
      WHERE chart_group = 'Accounts'
      ORDER BY variable_name, id
    `);
    
    console.log(`\nFound ${accountsRows.length} Accounts rows in SQLite database`);
    
    // Group the rows by variable name
    const rowsByVariable = {};
    accountsRows.forEach(row => {
      const baseVariableName = row.variable_name.split(' (')[0];
      
      if (!rowsByVariable[baseVariableName]) {
        rowsByVariable[baseVariableName] = [];
      }
      rowsByVariable[baseVariableName].push(row);
    });
    
    console.log('\n--- Variable groups ---');
    Object.keys(rowsByVariable).forEach(variable => {
      console.log(`${variable}: ${rowsByVariable[variable].length} rows`);
    });
    
    // Display the data for each variable
    for (const [variableName, rows] of Object.entries(rowsByVariable)) {
      console.log(`\n=== ${variableName} Data ===`);
      
      // Sort rows by month name to ensure they're in chronological order
      const monthOrder = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 
        'May': 5, 'June': 6, 'July': 7, 'August': 8, 
        'September': 9, 'October': 10, 'November': 11, 'December': 12
      };
      
      rows.sort((a, b) => {
        const monthA = a.variable_name.match(/\((.*?)\)/)?.[1] || '';
        const monthB = b.variable_name.match(/\((.*?)\)/)?.[1] || '';
        return monthOrder[monthA] - monthOrder[monthB];
      });
      
      // Display each row
      rows.forEach(row => {
        const monthName = row.variable_name.match(/\((.*?)\)/)?.[1] || 'Unknown';
        const value = parseFloat(row.value) || 0;
        const formattedValue = new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(value);
        
        console.log(`${monthName.padEnd(10)}: ${formattedValue}`);
        
        // Display SQL expression for the first row only
        if (row === rows[0]) {
          console.log(`\nSQL Expression: ${row.sql_expression}`);
          console.log(`Production SQL: ${row.production_sql_expression}`);
          console.log(`Table: ${row.db_table_name}`);
          console.log(`Last Updated: ${row.last_updated || 'Never'}`);
        }
      });
    }
    
    // Close the SQLite database
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
    console.log('\n=== Simple Check Completed ===');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Run the check function
simpleCheckAccounts()
  .then(() => {
    console.log('Check completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
