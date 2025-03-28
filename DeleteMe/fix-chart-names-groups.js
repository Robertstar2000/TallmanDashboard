// Script to fix chart names and groups in the database
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Define the correct chart names and groups based on the dashboard architecture
const chartMappings = [
  { name: 'Key Metrics', group: 'Key Metrics' },
  { name: 'Site Distribution', group: 'Site Distribution' },
  { name: 'Accounts', group: 'Accounts' },
  { name: 'Customer Metrics', group: 'Customer Metrics' },
  { name: 'Customers', group: 'Customer Metrics' }, // Alternative name
  { name: 'Historical Data', group: 'Historical Data' },
  { name: 'Inventory', group: 'Inventory' },
  { name: 'POR Overview', group: 'POR Overview' },
  { name: 'Por Overview', group: 'POR Overview' }, // Alternative name
  { name: 'Open Orders', group: 'Open Orders' },
  { name: 'Orders', group: 'Open Orders' }, // Alternative name
  { name: 'Daily Orders', group: 'Daily Orders' },
  { name: 'Web Orders', group: 'Web Orders' },
  { name: 'AR Aging', group: 'AR Aging' },
  { name: 'Ar Aging', group: 'AR Aging' }  // Alternative name
];

// Path to the SQLite database
const dbPath = path.join(__dirname, 'dashboard.db');

try {
  // Connect to the database
  const db = new Database(dbPath);
  
  console.log('Connected to database:', dbPath);
  
  try {
    // Get all chart data rows
    const rows = db.prepare('SELECT * FROM chart_data').all();
    console.log(`Found ${rows.length} chart data rows`);
    
    // Update statement for chart data rows
    const updateChartData = db.prepare(`
      UPDATE chart_data 
      SET chart_name = ?, chart_group = ?
      WHERE id = ?
    `);
    
    // Track updated rows
    let updatedRows = 0;
    let missingGroupRows = 0;
    
    // Process each row
    for (const row of rows) {
      // Check if chart_name is valid and matches one of our expected chart names
      const chartMapping = chartMappings.find(mapping => 
        mapping.name.toLowerCase() === (row.chart_name || '').toLowerCase()
      );
      
      if (chartMapping) {
        // Fix chart name case to match expected format
        const correctedChartName = chartMapping.name;
        const correctedChartGroup = chartMapping.group;
        
        // If chart_group is missing or doesn't match the expected group, update it
        if (!row.chart_group || row.chart_group !== correctedChartGroup) {
          updateChartData.run(correctedChartName, correctedChartGroup, row.id);
          updatedRows++;
          
          if (!row.chart_group) {
            missingGroupRows++;
          }
          
          console.log(`Updated row ${row.id}: chart_name="${correctedChartName}", chart_group="${correctedChartGroup}"`);
        }
      } else if (row.chart_name && !row.chart_group) {
        // If chart_name exists but chart_group is missing, set chart_group to chart_name
        updateChartData.run(row.chart_name, row.chart_name, row.id);
        updatedRows++;
        missingGroupRows++;
        
        console.log(`Set missing chart_group for row ${row.id}: chart_name="${row.chart_name}", chart_group="${row.chart_name}"`);
      }
    }
    
    console.log(`Updated ${updatedRows} chart data rows (${missingGroupRows} had missing chart_group values)`);
    console.log('Chart names and groups have been fixed');
    
    // Now check for any remaining rows with missing chart_group
    const missingGroupRowsAfter = db.prepare('SELECT COUNT(*) as count FROM chart_data WHERE chart_group IS NULL OR chart_group = ""').get();
    console.log(`Remaining rows with missing chart_group: ${missingGroupRowsAfter.count}`);
    
    if (missingGroupRowsAfter.count > 0) {
      console.log('Fixing remaining rows with missing chart_group...');
      
      // Update all remaining rows with missing chart_group
      const updateRemainingRows = db.prepare(`
        UPDATE chart_data 
        SET chart_group = chart_name
        WHERE chart_group IS NULL OR chart_group = ""
      `).run();
      
      console.log(`Fixed ${updateRemainingRows.changes} additional rows with missing chart_group`);
    }
    
  } catch (error) {
    console.error('Error fixing chart names and groups:', error);
  } finally {
    // Close the database connection
    db.close();
    console.log('Database connection closed');
  }
} catch (error) {
  console.error('Error connecting to database:', error);
}
