// Script to check all Key Metrics in the SQLite database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Expected Key Metrics IDs
const expectedKeyMetricsIds = ['117', '118', '119', '120', '121', '122', '123'];

// Main function to check Key Metrics in the database
async function checkKeyMetricsInDb() {
  console.log('Checking Key Metrics in the SQLite database...');
  
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Get all Key Metrics from the chart_data table
    const keyMetrics = await db.all(`
      SELECT id, variable_name, chart_group, production_sql_expression
      FROM chart_data
      WHERE chart_group = 'Key Metrics'
      ORDER BY id
    `);
    
    console.log(`Found ${keyMetrics.length} Key Metrics in the database`);
    
    // Check if all expected Key Metrics are in the database
    const foundIds = keyMetrics.map(metric => metric.id);
    const missingIds = expectedKeyMetricsIds.filter(id => !foundIds.includes(id));
    
    if (missingIds.length > 0) {
      console.log(`\nMissing Key Metrics IDs: ${missingIds.join(', ')}`);
    } else {
      console.log('\nAll expected Key Metrics IDs are in the database');
    }
    
    // Print all Key Metrics in the database
    console.log('\nKey Metrics in the database:');
    keyMetrics.forEach(metric => {
      console.log(`- ID: ${metric.id}, Variable: ${metric.variable_name}`);
      console.log(`  SQL: ${metric.production_sql_expression.substring(0, 100)}...`);
    });
    
    // Close the database connection
    await db.close();
    
  } catch (error) {
    console.error('Error checking Key Metrics in the database:', error);
  }
}

// Run the main function
checkKeyMetricsInDb();
