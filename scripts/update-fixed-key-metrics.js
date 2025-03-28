// Script to update Key Metrics SQL expressions in the database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fixedKeyMetrics = require('./fixed-key-metrics');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Main function to update Key Metrics SQL expressions
async function updateKeyMetrics() {
  console.log('Updating Key Metrics SQL expressions in the database...');
  
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each Key Metric
    for (const metric of fixedKeyMetrics) {
      await db.run(`
        UPDATE chart_data 
        SET production_sql_expression = ? 
        WHERE id = ?
      `, [metric.sql, metric.id]);
      
      console.log(`Updated SQL expression for ${metric.name} (ID: ${metric.id})`);
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Close the database connection
    await db.close();
    
    console.log('Successfully updated Key Metrics SQL expressions');
    console.log('Please restart the application or click the "Load DB" button in the admin panel to see the changes');
  } catch (error) {
    console.error('Error updating Key Metrics SQL expressions:', error);
  }
}

// Run the main function
updateKeyMetrics();
