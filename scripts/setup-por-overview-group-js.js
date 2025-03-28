/**
 * Setup POR Overview Group (JS Version)
 * 
 * This script sets up the POR Overview Group in the admin_variables table
 * with MS Access compatible SQL queries.
 */

const fs = require('fs');
const path = require('path');
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

async function setupPorOverviewGroup() {
  try {
    console.log('Setting up POR Overview Group...');
    
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
    
    // Check if there are any POR Overview Group rows
    const checkSql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_group = 'Overview' AND server_name = 'POR'";
    const checkResult = await executeSql(checkSql);
    const count = Array.isArray(checkResult) && checkResult.length > 0 ? checkResult[0].count : 0;
    
    console.log(`Found ${count} existing POR Overview Group rows`);
    
    // Delete existing POR Overview Group rows if they exist
    if (count > 0) {
      console.log('Deleting existing POR Overview Group rows...');
      const deleteSql = "DELETE FROM admin_variables WHERE chart_group = 'Overview' AND server_name = 'POR'";
      await executeSql(deleteSql);
      console.log(`Deleted ${count} POR Overview Group rows`);
    }
    
    // Define the POR Overview Group rows
    const porOverviewRows = [
      {
        name: "POR - Total Purchase Orders",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Total Purchase Orders",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT COUNT(*) as value FROM [PurchaseOrder]",
        production_sql_expression: "SELECT Count(*) AS value FROM [PurchaseOrder]",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Open Purchase Orders",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Open Purchase Orders",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT COUNT(*) as value FROM [PurchaseOrder] WHERE [Status] = 'O'",
        production_sql_expression: "SELECT Count(*) AS value FROM [PurchaseOrder] WHERE [Status] = 'O'",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Completed Purchase Orders",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Completed Purchase Orders",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT COUNT(*) as value FROM [PurchaseOrder] WHERE [Status] = 'C'",
        production_sql_expression: "SELECT Count(*) AS value FROM [PurchaseOrder] WHERE [Status] = 'C'",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Total Purchase Amount",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Total Purchase Amount",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT ISNULL(SUM([TotalAmount]), 0) as value FROM [PurchaseOrder]",
        production_sql_expression: "SELECT Sum(Nz([TotalAmount],0)) AS value FROM [PurchaseOrder]",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Average Purchase Order Amount",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Average Purchase Order Amount",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT ISNULL(AVG([TotalAmount]), 0) as value FROM [PurchaseOrder] WHERE [TotalAmount] > 0",
        production_sql_expression: "SELECT Avg(Nz([TotalAmount],0)) AS value FROM [PurchaseOrder] WHERE [TotalAmount] > 0",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Current Month Purchase Orders",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Current Month Purchase Orders",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT COUNT(*) as value FROM [PurchaseOrder] WHERE FORMAT([Date], 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')",
        production_sql_expression: "SELECT Count(*) AS value FROM [PurchaseOrder] WHERE Format([Date],'yyyy-mm') = Format(Date(),'yyyy-mm')",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Current Month Purchase Amount",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Current Month Purchase Amount",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT ISNULL(SUM([TotalAmount]), 0) as value FROM [PurchaseOrder] WHERE FORMAT([Date], 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')",
        production_sql_expression: "SELECT Sum(Nz([TotalAmount],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],'yyyy-mm') = Format(Date(),'yyyy-mm')",
        table_name: "PurchaseOrder"
      }
    ];
    
    console.log('Creating POR Overview Group rows...');
    
    // Insert the rows
    for (const row of porOverviewRows) {
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
          table_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        row.table_name
      ]);
      
      console.log(`Created POR Overview row: ${row.name}`);
    }
    
    console.log(`Created ${porOverviewRows.length} POR Overview Group rows`);
    
    // Save the POR Overview Group SQL to a file for reference
    const porOverviewSql = porOverviewRows.map(row => ({
      name: row.name,
      chart_name: row.chart_name,
      sqlExpression: row.sql_expression,
      productionSqlExpression: row.production_sql_expression
    }));
    
    fs.writeFileSync('por-overview-group-sql.json', JSON.stringify(porOverviewSql, null, 2));
    console.log('\nSaved POR Overview Group SQL to por-overview-group-sql.json');
    
    // Verify the rows
    const verifySql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_group = 'Overview' AND server_name = 'POR'";
    const verifyResult = await executeSql(verifySql);
    const verifyCount = Array.isArray(verifyResult) && verifyResult.length > 0 ? verifyResult[0].count : 0;
    
    console.log(`\nVerified ${verifyCount} POR Overview Group rows in the admin_variables table`);
    
    // Display a sample row
    const sampleSql = "SELECT * FROM admin_variables WHERE chart_group = 'Overview' AND server_name = 'POR' LIMIT 1";
    const sampleResult = await executeSql(sampleSql);
    
    if (Array.isArray(sampleResult) && sampleResult.length > 0) {
      console.log('\nSample POR Overview Group row:');
      console.log(`Name: ${sampleResult[0].name}`);
      console.log(`Chart Name: ${sampleResult[0].chart_name}`);
      console.log(`Production SQL: ${sampleResult[0].production_sql_expression}`);
    }
    
    console.log('\nPOR Overview Group setup complete!');
    return true;
  } catch (error) {
    console.error('Error setting up POR Overview Group:', error.message);
    return false;
  }
}

// Run the setup
setupPorOverviewGroup().catch(error => {
  console.error('Unhandled error:', error.message);
});
