/**
 * Check Admin Schema
 * 
 * This script checks the schema of the admin_variables table
 * to understand the column structure for proper updates.
 */

import { executeWrite } from '../lib/db/sqlite';

async function checkAdminSchema() {
  try {
    console.log('Checking admin_variables table schema...');
    
    const schema = await executeWrite('PRAGMA table_info(admin_variables)');
    console.log('Admin Variables Table Schema:');
    console.log(JSON.stringify(schema, null, 2));
    
    // Also check for existing POR Overview rows
    const rows = await executeWrite('SELECT * FROM admin_variables WHERE chart_group = "POR Overview" LIMIT 1');
    if (Array.isArray(rows) && rows.length > 0) {
      console.log('\nSample POR Overview Row:');
      console.log(JSON.stringify(rows[0], null, 2));
    } else {
      console.log('\nNo POR Overview rows found.');
    }
  } catch (error) {
    console.error('Error checking admin schema:', error instanceof Error ? error.message : String(error));
  }
}

// Run the check
checkAdminSchema().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
