const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to fetch the current dashboard data from the API
 * This will show us the actual data being displayed on the dashboard
 */
async function fetchDashboardData() {
  console.log('=== Fetching Dashboard Data ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the SQLite database for comparison
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
      ORDER BY id
    `);
    
    console.log(`\nFound ${accountsRows.length} Accounts rows in SQLite database`);
    
    // Fetch data from the dashboard API
    console.log('\n--- Fetching data from dashboard API ---');
    
    const response = await fetch('http://localhost:3000/api/dashboard/data?forceRefresh=true');
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const dashboardData = await response.json();
    console.log('✅ Successfully fetched dashboard data');
    
    // Extract the Accounts data from the dashboard response
    console.log('\n--- Accounts Data in Dashboard ---');
    
    const accountsData = dashboardData.find(group => group.name === 'Accounts');
    
    if (!accountsData) {
      console.log('❌ No Accounts data found in dashboard response');
    } else {
      console.log(`Found Accounts data with ${accountsData.variables.length} variables`);
      
      // Display the variables and their values
      accountsData.variables.forEach(variable => {
        console.log(`\nVariable: ${variable.name}`);
        console.log('Values:');
        
        // Format the values for display
        variable.values.forEach((value, index) => {
          const formattedValue = typeof value === 'number' 
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
            : value;
          
          console.log(`  ${index}: ${formattedValue}`);
        });
      });
      
      // Compare with SQLite data
      console.log('\n--- Comparison with SQLite Data ---');
      
      // Group SQLite rows by variable
      const rowsByVariable = {};
      accountsRows.forEach(row => {
        const baseVariableName = row.variable_name.split(' (')[0];
        
        if (!rowsByVariable[baseVariableName]) {
          rowsByVariable[baseVariableName] = [];
        }
        rowsByVariable[baseVariableName].push(row);
      });
      
      // Compare each variable
      for (const variable of accountsData.variables) {
        const sqliteRows = rowsByVariable[variable.name] || [];
        
        console.log(`\nVariable: ${variable.name}`);
        console.log(`  Dashboard has ${variable.values.length} values`);
        console.log(`  SQLite has ${sqliteRows.length} rows`);
        
        // Compare values if counts match
        if (variable.values.length === sqliteRows.length) {
          console.log('  Values comparison:');
          
          for (let i = 0; i < variable.values.length; i++) {
            const dashboardValue = variable.values[i];
            const sqliteValue = parseFloat(sqliteRows[i].value) || 0;
            
            const formattedDashboardValue = typeof dashboardValue === 'number' 
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dashboardValue)
              : dashboardValue;
            
            const formattedSqliteValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sqliteValue);
            
            const match = dashboardValue === sqliteValue ? '✅' : '❌';
            console.log(`    ${i}: ${formattedDashboardValue} (Dashboard) vs ${formattedSqliteValue} (SQLite) ${match}`);
          }
        }
      }
    }
    
    // Close the SQLite database
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
    console.log('\n=== Dashboard Data Fetch Completed ===');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Run the fetch function
fetchDashboardData()
  .then(() => {
    console.log('Fetch completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
