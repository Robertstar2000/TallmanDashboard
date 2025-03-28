// Script to fix chart structure according to requirements
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Connect to the database
const db = new Database('./data/dashboard.db');

try {
  console.log('Connected to the database at', path.resolve('./data/dashboard.db'));
  console.log('\n=== FIXING CHART STRUCTURE ===\n');
  
  // Start a transaction
  db.prepare('BEGIN').run();
  
  // 1. Fix AR Aging - Should have 5 buckets with variable name "Amount Due"
  console.log('Fixing AR Aging...');
  
  // Get current AR Aging rows
  const arAgingRows = db.prepare("SELECT * FROM chart_data WHERE chart_group = 'AR Aging'").all();
  console.log(`Found ${arAgingRows.length} AR Aging rows`);
  
  // Keep only the first 5 rows and update them
  const buckets = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
  
  // Delete all AR Aging rows
  const deleteArAging = db.prepare("DELETE FROM chart_data WHERE chart_group = 'AR Aging'").run();
  console.log(`Deleted ${deleteArAging.changes} AR Aging rows`);
  
  // Create 5 new rows with the correct structure
  for (let i = 0; i < 5; i++) {
    if (i < arAgingRows.length) {
      const row = arAgingRows[i];
      
      // Insert with updated values
      const insertStmt = db.prepare(`
        INSERT INTO chart_data (
          id, chart_name, chart_group, variable_name, 
          server_name, sql_expression, production_sql_expression, 
          db_table_name, value, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertStmt.run(
        row.id,
        buckets[i],
        'AR Aging',
        'Amount Due',
        row.server_name || 'P21',
        row.sql_expression || '',
        row.production_sql_expression || '',
        row.db_table_name || '',
        row.value || '0',
        new Date().toISOString()
      );
      
      console.log(`Added AR Aging row for ${buckets[i]}`);
    }
  }
  
  // 2. Fix Accounts - Should have 36 rows (3 variables x 12 months)
  console.log('\nFixing Accounts...');
  
  // Get current Accounts rows
  const accountsRows = db.prepare("SELECT * FROM chart_data WHERE chart_group = 'Accounts'").all();
  console.log(`Found ${accountsRows.length} Accounts rows`);
  
  // Keep only the first 36 rows
  if (accountsRows.length > 36) {
    // Get the IDs of rows to delete (after the first 36)
    const rowsToDelete = accountsRows.slice(36).map(row => row.id);
    
    // Delete excess rows
    for (const id of rowsToDelete) {
      db.prepare("DELETE FROM chart_data WHERE id = ?").run(id);
    }
    
    console.log(`Deleted ${rowsToDelete.length} excess Accounts rows`);
  }
  
  // 3. Fix Customer Metrics - Should have 24 rows (2 variables x 12 months)
  console.log('\nFixing Customer Metrics...');
  
  // Get current Customer Metrics rows
  const customerRows = db.prepare("SELECT * FROM chart_data WHERE chart_group = 'Customer Metrics'").all();
  console.log(`Found ${customerRows.length} Customer Metrics rows`);
  
  // Delete rows with incorrect variable names
  const deleteIncorrectCustomerVars = db.prepare("DELETE FROM chart_data WHERE chart_group = 'Customer Metrics' AND variable_name NOT IN ('New', 'Prospects')").run();
  console.log(`Deleted ${deleteIncorrectCustomerVars.changes} Customer Metrics rows with incorrect variable names`);
  
  // 4. Fix Daily Orders - Should have 7 rows (1 variable x 7 days)
  console.log('\nFixing Daily Orders...');
  
  // Get current Daily Orders rows
  const dailyOrdersRows = db.prepare("SELECT * FROM chart_data WHERE chart_group = 'Daily Orders'").all();
  console.log(`Found ${dailyOrdersRows.length} Daily Orders rows`);
  
  // Update the variable_name field to "Orders" for all Daily Orders rows
  const updateDailyOrders = db.prepare("UPDATE chart_data SET variable_name = 'Orders' WHERE chart_group = 'Daily Orders'").run();
  console.log(`Updated ${updateDailyOrders.changes} Daily Orders rows to use variable_name = 'Orders'`);
  
  // 5. Fix Inventory - Should have 8 rows (2 variables x 4 departments)
  console.log('\nFixing Inventory...');
  
  // Get current Inventory rows
  const inventoryRows = db.prepare("SELECT * FROM chart_data WHERE chart_group = 'Inventory'").all();
  console.log(`Found ${inventoryRows.length} Inventory rows`);
  
  // Delete rows with incorrect variable names
  const deleteIncorrectInventoryVars = db.prepare("DELETE FROM chart_data WHERE chart_group = 'Inventory' AND variable_name NOT IN ('In Stock', 'On Order')").run();
  console.log(`Deleted ${deleteIncorrectInventoryVars.changes} Inventory rows with incorrect variable names`);
  
  // 6. Fix Key Metrics - Should have 7 rows
  console.log('\nFixing Key Metrics...');
  
  // Get current Key Metrics rows
  const keyMetricsRows = db.prepare("SELECT * FROM chart_data WHERE chart_group = 'Key Metrics'").all();
  console.log(`Found ${keyMetricsRows.length} Key Metrics rows`);
  
  // Keep only the first 7 rows
  if (keyMetricsRows.length > 7) {
    // Get the IDs of rows to delete (after the first 7)
    const rowsToDelete = keyMetricsRows.slice(7).map(row => row.id);
    
    // Delete excess rows
    for (const id of rowsToDelete) {
      db.prepare("DELETE FROM chart_data WHERE id = ?").run(id);
    }
    
    console.log(`Deleted ${rowsToDelete.length} excess Key Metrics rows`);
  }
  
  // 7. Fix Site Distribution - Should have 3 rows (1 value for 3 locations)
  console.log('\nFixing Site Distribution...');
  
  // Get current Site Distribution rows
  const siteDistRows = db.prepare("SELECT * FROM chart_data WHERE chart_group = 'Site Distribution'").all();
  console.log(`Found ${siteDistRows.length} Site Distribution rows`);
  
  // Delete rows with incorrect variable names
  const deleteIncorrectSiteVars = db.prepare("DELETE FROM chart_data WHERE chart_group = 'Site Distribution' AND variable_name NOT IN ('Columbus', 'Addison', 'Lake City')").run();
  console.log(`Deleted ${deleteIncorrectSiteVars.changes} Site Distribution rows with incorrect variable names`);
  
  // 8. Fix Web Orders - Should have 12 rows (1 variable x 12 months)
  console.log('\nFixing Web Orders...');
  
  // Get current Web Orders rows
  const webOrdersRows = db.prepare("SELECT * FROM chart_data WHERE chart_group = 'Web Orders'").all();
  console.log(`Found ${webOrdersRows.length} Web Orders rows`);
  
  // Delete rows with incorrect variable names
  const deleteIncorrectWebVars = db.prepare("DELETE FROM chart_data WHERE chart_group = 'Web Orders' AND variable_name != 'Orders'").run();
  console.log(`Deleted ${deleteIncorrectWebVars.changes} Web Orders rows with incorrect variable names`);
  
  // Keep only the first 12 remaining rows
  const remainingWebOrders = db.prepare("SELECT * FROM chart_data WHERE chart_group = 'Web Orders'").all();
  if (remainingWebOrders.length > 12) {
    // Get the IDs of rows to delete (after the first 12)
    const rowsToDelete = remainingWebOrders.slice(12).map(row => row.id);
    
    // Delete excess rows
    for (const id of rowsToDelete) {
      db.prepare("DELETE FROM chart_data WHERE id = ?").run(id);
    }
    
    console.log(`Deleted ${rowsToDelete.length} excess Web Orders rows`);
  }
  
  // Commit the transaction
  db.prepare('COMMIT').run();
  console.log('\nAll fixes have been applied to the database');
  
  // Now update the initial-data.ts file to match the database changes
  console.log('\nUpdating initial-data.ts file...');
  
  // We'll need to do this in a separate script to handle the complexity
  console.log('Please run the update-initial-data.js script next to update the initial-data.ts file');
  
  console.log('\nChart structure fixes completed!');
} catch (err) {
  // Rollback the transaction
  db.prepare('ROLLBACK').run();
  console.error('Error:', err.message);
} finally {
  // Close the database connection
  db.close();
  console.log('Database connection closed');
}
