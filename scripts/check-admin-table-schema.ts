/**
 * Check Admin Table Schema
 * 
 * This script checks the schema of the admin_variables table
 * to ensure we have the correct column names.
 */

import { executeWrite } from '../lib/db/sqlite';

async function checkAdminTableSchema() {
  try {
    console.log('Checking admin_variables table schema...');
    
    // Get the schema of the admin_variables table
    const schemaSql = "PRAGMA table_info(admin_variables)";
    const result = await executeWrite(schemaSql);
    const schema = Array.isArray(result) ? result : [];
    
    if (schema.length > 0) {
      console.log('admin_variables table schema:');
      schema.forEach(column => {
        console.log(`- ${column.name} (${column.type})`);
      });
    } else {
      console.log('admin_variables table not found or has no columns');
    }
  } catch (error) {
    console.error('Error checking admin_variables table schema:', error instanceof Error ? error.message : String(error));
  }
}

// Run the check
checkAdminTableSchema().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
