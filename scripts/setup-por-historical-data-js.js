/**
 * Setup POR Historical Data (JS Version)
 * 
 * This script sets up the POR Historical Data rows in the admin_variables table
 * with the correct structure expected by the test-por-integration.js script.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

// Get the data directory path
function getDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

// Get the database path
function getDbPath() {
  return path.join(getDataDir(), 'dashboard.db');
}

// Execute a SQL query with parameters
function executeSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(getDbPath());
    db.all(sql, params, (err, rows) => {
      if (err) {
        db.close();
        reject(err);
        return;
      }
      
      db.close();
      resolve(rows);
    });
  });
}

async function setupPorHistoricalData() {
  try {
    console.log('Setting up POR Historical Data rows...');
    
    // Check if the admin_variables table exists
    const tableCheckSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='admin_variables'";
    const tableResult = await executeSql(tableCheckSql);
    
    if (!Array.isArray(tableResult) || tableResult.length === 0) {
      console.log('admin_variables table does not exist, creating it...');
      
      // Create the admin_variables table
      const createTableSql = `
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
      `;
      
      await executeSql(createTableSql);
      console.log('Created admin_variables table');
    } else {
      console.log('admin_variables table already exists');
    }
    
    // Check if there are any POR Historical Data rows
    const checkSql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'";
    const checkResult = await executeSql(checkSql);
    const count = Array.isArray(checkResult) && checkResult.length > 0 ? checkResult[0].count : 0;
    
    console.log(`Found ${count} existing POR Historical Data rows`);
    
    // Delete existing POR Historical Data rows if they exist
    if (count > 0) {
      console.log('Deleting existing POR Historical Data rows...');
      const deleteSql = "DELETE FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'";
      await executeSql(deleteSql);
      console.log(`Deleted ${count} POR Historical Data rows`);
    }
    
    // Create the POR Historical Data rows
    console.log('Creating POR Historical Data rows...');
    const porHistoricalRows = [];
    
    for (let i = 1; i <= 12; i++) {
      const monthOffset = i === 1 ? 0 : -(i - 1);
      
      // MS Access SQL for the month - using the verified TotalAmount column
      const msAccessSql = `SELECT Sum(Nz([TotalAmount],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],'yyyy-mm') = Format(DateAdd('m',${monthOffset},Date()),'yyyy-mm')`;
      
      // SQL Server equivalent (for reference)
      const sqlServerSql = `SELECT ISNULL(SUM([TotalAmount]), 0) as value FROM [PurchaseOrder] WHERE FORMAT([Date], 'yyyy-MM') = FORMAT(DATEADD(month, ${monthOffset}, GETDATE()), 'yyyy-MM')`;
      
      porHistoricalRows.push({
        name: `Historical Data - POR - Month ${i}`,
        value: '0',
        category: 'POR',
        chart_group: 'Historical Data',
        chart_name: 'Historical Data',
        variable_name: 'POR',
        server_name: 'POR',
        sql_expression: sqlServerSql,
        production_sql_expression: msAccessSql,
        table_name: 'PurchaseOrder',
        timeframe: `Month ${i}`
      });
    }
    
    // Insert the rows
    for (const row of porHistoricalRows) {
      const insertSql = `
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
      `;
      
      await executeSql(insertSql, [
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
      
      console.log(`Created POR Historical Data row for ${row.timeframe}`);
    }
    
    console.log(`Created ${porHistoricalRows.length} POR Historical Data rows`);
    
    // Verify the rows
    const verifySql = "SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR' ORDER BY timeframe";
    const verifyResult = await executeSql(verifySql);
    const verifyCount = Array.isArray(verifyResult) ? verifyResult.length : 0;
    
    console.log(`\nVerified ${verifyCount} POR Historical Data rows in the admin_variables table`);
    
    if (verifyCount > 0 && Array.isArray(verifyResult)) {
      console.log('\nSample POR Historical Data row:');
      console.log(`ID: ${verifyResult[0].id}`);
      console.log(`Name: ${verifyResult[0].name}`);
      console.log(`Timeframe: ${verifyResult[0].timeframe}`);
      console.log(`Production SQL: ${verifyResult[0].production_sql_expression}`);
    }
    
    console.log('\nPOR Historical Data setup complete!');
    return true;
  } catch (error) {
    console.error('Error setting up POR Historical Data:', error.message);
    return false;
  }
}

// Run the setup
setupPorHistoricalData().catch(error => {
  console.error('Unhandled error:', error.message);
});
