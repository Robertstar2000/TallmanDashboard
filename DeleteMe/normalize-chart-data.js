// Script to normalize chart data to match exactly the expected counts
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the SQLite database in the data directory
const dbPath = path.resolve(__dirname, 'data', 'dashboard.db');
console.log('Database path:', dbPath);

// Create a backup of the database
const backupPath = `${dbPath}.backup-${Date.now()}`;
fs.copyFileSync(dbPath, backupPath);
console.log(`Created database backup at ${backupPath}`);

// Expected counts for each chart group according to the architecture documentation
const expectedCounts = {
  'Key Metrics': 7,
  'Accounts': 36,
  'Customer Metrics': 24,
  'Inventory': 24,
  'Site Distribution': 3,
  'AR Aging': 5,
  'Daily Orders': 7,
  'Web Orders': 12,
  'POR Overview': 36,
  'Open Orders': 12,
  'Historical Data': 24
};

// Sample variable names for each chart group
const sampleVariables = {
  'Key Metrics': ['Total Orders', 'Total Sales Monthly', 'Daily Revenue', 'Average Order Value', 'Customer Count', 'Inventory Value', 'Open Orders'],
  'Accounts': ['Receivable', 'Payable', 'Overdue'],
  'Customer Metrics': ['New Customers', 'Returning Customers'],
  'Inventory': ['Total Items', 'Out of Stock'],
  'Site Distribution': ['East', 'West', 'Central'],
  'AR Aging': ['Current', '1-30 Days', '31-60 Days', '61-90 Days', 'Over 90 Days'],
  'Daily Orders': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  'Web Orders': ['Revenue', 'Count'],
  'POR Overview': ['Total Orders', 'Revenue', 'Average Value'],
  'Open Orders': ['Count'],
  'Historical Data': ['Sales', 'Orders']
};

// Months for monthly data
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

