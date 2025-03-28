// Script to add the "Total {P21+POR}" variable to Historical Data
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Connect to the database
const db = new Database('./data/dashboard.db');

try {
  console.log('Connected to the database at', path.resolve('./data/dashboard.db'));
  
  // Check if we already have the Total variable
  const checkTotal = db.prepare("SELECT COUNT(*) as count FROM chart_data WHERE chart_group = 'Historical Data' AND variable_name = 'Total {P21+POR}'").get();
  
  if (checkTotal.count > 0) {
    console.log(`Found ${checkTotal.count} existing "Total {P21+POR}" variables. No need to add more.`);
  } else {
    console.log('No "Total {P21+POR}" variables found. Adding them now...');
    
    // Start a transaction
    db.prepare('BEGIN').run();
    
    // Get the highest ID in the chart_data table as a number
    const maxIdResult = db.prepare('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM chart_data').get();
    let nextId = parseInt(maxIdResult.maxId) + 1;
    
    console.log(`Next available ID: ${nextId}`);
    
    // Get the P21 variables to match the structure
    const p21Vars = db.prepare("SELECT * FROM chart_data WHERE chart_group = 'Historical Data' AND variable_name = 'P21' ORDER BY id").all();
    
    console.log(`Found ${p21Vars.length} P21 variables to use as templates`);
    
    // Add 12 Total variables (one for each month)
    const addedIds = [];
    for (let i = 0; i < 12; i++) {
      if (i < p21Vars.length) {
        const p21Var = p21Vars[i];
        const newId = (nextId + i).toString();
        
        // Check if ID already exists
        const idExists = db.prepare('SELECT COUNT(*) as count FROM chart_data WHERE id = ?').get(newId);
        if (idExists.count > 0) {
          console.log(`ID ${newId} already exists, skipping`);
          continue;
        }
        
        // Insert the new Total variable
        const insertStmt = db.prepare(`
          INSERT INTO chart_data (
            id, chart_name, chart_group, variable_name, 
            server_name, sql_expression, production_sql_expression, 
            db_table_name, value, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        insertStmt.run(
          newId,
          p21Var.chart_name || 'Historical Data',
          'Historical Data',
          'Total {P21+POR}',
          p21Var.server_name || 'P21',
          `SELECT 0 /* Default SQL for Historical Data - Total {P21+POR} */`,
          `SELECT 0 /* Default SQL for Historical Data - Total {P21+POR} */`,
          p21Var.db_table_name || '',
          '0',
          new Date().toISOString()
        );
        
        console.log(`Added "Total {P21+POR}" variable with ID ${newId}`);
        addedIds.push(newId);
      }
    }
    
    // Commit the transaction
    db.prepare('COMMIT').run();
    console.log(`Successfully added ${addedIds.length} "Total {P21+POR}" variables to the database`);
    
    if (addedIds.length > 0) {
      // Now update the initial-data.ts file
      const initialDataPath = path.resolve('./lib/db/initial-data.ts');
      console.log('Updating initial-data.ts file...');
      
      // Create a backup of the file
      const backupPath = `${initialDataPath}.backup-${Date.now()}.ts`;
      fs.copyFileSync(initialDataPath, backupPath);
      console.log(`Created backup of initial-data.ts at ${backupPath}`);
      
      // Read the file
      let initialData = fs.readFileSync(initialDataPath, 'utf8');
      
      // Find the last Historical Data POR entry
      const lastPORIndex = initialData.lastIndexOf("chartGroup: 'Historical Data',\n    variableName: 'POR'");
      
      if (lastPORIndex !== -1) {
        // Find the end of this object (the next closing brace)
        const endOfObject = initialData.indexOf('  },', lastPORIndex);
        
        if (endOfObject !== -1) {
          // Extract the template for a Historical Data entry
          const templateStart = initialData.lastIndexOf('  {', lastPORIndex);
          const template = initialData.substring(templateStart, endOfObject + 4);
          
          // Create entries for Total {P21+POR}
          let newEntries = '';
          for (let i = 0; i < addedIds.length; i++) {
            let newEntry = template
              .replace(/id: '[^']*'/, `id: '${addedIds[i]}'`)
              .replace(/variableName: 'POR'/, `variableName: 'Total {P21+POR}'`)
              .replace(/sqlExpression: `[^`]*`/, "sqlExpression: `SELECT 0 /* Default SQL for Historical Data - Total {P21+POR} */`")
              .replace(/productionSqlExpression: `[^`]*`/, "productionSqlExpression: `SELECT 0 /* Default SQL for Historical Data - Total {P21+POR} */`");
            
            newEntries += newEntry + '\n';
          }
          
          // Insert the new entries after the last POR entry
          const updatedData = initialData.substring(0, endOfObject + 4) + 
                             '\n' + newEntries + 
                             initialData.substring(endOfObject + 4);
          
          // Write the updated file
          fs.writeFileSync(initialDataPath, updatedData);
          console.log(`Successfully updated ${initialDataPath} with Total {P21+POR} variables`);
        } else {
          console.error('Could not find the end of the last POR object in initial-data.ts');
        }
      } else {
        console.error('Could not find Historical Data POR entries in initial-data.ts');
      }
    }
  }
  
  console.log('\nTotal {P21+POR} variable update completed!');
} catch (err) {
  // Rollback the transaction if it was started
  try {
    db.prepare('ROLLBACK').run();
  } catch (e) {
    // Ignore if no transaction was active
  }
  console.error('Error:', err.message);
} finally {
  // Close the database connection
  db.close();
  console.log('Database connection closed');
}
