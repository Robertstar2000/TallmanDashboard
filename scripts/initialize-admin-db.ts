/**
 * Initialize Admin Database
 * 
 * This script initializes the admin database with the necessary tables
 * for storing admin variables, including the POR Overview queries.
 */

import { executeWrite } from '../lib/db/sqlite';

async function initializeAdminDb() {
  console.log('Initializing Admin Database...');
  
  try {
    // Create the admin_variables table if it doesn't exist
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS admin_variables (
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
        table_name TEXT
      )
    `;
    
    await executeWrite(createTableSql);
    console.log('Created admin_variables table');
    
    // Check if the table was created successfully
    const checkTableSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='admin_variables'";
    const tables = await executeWrite(checkTableSql);
    
    if (Array.isArray(tables) && tables.length > 0) {
      console.log('Verified admin_variables table exists');
      
      // Check if there are any rows in the table
      const countSql = "SELECT COUNT(*) as count FROM admin_variables";
      const countResult = await executeWrite(countSql);
      
      if (Array.isArray(countResult) && countResult.length > 0) {
        const count = countResult[0].count;
        console.log(`Found ${count} rows in admin_variables table`);
      }
    } else {
      console.error('Failed to create admin_variables table');
    }
    
    console.log('Admin database initialization complete');
  } catch (error) {
    console.error('Error initializing admin database:', error instanceof Error ? error.message : String(error));
  }
}

// Run the initialization
initializeAdminDb().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
