const fs = require('fs');
const path = require('path');

/**
 * Script to update the initialization data for the Accounts group
 * This will update the SQL queries in the initial-data.ts file
 */
async function updateAccountsInitialization() {
  console.log('=== Updating Accounts Initialization Data ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Define the path to the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    console.log(`Initial data file path: ${initialDataPath}`);
    
    // Read the initial-data.ts file
    console.log('\n--- Reading initial-data.ts file ---');
    const initialData = fs.readFileSync(initialDataPath, 'utf8');
    console.log('✅ File read successfully');
    
    // Define the month names for the past 12 months
    const monthNames = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'long' });
      monthNames.push(monthName);
    }
    
    console.log('\n--- Month names for the past 12 months ---');
    console.log(monthNames.join(', '));
    
    // Define the working SQL queries for each variable type
    const workingQueries = {
      'Payable': {
        testSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ap_open_items WHERE status = 'O'",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ap_open_items WHERE status = 'O'",
        tableName: "ap_open_items"
      },
      'Receivable': {
        testSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O'",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O'",
        tableName: "ar_open_items"
      },
      'Overdue': {
        testSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O' AND due_date < GETDATE()",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O' AND due_date < GETDATE()",
        tableName: "ar_open_items"
      }
    };
    
    // Create monthly queries for each variable
    console.log('\n--- Creating monthly queries ---');
    
    const monthlyQueries = {};
    
    for (const [variableName, baseQuery] of Object.entries(workingQueries)) {
      monthlyQueries[variableName] = [];
      
      for (let i = 0; i < 12; i++) {
        const monthName = monthNames[i];
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        const month = d.getMonth() + 1; // JavaScript months are 0-indexed
        const year = d.getFullYear();
        
        // Create the monthly query
        const monthlyTestSql = baseQuery.testSql.replace(
          "WHERE status = 'O'", 
          `WHERE status = 'O' AND MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = ${year}`
        );
        
        const monthlyProductionSql = baseQuery.productionSql.replace(
          "WHERE status = 'O'", 
          `WHERE status = 'O' AND MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = ${year}`
        );
        
        // For Overdue, we need a different approach
        if (variableName === 'Overdue') {
          const monthlyOverdueTestSql = baseQuery.testSql.replace(
            "WHERE status = 'O' AND due_date < GETDATE()", 
            `WHERE status = 'O' AND due_date < GETDATE() AND MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = ${year}`
          );
          
          const monthlyOverdueProductionSql = baseQuery.productionSql.replace(
            "WHERE status = 'O' AND due_date < GETDATE()", 
            `WHERE status = 'O' AND due_date < GETDATE() AND MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = ${year}`
          );
          
          monthlyQueries[variableName].push({
            month: i,
            monthName,
            testSql: monthlyOverdueTestSql,
            productionSql: monthlyOverdueProductionSql,
            tableName: baseQuery.tableName
          });
        } else {
          monthlyQueries[variableName].push({
            month: i,
            monthName,
            testSql: monthlyTestSql,
            productionSql: monthlyProductionSql,
            tableName: baseQuery.tableName
          });
        }
      }
    }
    
    // Find the Accounts section in the initial-data.ts file
    console.log('\n--- Finding Accounts section in initial-data.ts ---');
    
    // Find all rows for the Accounts group
    const accountsRows = [];
    const lines = initialData.split('\n');
    
    let inAccountsSection = false;
    let accountsStartIndex = -1;
    let accountsEndIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('chartGroup: \'Accounts\'')) {
        if (!inAccountsSection) {
          inAccountsSection = true;
          accountsStartIndex = i;
        }
      } else if (inAccountsSection && line.includes('chartGroup:') && !line.includes('chartGroup: \'Accounts\'')) {
        inAccountsSection = false;
        accountsEndIndex = i;
        break;
      }
    }
    
    if (accountsStartIndex === -1 || accountsEndIndex === -1) {
      throw new Error('Could not find Accounts section in initial-data.ts');
    }
    
    console.log(`Found Accounts section from line ${accountsStartIndex} to ${accountsEndIndex}`);
    
    // Extract the Accounts rows
    const accountsSection = lines.slice(accountsStartIndex - 2, accountsEndIndex - 2);
    
    // Parse the Accounts rows to extract the IDs and variable names
    const accountsRowsData = [];
    let currentRow = {};
    
    for (const line of accountsSection) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('id:')) {
        currentRow.id = trimmedLine.split('\'')[1];
      } else if (trimmedLine.startsWith('variableName:')) {
        currentRow.variableName = trimmedLine.split('\'')[1];
      } else if (trimmedLine.startsWith('serverName:')) {
        currentRow.serverName = trimmedLine.split('\'')[1];
      } else if (trimmedLine === '},') {
        accountsRowsData.push({ ...currentRow });
        currentRow = {};
      }
    }
    
    console.log(`Parsed ${accountsRowsData.length} Accounts rows`);
    
    // Group the rows by variable name
    const rowsByVariable = {};
    accountsRowsData.forEach(row => {
      if (!rowsByVariable[row.variableName]) {
        rowsByVariable[row.variableName] = [];
      }
      rowsByVariable[row.variableName].push(row);
    });
    
    console.log('\n--- Variable groups ---');
    Object.keys(rowsByVariable).forEach(variable => {
      console.log(`${variable}: ${rowsByVariable[variable].length} rows`);
    });
    
    // Create the updated Accounts section
    console.log('\n--- Creating updated Accounts section ---');
    
    let updatedAccountsSection = '';
    let rowIndex = 0;
    
    // Process each variable type
    for (const variableName of ['Payable', 'Receivable', 'Overdue']) {
      const rows = rowsByVariable[variableName] || [];
      const monthlyQueriesForVariable = monthlyQueries[variableName] || [];
      
      // Ensure we have exactly 12 rows for each variable
      if (rows.length !== 12) {
        console.log(`⚠️ Expected 12 rows for ${variableName}, but found ${rows.length}`);
        console.log('Will update only the available rows');
      }
      
      // Update each row with the corresponding monthly query
      for (let i = 0; i < Math.min(rows.length, 12); i++) {
        const row = rows[i];
        const monthlyQuery = monthlyQueriesForVariable[i];
        
        if (!monthlyQuery) {
          console.log(`⚠️ No monthly query found for ${variableName} month ${i}, skipping update`);
          continue;
        }
        
        // Create the updated row
        updatedAccountsSection += `  {
    id: '${row.id}',
    name: '',
    chartGroup: 'Accounts',
    variableName: '${variableName} (${monthlyQuery.monthName})',
    serverName: '${row.serverName}',
    value: '0',
    calculation: 'SUM(balance)',
    sqlExpression: \`${monthlyQuery.testSql}\`,
    productionSqlExpression: \`${monthlyQuery.productionSql}\`,
    tableName: '${monthlyQuery.tableName}'
  },\n`;
        
        rowIndex++;
      }
    }
    
    // Update the initial-data.ts file
    console.log('\n--- Updating initial-data.ts file ---');
    
    // Replace the Accounts section with the updated section
    const updatedInitialData = [
      ...lines.slice(0, accountsStartIndex - 2),
      updatedAccountsSection,
      ...lines.slice(accountsEndIndex - 2)
    ].join('\n');
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, updatedInitialData);
    console.log('✅ File updated successfully');
    
    // Create a backup of the original file
    const backupPath = `${initialDataPath}.bak`;
    fs.writeFileSync(backupPath, initialData);
    console.log(`✅ Backup created at ${backupPath}`);
    
    console.log('\n=== Accounts Initialization Data Update Completed ===');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

// Run the update function
updateAccountsInitialization()
  .then(() => {
    console.log('Update completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
