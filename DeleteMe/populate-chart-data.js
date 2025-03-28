// Script to populate chart_data table with the correct number of rows for each chart
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Connect to the database
const dbPath = path.join(process.cwd(), 'tallman.db');
console.log(`Connecting to database at: ${dbPath}`);
const db = new Database(dbPath);

// Define the chart groups and their required row counts based on variables and months
const chartGroups = [
  { name: 'Key Metrics', variables: ['Total Orders', 'Gross Revenue', 'Net Profit', 'Average Order Value', 'Return Rate', 'Inventory Value', 'Backorder Value'], months: 1 },
  { name: 'Site Distribution', variables: ['Addison Inventory', 'Chicago Inventory', 'Dallas Inventory'], months: 1 },
  { name: 'Accounts', variables: ['Payable', 'Receivable', 'Overdue'], months: 12 },
  { name: 'Customer Metrics', variables: ['New Customers', 'Repeat Customers'], months: 12 },
  { name: 'Historical Data', variables: ['Orders', 'Revenue'], months: 12 },
  { name: 'Inventory', variables: ['On Hand', 'On Order'], months: 12 },
  { name: 'POR Overview', variables: ['Orders', 'Revenue', 'Profit'], months: 12 },
  { name: 'Open Orders', variables: ['Orders'], months: 12 },
  { name: 'Daily Orders', variables: ['Orders'], months: 7 }, // 7 days
  { name: 'AR Aging', variables: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'], months: 1 }
];

// Begin transaction
db.exec('BEGIN TRANSACTION;');

try {
  // Clear existing data
  console.log('Clearing existing data from chart_data table...');
  db.exec('DELETE FROM chart_data');
  
  // Generate rows for each chart group
  let rowId = 1;
  
  for (const group of chartGroups) {
    console.log(`Generating rows for ${group.name}...`);
    
    for (const variable of group.variables) {
      for (let month = 1; month <= group.months; month++) {
        // Generate month label (Jan, Feb, etc. or Day 1, Day 2, etc. for Daily Orders)
        let timeframe = '';
        if (group.months > 1) {
          if (group.name === 'Daily Orders') {
            timeframe = `Day ${month}`;
          } else {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            timeframe = monthNames[month - 1];
          }
        }
        
        // Create a row
        const row = {
          id: rowId.toString(),
          chart_name: group.name,
          chart_group: group.name,
          variable_name: variable,
          server_name: group.name.includes('POR') ? 'POR' : 'P21',
          table_name: '',
          sql_expression: `SELECT COUNT(*) FROM test_data WHERE category = '${group.name}' AND variable = '${variable}'${timeframe ? ` AND month = '${timeframe}'` : ''}`,
          production_sql_expression: `SELECT COUNT(*) FROM test_data WHERE category = '${group.name}' AND variable = '${variable}'${timeframe ? ` AND month = '${timeframe}'` : ''}`,
          value: '0',
          timeframe: timeframe,
          last_updated: new Date().toISOString()
        };
        
        // Insert the row
        const stmt = db.prepare(`
          INSERT INTO chart_data (
            id, chart_name, chart_group, variable_name, server_name, 
            table_name, sql_expression, production_sql_expression, value, 
            last_updated
          ) VALUES (
            ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, 
            ?
          )
        `);
        
        stmt.run(
          row.id,
          row.chart_name,
          row.chart_group,
          row.variable_name,
          row.server_name,
          row.table_name,
          row.sql_expression,
          row.production_sql_expression,
          row.value,
          row.last_updated
        );
        
        rowId++;
      }
    }
  }
  
  // Commit transaction
  db.exec('COMMIT;');
  console.log('Successfully populated chart_data table');
  
  // Count rows per chart group
  const chartGroupCounts = db.prepare(`
    SELECT chart_group, COUNT(*) as count 
    FROM chart_data 
    GROUP BY chart_group
  `).all();
  
  console.log('\nChart Groups and Row Counts:');
  chartGroupCounts.forEach(group => {
    console.log(`- ${group.chart_group}: ${group.count} rows`);
  });
  
  // Get total count
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM chart_data').get();
  console.log(`\nTotal rows in chart_data: ${totalCount.count}`);
  
} catch (error) {
  // Rollback transaction on error
  db.exec('ROLLBACK;');
  console.error('Error populating chart_data:', error);
}

// Close the database connection
db.close();
