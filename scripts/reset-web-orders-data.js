// Script to reset Web Orders data in the database
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { initialSpreadsheetData } = require('../lib/db/initial-data');

// Open the database
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');
console.log(`Opening database at: ${dbPath}`);

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath);

try {
  // Start a transaction
  db.prepare('BEGIN TRANSACTION').run();

  // First, delete all existing Web Orders rows
  console.log('Deleting existing Web Orders data...');
  const deleteResult = db.prepare("DELETE FROM chart_data WHERE chart_name = 'Web Orders'").run();
  console.log(`Deleted ${deleteResult.changes} rows`);

  // Filter only Web Orders rows from initial data
  const webOrdersData = initialSpreadsheetData.filter(row => 
    row.chartName === 'Web Orders' || row.chartGroup === 'Web Orders'
  );
  
  console.log(`Found ${webOrdersData.length} Web Orders rows in initial data`);
  
  // Count Orders Count and Revenue rows
  const ordersCount = webOrdersData.filter(row => row.variableName === 'Orders Count').length;
  const revenue = webOrdersData.filter(row => row.variableName === 'Revenue').length;
  console.log(`Orders Count rows: ${ordersCount}, Revenue rows: ${revenue}`);

  // Insert the Web Orders rows
  const insertStmt = db.prepare(`
    INSERT INTO chart_data (
      id, chart_name, variable_name, server_name, db_table_name, 
      sql_expression, production_sql, value, transformer, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const row of webOrdersData) {
    console.log(`Inserting row ${row.id}: ${row.variableName} - ${row.timeframe}`);
    insertStmt.run(
      row.id,
      'Web Orders', // Explicitly set chart_name to "Web Orders"
      row.variableName,
      row.serverName,
      row.tableName,
      row.sqlExpression,
      row.productionSqlExpression,
      row.value || '0',
      'number',
      new Date().toISOString()
    );
  }

  // Commit the transaction
  db.prepare('COMMIT').run();
  
  // Verify the data
  const verifyRows = db.prepare("SELECT id, chart_name, variable_name FROM chart_data WHERE chart_name = 'Web Orders'").all();
  const verifyOrdersCount = verifyRows.filter(row => row.variable_name === 'Orders Count').length;
  const verifyRevenue = verifyRows.filter(row => row.variable_name === 'Revenue').length;
  
  console.log(`After reset: Found ${verifyRows.length} Web Orders rows`);
  console.log(`Orders Count rows: ${verifyOrdersCount}, Revenue rows: ${verifyRevenue}`);
  
  if (verifyOrdersCount === 12 && verifyRevenue === 12) {
    console.log('Web Orders data reset successful!');
  } else {
    console.log('Web Orders data reset incomplete. Some rows may be missing.');
  }
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error resetting Web Orders data:', error);
} finally {
  // Close the database
  db.close();
}
