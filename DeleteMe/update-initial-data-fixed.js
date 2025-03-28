const fs = require('fs');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

/**
 * Script to update the initial-data.ts file with corrected SQL queries
 * This ensures that the app loads with working queries on startup
 */
async function updateInitialData() {
  console.log('=== Updating initial-data.ts with Corrected SQL Queries ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the SQLite database to get the updated queries
    console.log('\n--- Connecting to SQLite database ---');
    
    // Open the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ Connected successfully to SQLite database');
    
    // Get all rows from the database
    const rows = await db.all(`
      SELECT id, chart_group, variable_name, sql_expression, production_sql_expression, db_table_name
      FROM chart_data
      ORDER BY id
    `);
    
    console.log(`\nFound ${rows.length} rows in the database`);
    
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    console.log(`\nReading file: ${initialDataPath}`);
    
    let initialDataContent = fs.readFileSync(initialDataPath, 'utf8');
    
    // Create a backup of the original file
    const backupPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts.backup');
    console.log(`Creating backup: ${backupPath}`);
    fs.writeFileSync(backupPath, initialDataContent);
    
    // Update each row in the initial-data.ts file
    console.log('\n--- Updating SQL expressions in initial-data.ts ---');
    
    let updateCount = 0;
    
    for (const row of rows) {
      const id = row.id;
      const sqlExpression = row.sql_expression.replace(/'/g, "\\'").replace(/"/g, '\\"');
      const productionSqlExpression = row.production_sql_expression ? 
        row.production_sql_expression.replace(/'/g, "\\'").replace(/"/g, '\\"') : 
        row.sql_expression.replace(/'/g, "\\'").replace(/"/g, '\\"');
      const tableName = row.db_table_name;
      
      // Create regex patterns to find and replace the SQL expressions
      const sqlExpressionPattern = new RegExp(`id: '${id}',[\\s\\S]*?sqlExpression: ["'\`](.*?)["'\`],`, 'g');
      const productionSqlExpressionPattern = new RegExp(`id: '${id}',[\\s\\S]*?productionSqlExpression: ["'\`](.*?)["'\`],`, 'g');
      const tableNamePattern = new RegExp(`id: '${id}',[\\s\\S]*?tableName: ["'\`](.*?)["'\`]`, 'g');
      
      // Replace the SQL expressions and table name
      let updated = false;
      
      // Update sqlExpression
      const updatedContent = initialDataContent.replace(sqlExpressionPattern, (match, p1) => {
        updated = true;
        return match.replace(p1, sqlExpression);
      });
      
      if (updated) {
        initialDataContent = updatedContent;
        updateCount++;
      }
      
      // Update productionSqlExpression
      const updatedContent2 = initialDataContent.replace(productionSqlExpressionPattern, (match, p1) => {
        updated = true;
        return match.replace(p1, productionSqlExpression);
      });
      
      if (updated) {
        initialDataContent = updatedContent2;
      }
      
      // Update tableName
      const updatedContent3 = initialDataContent.replace(tableNamePattern, (match, p1) => {
        updated = true;
        return match.replace(p1, tableName);
      });
      
      if (updated) {
        initialDataContent = updatedContent3;
        console.log(`✅ Updated row ${id}`);
      }
    }
    
    // Update the timestamp in the comment
    const timestampPattern = /Last updated: (.*?)Z/;
    initialDataContent = initialDataContent.replace(timestampPattern, `Last updated: ${new Date().toISOString()}`);
    
    // Write the updated content back to the file
    console.log(`\nWriting updated content to ${initialDataPath}`);
    fs.writeFileSync(initialDataPath, initialDataContent);
    
    console.log(`\nSuccessfully updated ${updateCount} rows in initial-data.ts`);
    
    // Close the SQLite connection
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== initial-data.ts Update Completed ===');
}

// Run the update function
updateInitialData()
  .then(() => {
    console.log('Update completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
