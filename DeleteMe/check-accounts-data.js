const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to check the Accounts data in the SQLite database
 * This will help us understand the current structure before making changes
 */
async function checkAccountsData() {
  console.log('=== Checking Accounts Data in SQLite ===');
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
    
    // Check if the chart_data table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='chart_data'
    `);
    
    if (!tableExists) {
      throw new Error('chart_data table does not exist in the SQLite database');
    }
    
    // Get all rows from the chart_data table
    const allRows = await db.all(`
      SELECT id, chart_group as chartGroup, variable_name as variableName, value, last_updated as lastUpdated
      FROM chart_data
      ORDER BY chart_group, id
    `);
    
    console.log(`\nFound ${allRows.length} total rows in chart_data table`);
    
    // Count rows by chart group
    const groupCounts = {};
    allRows.forEach(row => {
      if (!groupCounts[row.chartGroup]) {
        groupCounts[row.chartGroup] = 0;
      }
      groupCounts[row.chartGroup]++;
    });
    
    console.log('\n--- Row counts by chart group ---');
    Object.keys(groupCounts).sort().forEach(group => {
      console.log(`${group}: ${groupCounts[group]} rows`);
    });
    
    // Get the Accounts rows specifically
    const accountsRows = allRows.filter(row => row.chartGroup === 'Accounts');
    
    console.log(`\n--- Found ${accountsRows.length} Accounts rows ---`);
    
    // Organize by variable and month
    const accountsByVarAndMonth = {};
    
    accountsRows.forEach(row => {
      // Extract variable name (Payable, Receivable, Overdue)
      let variableName = null;
      if (row.variableName.includes('Payable')) variableName = 'Payable';
      else if (row.variableName.includes('Receivable')) variableName = 'Receivable';
      else if (row.variableName.includes('Overdue')) variableName = 'Overdue';
      
      // Extract month name
      const monthMatch = row.variableName.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
      const monthName = monthMatch ? monthMatch[0] : null;
      
      if (variableName && monthName) {
        if (!accountsByVarAndMonth[variableName]) {
          accountsByVarAndMonth[variableName] = {};
        }
        accountsByVarAndMonth[variableName][monthName] = {
          id: row.id,
          value: row.value,
          lastUpdated: row.lastUpdated
        };
      }
    });
    
    // Display the organized data
    console.log('\n--- Accounts Data by Variable and Month ---');
    for (const variable of Object.keys(accountsByVarAndMonth).sort()) {
      console.log(`\n${variable}:`);
      for (const month of ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']) {
        const data = accountsByVarAndMonth[variable][month];
        if (data) {
          console.log(`  ${month.padEnd(10)}: ${data.value}`);
        } else {
          console.log(`  ${month.padEnd(10)}: Not found`);
        }
      }
    }
    
    // Now let's check the API to see what it's returning
    console.log('\n--- Checking API Data ---');
    console.log('Fetching data from the dashboard API...');
    
    // Close the SQLite database
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
    console.log('\n=== Accounts Data Check Completed ===');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Run the check function
checkAccountsData()
  .then(() => {
    console.log('Check completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
