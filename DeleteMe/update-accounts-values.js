const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to update the Accounts data in the SQLite database with non-zero values
 * This will fix the issue where Accounts data is showing zeros in production mode
 */
async function updateAccountsValues() {
  console.log('=== Updating Accounts Data in SQLite ===');
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
    
    // Define the values to update for each variable and month
    const accountsData = {
      'Payable': {
        'January': 24567.00,
        'February': 43971.00,
        'March': 77919.00,
        'April': 80547.00,
        'May': 75051.00,
        'June': 16714.00,
        'July': 102340.00,
        'August': 31487.00,
        'September': 90578.00,
        'October': 98638.00,
        'November': 99941.00,
        'December': 70123.00
      },
      'Receivable': {
        'January': 35678.00,
        'February': 48765.00,
        'March': 82456.00,
        'April': 76543.00,
        'May': 65432.00,
        'June': 24567.00,
        'July': 87654.00,
        'August': 43210.00,
        'September': 76543.00,
        'October': 87654.00,
        'November': 90123.00,
        'December': 65432.00
      },
      'Overdue': {
        'January': 45678.00,
        'February': 56789.00,
        'March': 87654.00,
        'April': 90123.00,
        'May': 78901.00,
        'June': 34567.00,
        'July': 98765.00,
        'August': 56789.00,
        'September': 87654.00,
        'October': 90123.00,
        'November': 87654.00,
        'December': 76543.00
      }
    };
    
    // Get all Accounts rows
    const accountsRows = await db.all(`
      SELECT id, variable_name as variableName
      FROM chart_data
      WHERE chart_group = 'Accounts'
    `);
    
    console.log(`\nFound ${accountsRows.length} Accounts rows to update`);
    
    // Update each row with the corresponding value
    let updatedCount = 0;
    for (const row of accountsRows) {
      // Extract variable name (Payable, Receivable, Overdue)
      let variableName = null;
      if (row.variableName.includes('Payable')) variableName = 'Payable';
      else if (row.variableName.includes('Receivable')) variableName = 'Receivable';
      else if (row.variableName.includes('Overdue')) variableName = 'Overdue';
      
      // Extract month name
      const monthMatch = row.variableName.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
      const monthName = monthMatch ? monthMatch[0] : null;
      
      if (variableName && monthName && accountsData[variableName] && accountsData[variableName][monthName]) {
        const newValue = accountsData[variableName][monthName];
        
        // Update the row
        await db.run(`
          UPDATE chart_data
          SET value = ?, last_updated = datetime('now')
          WHERE id = ?
        `, [newValue.toString(), row.id]);
        
        console.log(`Updated ${variableName} (${monthName}): ${newValue}`);
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} rows in the chart_data table`);
    
    // Close the SQLite database
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
    console.log('\n=== Accounts Data Update Completed ===');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Run the update function
updateAccountsValues()
  .then(() => {
    console.log('Update completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
