/**
 * Setup Admin Variables (Fixed)
 * 
 * This script sets up the admin_variables table with the POR Historical Data rows.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to check if the database file exists
function checkDatabaseFile() {
  try {
    console.log('Checking database file...');
    
    // First, check if the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      console.log('Data directory does not exist, creating it...');
      fs.mkdirSync(dataDir, { recursive: true });
    } else {
      console.log(`Data directory exists at ${dataDir}`);
    }
    
    // Check if the database file exists
    const dbFile = path.join(dataDir, 'dashboard.db');
    if (!fs.existsSync(dbFile)) {
      console.log(`Database file does not exist at ${dbFile}`);
    } else {
      console.log(`Database file exists at ${dbFile}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error checking database file:', error.message);
    return false;
  }
}

// Function to create the admin_variables table
function createAdminVariablesTable() {
  try {
    console.log('Creating admin_variables table...');
    
    const scriptContent = `
      import { executeWrite } from './lib/db/sqlite';
      
      async function createTable() {
        try {
          // Check if the table exists
          const tableCheckSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='admin_variables'";
          const tableResult = await executeWrite(tableCheckSql);
          
          console.log('Table check result:', tableResult);
          
          if (!Array.isArray(tableResult) || tableResult.length === 0) {
            console.log('admin_variables table does not exist, creating it...');
            
            // Create the admin_variables table
            const createTableSql = \`
              CREATE TABLE admin_variables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                value TEXT,
                category TEXT,
                chart_group TEXT,
                chart_name TEXT,
                variable_name TEXT,
                server_name TEXT,
                sql_expression TEXT,
                production_sql_expression TEXT,
                table_name TEXT,
                timeframe TEXT
              )
            \`;
            
            await executeWrite(createTableSql);
            console.log('Created admin_variables table');
          } else {
            console.log('admin_variables table already exists');
          }
        } catch (error) {
          console.error('Error creating table:', error.message);
        }
      }
      
      createTable().catch(console.error);
    `;
    
    fs.writeFileSync('temp-create-table.ts', scriptContent);
    
    const output = execSync('npx ts-node temp-create-table.ts', { 
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    console.log(output);
    
    // Clean up the temporary file
    fs.unlinkSync('temp-create-table.ts');
    
    return true;
  } catch (error) {
    console.error('Error creating admin_variables table:', error.message);
    return false;
  }
}

// Function to create the POR Historical Data rows
function createPorHistoricalDataRows() {
  try {
    console.log('Creating POR Historical Data rows...');
    
    const scriptContent = `
      import { executeWrite } from './lib/db/sqlite';
      
      async function createPorHistoricalData() {
        try {
          // Check if there are any Historical Data POR rows
          const checkSql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'";
          const checkResult = await executeWrite(checkSql);
          console.log('Check result:', checkResult);
          
          const count = Array.isArray(checkResult) && checkResult.length > 0 ? checkResult[0].count : 0;
          
          if (count > 0) {
            console.log(\`Found \${count} existing Historical Data POR rows, skipping creation\`);
            return;
          }
          
          console.log('No Historical Data POR rows found, creating them...');
          
          // Create the POR Historical Data rows
          const porHistoricalRows = [];
          
          for (let i = 1; i <= 12; i++) {
            const monthOffset = i === 1 ? 0 : -(i - 1);
            
            // MS Access SQL for the month - using the verified TotalAmount column
            const msAccessSql = \`SELECT Sum(Nz([TotalAmount],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],'yyyy-mm') = Format(DateAdd('m',\${monthOffset},Date()),'yyyy-mm')\`;
            
            // SQL Server equivalent (for reference)
            const sqlServerSql = \`SELECT ISNULL(SUM([TotalAmount]), 0) as value FROM [PurchaseOrder] WHERE FORMAT([Date], 'yyyy-MM') = FORMAT(DATEADD(month, \${monthOffset}, GETDATE()), 'yyyy-MM')\`;
            
            porHistoricalRows.push({
              name: \`Historical Data - POR - Month \${i}\`,
              value: '0',
              category: 'POR',
              chart_group: 'Historical Data',
              chart_name: 'Historical Data',
              variable_name: 'POR',
              server_name: 'POR',
              sql_expression: sqlServerSql,
              production_sql_expression: msAccessSql,
              table_name: 'PurchaseOrder',
              timeframe: \`Month \${i}\`
            });
          }
          
          console.log(\`Generated \${porHistoricalRows.length} POR Historical Data rows\`);
          
          // Insert the rows
          for (const row of porHistoricalRows) {
            const insertSql = \`
              INSERT INTO admin_variables (
                name, 
                value, 
                category, 
                chart_group, 
                chart_name, 
                variable_name, 
                server_name, 
                sql_expression, 
                production_sql_expression,
                table_name,
                timeframe
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            \`;
            
            await executeWrite(insertSql, [
              row.name,
              row.value,
              row.category,
              row.chart_group,
              row.chart_name,
              row.variable_name,
              row.server_name,
              row.sql_expression,
              row.production_sql_expression,
              row.table_name,
              row.timeframe
            ]);
            
            console.log(\`Inserted row for \${row.timeframe}\`);
          }
          
          console.log(\`Created \${porHistoricalRows.length} Historical Data POR rows\`);
          
          // Verify the rows
          const verifySql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'";
          const verifyResult = await executeWrite(verifySql);
          const verifyCount = Array.isArray(verifyResult) && verifyResult.length > 0 ? verifyResult[0].count : 0;
          
          console.log(\`Verified \${verifyCount} Historical Data POR rows in the admin_variables table\`);
        } catch (error) {
          console.error('Error creating POR Historical Data rows:', error.message);
        }
      }
      
      createPorHistoricalData().catch(console.error);
    `;
    
    fs.writeFileSync('temp-create-rows.ts', scriptContent);
    
    const output = execSync('npx ts-node temp-create-rows.ts', { 
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    console.log(output);
    
    // Clean up the temporary file
    fs.unlinkSync('temp-create-rows.ts');
    
    return true;
  } catch (error) {
    console.error('Error creating POR Historical Data rows:', error.message);
    return false;
  }
}

// Function to check the admin_variables table
function checkAdminVariables() {
  try {
    console.log('Checking admin_variables table...');
    
    const scriptContent = `
      import { executeWrite } from './lib/db/sqlite';
      
      async function checkAdminVariables() {
        try {
          // Check if the table exists
          const tableCheckSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='admin_variables'";
          const tableResult = await executeWrite(tableCheckSql);
          
          console.log('Table check result:', tableResult);
          
          if (!Array.isArray(tableResult) || tableResult.length === 0) {
            console.log('admin_variables table does not exist');
            return;
          }
          
          console.log('admin_variables table exists');
          
          // Get the count of all rows
          const countSql = "SELECT COUNT(*) as count FROM admin_variables";
          const countResult = await executeWrite(countSql);
          console.log('Count result:', countResult);
          
          const count = Array.isArray(countResult) && countResult.length > 0 ? countResult[0].count : 0;
          
          console.log(\`admin_variables table contains \${count} rows\`);
          
          // Get the count of Historical Data rows
          const historicalDataSql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'Historical Data'";
          const historicalDataResult = await executeWrite(historicalDataSql);
          console.log('Historical Data count result:', historicalDataResult);
          
          const historicalDataCount = Array.isArray(historicalDataResult) && historicalDataResult.length > 0 ? historicalDataResult[0].count : 0;
          
          console.log(\`admin_variables table contains \${historicalDataCount} Historical Data rows\`);
          
          // Get the count of POR Historical Data rows
          const porHistoricalDataSql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'";
          const porHistoricalDataResult = await executeWrite(porHistoricalDataSql);
          console.log('POR Historical Data count result:', porHistoricalDataResult);
          
          const porHistoricalDataCount = Array.isArray(porHistoricalDataResult) && porHistoricalDataResult.length > 0 ? porHistoricalDataResult[0].count : 0;
          
          console.log(\`admin_variables table contains \${porHistoricalDataCount} POR Historical Data rows\`);
          
          // Get a sample POR Historical Data row
          if (porHistoricalDataCount > 0) {
            const sampleSql = "SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR' LIMIT 1";
            const sampleResult = await executeWrite(sampleSql);
            console.log('Sample result:', sampleResult);
            
            if (Array.isArray(sampleResult) && sampleResult.length > 0) {
              console.log('\\nSample POR Historical Data row:');
              console.log(\`ID: \${sampleResult[0].id}\`);
              console.log(\`Name: \${sampleResult[0].name}\`);
              console.log(\`Value: \${sampleResult[0].value}\`);
              console.log(\`Timeframe: \${sampleResult[0].timeframe}\`);
              console.log(\`Production SQL: \${sampleResult[0].production_sql_expression}\`);
            }
          }
        } catch (error) {
          console.error('Error checking admin_variables:', error.message);
        }
      }
      
      checkAdminVariables().catch(console.error);
    `;
    
    fs.writeFileSync('temp-check-table.ts', scriptContent);
    
    const output = execSync('npx ts-node temp-check-table.ts', { 
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    console.log(output);
    
    // Clean up the temporary file
    fs.unlinkSync('temp-check-table.ts');
    
    return true;
  } catch (error) {
    console.error('Error checking admin_variables:', error.message);
    return false;
  }
}

// Run the setup
console.log('Setting up admin_variables table with POR Historical Data rows...');
console.log('\nStep 1: Checking database file...');
checkDatabaseFile();

console.log('\nStep 2: Creating admin_variables table...');
createAdminVariablesTable();

console.log('\nStep 3: Creating POR Historical Data rows...');
createPorHistoricalDataRows();

console.log('\nStep 4: Checking admin_variables table...');
checkAdminVariables();

console.log('\nSetup complete!');
