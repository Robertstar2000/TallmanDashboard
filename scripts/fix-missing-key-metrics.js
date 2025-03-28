// Script to fix missing Key Metrics in the admin spreadsheet view
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// The missing Key Metrics from complete-chart-data.ts
const missingKeyMetrics = [
  {
    "id": "122",
    "DataPoint": "Key Metrics OrdersBackloged Overview",
    "chartGroup": "Key Metrics",
    "variableName": "OrdersBackloged",
    "serverName": "P21",
    "value": "0",
    "tableName": "dbo.OE_HDR",
    "calculation": "number",
    "productionSqlExpression": "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())",
    "lastUpdated": new Date().toISOString()
  },
  {
    "id": "123",
    "DataPoint": "Key Metrics Total Sales Monthly Overview",
    "chartGroup": "Key Metrics",
    "variableName": "Total Sales Monthly",
    "serverName": "P21",
    "value": "0",
    "tableName": "dbo.SOMAST",
    "calculation": "number",
    "productionSqlExpression": "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND h.order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))",
    "lastUpdated": new Date().toISOString()
  }
];

// Function to check if a row exists in the database
async function checkRowExists(db, id) {
  const row = await db.get('SELECT id FROM chart_data WHERE id = ?', [id]);
  return !!row;
}

// Function to insert a row into the database
async function insertRow(db, row) {
  await db.run(`
    INSERT INTO chart_data (
      id,
      DataPoint,
      chart_group,
      variable_name,
      server_name,
      table_name,
      calculation,
      production_sql_expression,
      value,
      last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    row.id,
    row.DataPoint,
    row.chartGroup,
    row.variableName,
    row.serverName,
    row.tableName,
    row.calculation,
    row.productionSqlExpression,
    row.value,
    row.lastUpdated
  ]);
}

// Function to update a row in the database
async function updateRow(db, row) {
  await db.run(`
    UPDATE chart_data SET
      DataPoint = ?,
      chart_group = ?,
      variable_name = ?,
      server_name = ?,
      table_name = ?,
      calculation = ?,
      production_sql_expression = ?,
      value = ?,
      last_updated = ?
    WHERE id = ?
  `, [
    row.DataPoint,
    row.chartGroup,
    row.variableName,
    row.serverName,
    row.tableName,
    row.calculation,
    row.productionSqlExpression,
    row.value,
    row.lastUpdated,
    row.id
  ]);
}

// Main function to fix the missing Key Metrics
async function fixMissingKeyMetrics() {
  console.log('Fixing missing Key Metrics in the admin spreadsheet view...');
  
  try {
    // Check if the database file exists
    if (!fs.existsSync(dbPath)) {
      console.error(`Database file not found at ${dbPath}`);
      return;
    }
    
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Check if the chart_data table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='chart_data'
    `);
    
    if (!tableExists) {
      console.error('chart_data table does not exist in the database');
      await db.close();
      return;
    }
    
    // Process each missing Key Metric
    for (const metric of missingKeyMetrics) {
      const exists = await checkRowExists(db, metric.id);
      
      if (exists) {
        console.log(`Updating Key Metric ${metric.variableName} (ID: ${metric.id})`);
        await updateRow(db, metric);
      } else {
        console.log(`Inserting Key Metric ${metric.variableName} (ID: ${metric.id})`);
        await insertRow(db, metric);
      }
    }
    
    // Close the database connection
    await db.close();
    
    console.log('Successfully fixed missing Key Metrics');
    console.log('Please restart the application or click the "Load DB" button in the admin panel to see the changes');
  } catch (error) {
    console.error('Error fixing missing Key Metrics:', error);
  }
}

// Run the main function
fixMissingKeyMetrics();