try {
  // Connect to the database
  console.log('Connecting to database...');
  const db = new Database(dbPath);
  console.log('Connected to database');

  // Begin transaction
  db.prepare('BEGIN TRANSACTION').run();

  try {
    // Get current counts by chart group
    const currentCounts = db.prepare(`
      SELECT chart_group, COUNT(*) as count
      FROM chart_data
      GROUP BY chart_group
    `).all();

    console.log('Current counts by chart group:');
    const countsByGroup = {};
    currentCounts.forEach(row => {
      if (row.chart_group) {
        console.log(`- ${row.chart_group}: ${row.count} items`);
        countsByGroup[row.chart_group] = row.count;
      }
    });

    // First, handle groups with too many rows
    for (const group in countsByGroup) {
      const expected = expectedCounts[group] || 0;
      const current = countsByGroup[group];
      
      if (current > expected && expected > 0) {
        console.log(`\n${group} has too many rows (${current}, expected ${expected})`);
        
        // Get all rows for this group
        const rows = db.prepare(`
          SELECT id, chart_name, chart_group, variable_name
          FROM chart_data
          WHERE chart_group = ?
          ORDER BY id
        `).all(group);
        
        // Keep track of rows to delete
        const rowsToDelete = [];
        
        // Determine which rows to keep based on the group
        if (group === 'Key Metrics') {
          // Keep the first 7 rows
          rowsToDelete.push(...rows.slice(7).map(r => r.id));
        } else if (group === 'Site Distribution') {
          // Keep the first 3 rows
          rowsToDelete.push(...rows.slice(3).map(r => r.id));
        } else if (group === 'AR Aging') {
          // Keep the first 5 rows
          rowsToDelete.push(...rows.slice(5).map(r => r.id));
        } else if (group === 'Daily Orders') {
          // Keep the first 7 rows (one for each day)
          rowsToDelete.push(...rows.slice(7).map(r => r.id));
        } else if (group === 'Accounts' || group === 'Customer Metrics' || 
                  group === 'Inventory' || group === 'POR Overview' || 
                  group === 'Open Orders' || group === 'Historical Data' || 
                  group === 'Web Orders') {
          
          // These groups have monthly data
          // For each variable, keep 12 rows (one for each month)
          const variableCounts = {};
          const keepIds = [];
          
          // First pass: count occurrences of each variable
          rows.forEach(row => {
            const variable = row.variable_name;
            if (!variableCounts[variable]) {
              variableCounts[variable] = 0;
            }
            variableCounts[variable]++;
          });
          
          // Calculate how many variables we need to keep
          const variablesToKeep = Math.ceil(expected / 12);
          
          // Sort variables by count (descending)
          const sortedVariables = Object.keys(variableCounts).sort((a, b) => 
            variableCounts[b] - variableCounts[a]
          );
          
          // Keep only the top variables
          const variablesToKeepList = sortedVariables.slice(0, variablesToKeep);
          
          console.log(`  Keeping variables: ${variablesToKeepList.join(', ')}`);
          
          // For each variable to keep, find 12 rows (one for each month)
          variablesToKeepList.forEach(variable => {
            const variableRows = rows.filter(r => r.variable_name === variable);
            
            // If we have more than 12 rows for this variable, keep only 12
            if (variableRows.length > 12) {
              keepIds.push(...variableRows.slice(0, 12).map(r => r.id));
            } else {
              keepIds.push(...variableRows.map(r => r.id));
            }
          });
          
          // All rows not in keepIds should be deleted
          rowsToDelete.push(...rows.filter(r => !keepIds.includes(r.id)).map(r => r.id));
        }
        
        // Delete excess rows
        if (rowsToDelete.length > 0) {
          console.log(`  Deleting ${rowsToDelete.length} excess rows`);
          
          const deleteStmt = db.prepare(`
            DELETE FROM chart_data
            WHERE id = ?
          `);
          
          for (const id of rowsToDelete) {
            deleteStmt.run(id);
          }
        }
      }
    }
    
    // Now check for groups with too few rows
    for (const group in expectedCounts) {
      const expected = expectedCounts[group];
      const current = countsByGroup[group] || 0;
      
      if (current < expected) {
        console.log(`\n${group} has too few rows (${current}, expected ${expected})`);
        
        // Get the highest ID in the chart_data table
        const maxIdResult = db.prepare('SELECT MAX(id) as maxId FROM chart_data').get();
        let nextId = (maxIdResult.maxId || 0) + 1;
        
        // Get a sample row for this group if it exists
        const sampleRow = db.prepare(`
          SELECT * FROM chart_data 
          WHERE chart_group = ? 
          LIMIT 1
        `).get(group);
        
        // Insert statement for new rows
        const insertStmt = db.prepare(`
          INSERT INTO chart_data (
            id, chart_name, chart_group, variable_name, server_name, 
            db_table_name, sql_expression, production_sql_expression, value, transformer
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        // Variables for this group
        const variables = sampleVariables[group] || ['Value'];
        
        // Add missing rows
        const rowsToAdd = expected - current;
        console.log(`  Adding ${rowsToAdd} rows`);
        
        if (group === 'Key Metrics') {
          // Add individual metrics
          for (let i = 0; i < rowsToAdd; i++) {
            const variableName = variables[i % variables.length];
            
            // Check if this variable already exists
            const existingRow = db.prepare(`
              SELECT id FROM chart_data 
              WHERE chart_group = ? AND variable_name = ?
            `).get(group, variableName);
            
            if (!existingRow) {
              // Add new row
              const defaultValue = Math.floor(Math.random() * 200 + 100).toString();
              
              insertStmt.run(
                nextId++,
                group, // chart_name
                group, // chart_group
                variableName,
                sampleRow ? sampleRow.server_name : 'P21',
                sampleRow ? sampleRow.db_table_name : '',
                sampleRow ? sampleRow.sql_expression : 'SELECT 100',
                sampleRow ? sampleRow.production_sql_expression : 'SELECT 100',
                defaultValue,
                sampleRow ? sampleRow.transformer : ''
              );
              
              console.log(`  Added row: ${group} - ${variableName}`);
            }
          }
        } else if (group === 'Site Distribution') {
          // Add site distribution rows
          for (let i = 0; i < rowsToAdd; i++) {
            const variableName = variables[i % variables.length];
            
            // Check if this variable already exists
            const existingRow = db.prepare(`
              SELECT id FROM chart_data 
              WHERE chart_group = ? AND variable_name = ?
            `).get(group, variableName);
            
            if (!existingRow) {
              // Add new row
              const defaultValue = Math.floor(Math.random() * 200 + 100).toString();
              
              insertStmt.run(
                nextId++,
                group, // chart_name
                group, // chart_group
                variableName,
                sampleRow ? sampleRow.server_name : 'P21',
                sampleRow ? sampleRow.db_table_name : '',
                sampleRow ? sampleRow.sql_expression : 'SELECT 100',
                sampleRow ? sampleRow.production_sql_expression : 'SELECT 100',
                defaultValue,
                sampleRow ? sampleRow.transformer : ''
              );
              
              console.log(`  Added row: ${group} - ${variableName}`);
            }
          }
        } else if (group === 'AR Aging') {
          // AR Aging has 5 categories
          for (let a = 0; a < Math.min(rowsToAdd, 5); a++) {
            const agingCategory = variables[a % variables.length];
            
            // Check if this category already exists
            const existingRow = db.prepare(`
              SELECT id FROM chart_data 
              WHERE chart_group = ? AND variable_name = ?
            `).get(group, agingCategory);
            
            if (!existingRow) {
              // Add new row
              const defaultValue = Math.floor(Math.random() * 200 + 100).toString();
              
              insertStmt.run(
                nextId++,
                group, // chart_name
                group, // chart_group
                agingCategory,
                sampleRow ? sampleRow.server_name : 'P21',
                sampleRow ? sampleRow.db_table_name : '',
                sampleRow ? sampleRow.sql_expression : 'SELECT 100',
                sampleRow ? sampleRow.production_sql_expression : 'SELECT 100',
                defaultValue,
                sampleRow ? sampleRow.transformer : ''
              );
              
              console.log(`  Added row: ${group} - ${agingCategory}`);
            }
          }
        } else if (group === 'Daily Orders') {
          // Daily orders has 7 days
          for (let d = 0; d < Math.min(rowsToAdd, 7); d++) {
            const day = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][d];
            
            // Check if this day already exists
            const existingRow = db.prepare(`
              SELECT id FROM chart_data 
              WHERE chart_group = ? AND variable_name = ?
            `).get(group, day);
            
            if (!existingRow) {
              // Add new row
              const defaultValue = Math.floor(Math.random() * 200 + 100).toString();
              
              insertStmt.run(
                nextId++,
                group, // chart_name
                group, // chart_group
                day,
                sampleRow ? sampleRow.server_name : 'P21',
                sampleRow ? sampleRow.db_table_name : '',
                sampleRow ? sampleRow.sql_expression : 'SELECT 100',
                sampleRow ? sampleRow.production_sql_expression : 'SELECT 100',
                defaultValue,
                sampleRow ? sampleRow.transformer : ''
              );
              
              console.log(`  Added row: ${group} - ${day}`);
            }
          }
        } else {
          // These groups have monthly data (Accounts, Customer Metrics, Inventory, etc.)
          // Calculate how many variables we need
          const variablesNeeded = Math.ceil(expected / 12);
          const rowsPerVariable = Math.floor(rowsToAdd / variablesNeeded);
          
          console.log(`  Need ${variablesNeeded} variables with ${rowsPerVariable} rows each`);
          
          // Get existing variables for this group
          const existingVariables = db.prepare(`
            SELECT DISTINCT variable_name
            FROM chart_data
            WHERE chart_group = ?
          `).all(group).map(r => r.variable_name);
          
          console.log(`  Existing variables: ${existingVariables.join(', ') || 'none'}`);
          
          // For each variable
          for (let v = 0; v < variablesNeeded; v++) {
            let variableName = variables[v % variables.length];
            
            // If this variable already exists, find one that doesn't
            if (existingVariables.includes(variableName)) {
              for (const altVar of variables) {
                if (!existingVariables.includes(altVar)) {
                  variableName = altVar;
                  break;
                }
              }
              
              // If all variables exist, append a number
              if (existingVariables.includes(variableName)) {
                variableName = `${variableName} ${v + 1}`;
              }
            }
            
            // For each month
            for (let m = 0; m < 12; m++) {
              const month = months[m];
              
              // Check if this combination already exists
              const existingRow = db.prepare(`
                SELECT id FROM chart_data 
                WHERE chart_group = ? AND variable_name = ? AND value LIKE ?
              `).get(group, variableName, `%${month}%`);
              
              if (!existingRow) {
                // Add new row
                const defaultValue = Math.floor(Math.random() * 200 + 100).toString();
                
                insertStmt.run(
                  nextId++,
                  group, // chart_name
                  group, // chart_group
                  variableName,
                  sampleRow ? sampleRow.server_name : 'P21',
                  sampleRow ? sampleRow.db_table_name : '',
                  sampleRow ? sampleRow.sql_expression : 'SELECT 100',
                  sampleRow ? sampleRow.production_sql_expression : 'SELECT 100',
                  defaultValue,
                  sampleRow ? sampleRow.transformer : ''
                );
                
                console.log(`  Added row: ${group} - ${variableName} - ${month}`);
              }
            }
          }
        }
      }
    }

    // Commit the transaction
    db.prepare('COMMIT').run();
    
    // Get updated counts
    const updatedCounts = db.prepare(`
      SELECT chart_group, COUNT(*) as count
      FROM chart_data
      GROUP BY chart_group
    `).all();

    console.log('\nUpdated counts by chart group:');
    updatedCounts.forEach(row => {
      if (row.chart_group) {
        console.log(`- ${row.chart_group}: ${row.count} items (expected: ${expectedCounts[row.chart_group] || 'unknown'})`);
      }
    });
    
  } catch (error) {
    // Rollback the transaction on error
    db.prepare('ROLLBACK').run();
    console.error('Error normalizing chart data:', error);
  }
  
  // Close the database connection
  db.close();
  console.log('\nDatabase connection closed');
  
} catch (error) {
  console.error('Error:', error.message);
}
