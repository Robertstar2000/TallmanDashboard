/**
 * Check Database Structure
 * 
 * This script checks the structure of the SQLite database
 * to understand the tables and their schemas.
 */

import { executeWrite } from '../lib/db/sqlite';

async function checkDbStructure() {
  try {
    console.log('Checking database structure...');
    
    // Get all tables in the database
    const tablesSql = "SELECT name FROM sqlite_master WHERE type='table'";
    const tables = await executeWrite(tablesSql);
    
    console.log('Tables in database:');
    console.log(JSON.stringify(tables, null, 2));
    
    // If there are tables, check their schemas
    if (Array.isArray(tables) && tables.length > 0) {
      for (const table of tables) {
        const tableName = table.name;
        console.log(`\nSchema for table: ${tableName}`);
        
        const schemaSql = `PRAGMA table_info(${tableName})`;
        const schema = await executeWrite(schemaSql);
        
        console.log(JSON.stringify(schema, null, 2));
      }
    } else {
      console.log('No tables found in the database.');
    }
  } catch (error) {
    console.error('Error checking database structure:', error instanceof Error ? error.message : String(error));
  }
}

// Run the check
checkDbStructure().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
