/**
 * Check Admin Variables
 * 
 * This script checks if the admin_variables table exists and contains the POR Historical Data rows.
 */

const { execSync } = require('child_process');

function checkAdminVariables() {
  try {
    console.log('Checking admin_variables table...');
    
    // Execute the SQLite query to check if the table exists
    const tableCheckCommand = `
      npx ts-node -e "
        import { executeWrite } from './lib/db/sqlite';
        async function checkTable() {
          try {
            const sql = \\"SELECT name FROM sqlite_master WHERE type='table' AND name='admin_variables'\\";
            const result = await executeWrite(sql);
            console.log(JSON.stringify(result, null, 2));
          } catch (error) {
            console.error('Error checking table:', error.message);
          }
        }
        checkTable().catch(console.error);
      "
    `;
    
    console.log('Checking if admin_variables table exists...');
    const tableCheckOutput = execSync(tableCheckCommand, { 
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    console.log('Table check result:');
    console.log(tableCheckOutput);
    
    // Execute the SQLite query to get all rows from the admin_variables table
    const allRowsCommand = `
      npx ts-node -e "
        import { executeWrite } from './lib/db/sqlite';
        async function getAllRows() {
          try {
            const sql = \\"SELECT COUNT(*) as count FROM admin_variables\\";
            const result = await executeWrite(sql);
            console.log('Row count:');
            console.log(JSON.stringify(result, null, 2));
            
            if (result && result.length > 0 && result[0].count > 0) {
              const historicalDataSql = \\"SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'Historical Data'\\";
              const historicalDataResult = await executeWrite(historicalDataSql);
              console.log('\\nHistorical Data rows:');
              console.log(JSON.stringify(historicalDataResult, null, 2));
              
              const porHistoricalDataSql = \\"SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'\\";
              const porHistoricalDataResult = await executeWrite(porHistoricalDataSql);
              console.log('\\nPOR Historical Data rows:');
              console.log(JSON.stringify(porHistoricalDataResult, null, 2));
              
              if (porHistoricalDataResult && porHistoricalDataResult.length > 0 && porHistoricalDataResult[0].count > 0) {
                const porSampleSql = \\"SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR' LIMIT 1\\";
                const porSampleResult = await executeWrite(porSampleSql);
                console.log('\\nSample POR Historical Data row:');
                console.log(JSON.stringify(porSampleResult, null, 2));
              }
            }
          } catch (error) {
            console.error('Error getting rows:', error.message);
          }
        }
        getAllRows().catch(console.error);
      "
    `;
    
    console.log('\nChecking rows in admin_variables table...');
    const allRowsOutput = execSync(allRowsCommand, { 
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    console.log(allRowsOutput);
    
    return true;
  } catch (error) {
    console.error('Error checking admin_variables:', error.message);
    return false;
  }
}

// Run the check
checkAdminVariables();
