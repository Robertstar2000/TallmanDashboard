const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const odbc = require('odbc');

/**
 * Script to fix AR Aging data in the dashboard
 * 
 * This script will:
 * 1. Connect to the P21 database and get the current AR Aging values
 * 2. Connect to the SQLite database and update the AR Aging values
 * 3. Verify that the values have been updated correctly
 */
async function fixArAging() {
  console.log('=== Fixing AR Aging Data ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // First, get the AR Aging data from the P21 database
    console.log('\n--- Getting AR Aging data from P21 database ---');
    
    // Connect to the P21 database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // Get the AR Aging data
    console.log('\n--- Executing AR Aging Queries ---');
    
    // Create an object to store the AR Aging values
    const arAgingValues = {};
    
    // Current
    const currentQuery = "SELECT COALESCE(SUM(current_due), 0) as value FROM dbo.p21_view_asst_customer_aging";
    const currentResult = await connection.query(currentQuery);
    arAgingValues['Current'] = currentResult[0].value;
    console.log(`Current: $${currentResult[0].value.toFixed(2)}`);
    
    // 1-30 Days
    const days1To30Query = "SELECT COALESCE(SUM(past_due_1_30), 0) as value FROM dbo.p21_view_asst_customer_aging";
    const days1To30Result = await connection.query(days1To30Query);
    arAgingValues['1-30 Days'] = days1To30Result[0].value;
    console.log(`1-30 Days: $${days1To30Result[0].value.toFixed(2)}`);
    
    // 31-60 Days
    const days31To60Query = "SELECT COALESCE(SUM(past_due_30_60), 0) as value FROM dbo.p21_view_asst_customer_aging";
    const days31To60Result = await connection.query(days31To60Query);
    arAgingValues['31-60 Days'] = days31To60Result[0].value;
    console.log(`31-60 Days: $${days31To60Result[0].value.toFixed(2)}`);
    
    // 61-90 Days
    const days61To90Query = "SELECT COALESCE(SUM(past_due_60_90), 0) as value FROM dbo.p21_view_asst_customer_aging";
    const days61To90Result = await connection.query(days61To90Query);
    arAgingValues['61-90 Days'] = days61To90Result[0].value;
    console.log(`61-90 Days: $${days61To90Result[0].value.toFixed(2)}`);
    
    // 90+ Days
    const days90PlusQuery = "SELECT COALESCE(SUM(past_due_over90), 0) as value FROM dbo.p21_view_asst_customer_aging";
    const days90PlusResult = await connection.query(days90PlusQuery);
    arAgingValues['90+ Days'] = days90PlusResult[0].value;
    console.log(`90+ Days: $${days90PlusResult[0].value.toFixed(2)}`);
    
    // Close the P21 connection
    await connection.close();
    console.log('\n✅ P21 Connection closed successfully');
    
    // Now, connect to the SQLite database
    console.log('\n--- Connecting to SQLite database ---');
    
    // Open the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ Connected successfully to SQLite database');
    
    // Check if the chart_data table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='chart_data'
    `);
    
    if (!tableExists) {
      throw new Error('chart_data table does not exist in the SQLite database');
    }
    
    console.log('\n--- Updating AR Aging values in SQLite database ---');
    
    // Get the AR Aging rows from the database
    const arAgingRows = await db.all(`
      SELECT id, chart_group, variable_name, value, last_updated
      FROM chart_data
      WHERE chart_group = 'AR Aging'
    `);
    
    console.log(`Found ${arAgingRows.length} AR Aging rows in SQLite database`);
    
    // Format the values as currency
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };
    
    // Update each AR Aging row with the correct value
    for (const row of arAgingRows) {
      const variableName = row.variable_name;
      
      if (arAgingValues[variableName] !== undefined) {
        const rawValue = arAgingValues[variableName];
        const formattedValue = formatCurrency(rawValue);
        
        console.log(`Updating ${variableName}: ${row.value} -> ${formattedValue}`);
        
        // Update the row in the database
        await db.run(`
          UPDATE chart_data
          SET value = ?, last_updated = ?
          WHERE id = ?
        `, [formattedValue, new Date().toISOString(), row.id]);
      } else {
        console.log(`No value found for ${variableName}, skipping`);
      }
    }
    
    // Verify that the values have been updated correctly
    console.log('\n--- Verifying AR Aging values ---');
    
    const updatedRows = await db.all(`
      SELECT id, chart_group, variable_name, value, last_updated
      FROM chart_data
      WHERE chart_group = 'AR Aging'
    `);
    
    for (const row of updatedRows) {
      console.log(`${row.variable_name}: ${row.value} (updated at ${row.last_updated})`);
    }
    
    // Close the SQLite database
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
    console.log('\n=== AR Aging Data Fix Completed ===');
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

// Run the fix function
fixArAging()
  .then(() => {
    console.log('Fix completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
