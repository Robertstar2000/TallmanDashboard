// Script to fix chart data counts to match expected values
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

// Expected counts for each chart group
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

// Sample variable names for each chart group (for creating missing rows)
const sampleVariables = {
  'Key Metrics': ['Total Orders', 'Total Sales Monthly', 'Daily Revenue', 'Average Order Value', 'Customer Count', 'Inventory Value', 'Open Orders'],
  'Accounts': ['Receivable', 'Payable', 'Overdue'],
  'Customer Metrics': ['New Customers', 'Returning Customers'],
  'Inventory': ['Total Items', 'Out of Stock', 'Turnover Rate', 'Average Cost'],
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
      console.log(`- ${row.chart_group}: ${row.count} items`);
      countsByGroup[row.chart_group] = row.count;
    });

    // Check for missing chart groups
    for (const group in expectedCounts) {
      if (!countsByGroup[group]) {
        console.log(`Missing chart group: ${group}`);
      }
    }

    // Get the highest ID in the chart_data table
    const maxIdResult = db.prepare('SELECT MAX(id) as maxId FROM chart_data').get();
    let nextId = (maxIdResult.maxId || 0) + 1;

    // Insert statement for new rows
    const insertStmt = db.prepare(`
      INSERT INTO chart_data (
        id, chart_name, chart_group, variable_name, server_name, 
        db_table_name, sql_expression, production_sql_expression, value, transformer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Fix each chart group
    for (const group in expectedCounts) {
      const expected = expectedCounts[group];
      const current = countsByGroup[group] || 0;
      
      if (current < expected) {
        console.log(`\nFixing ${group}: Adding ${expected - current} rows`);
        
        // Determine how many rows to add
        const rowsToAdd = expected - current;
        
        // Get sample row for this group if it exists
        const sampleRow = db.prepare(`
          SELECT * FROM chart_data 
          WHERE chart_group = ? 
          LIMIT 1
        `).get(group);
        
        // Variables for this group
        const variables = sampleVariables[group] || ['Value'];
        
        // Add missing rows
        if (group === 'Accounts' || group === 'Customer Metrics' || 
            group === 'Inventory' || group === 'POR Overview' || 
            group === 'Open Orders' || group === 'Historical Data' || 
            group === 'Web Orders') {
          
          // These groups have monthly data
          // Calculate how many variables we need based on the expected count and 12 months
          const variablesNeeded = Math.ceil(expected / 12);
          
          // For each variable
          for (let v = 0; v < variablesNeeded; v++) {
            const variableName = variables[v % variables.length];
            
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
        } else if (group === 'Daily Orders') {
          // Daily orders has 7 days
          for (let d = 0; d < 7; d++) {
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
        } else if (group === 'AR Aging') {
          // AR Aging has 5 categories
          for (let a = 0; a < 5; a++) {
            const agingCategory = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', 'Over 90 Days'][a];
            
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
        } else {
          // Other groups (Key Metrics, Site Distribution)
          for (let i = 0; i < rowsToAdd; i++) {
            const variableName = variables[i % variables.length];
            
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
      } else if (current > expected) {
        console.log(`\nWarning: ${group} has ${current} rows, expected ${expected}`);
      } else {
        console.log(`\n${group} has the correct number of rows: ${current}`);
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
      console.log(`- ${row.chart_group}: ${row.count} items`);
    });
    
  } catch (error) {
    // Rollback the transaction on error
    db.prepare('ROLLBACK').run();
    console.error('Error fixing chart data counts:', error);
  }
  
  // Close the database connection
  db.close();
  console.log('\nDatabase connection closed');
  
} catch (error) {
  console.error('Error:', error.message);
}
