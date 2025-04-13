/**
 * Fix Accounts Direct SQL Script
 * This script uses direct SQL queries to fix the DataPoint naming convention
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Main function
async function fixAccountsDirectSQL() {
  console.log('Fixing Accounts DataPoint naming convention with direct SQL...');
  
  // Connect to the database
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      return;
    }
    
    console.log('Connected to database');
    
    // Start a transaction
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Error beginning transaction:', err);
        db.close();
        return;
      }
      
      // Update all rows with DataPoint starting with "Month "
      db.run(`
        UPDATE chart_data 
        SET DataPoint = DataPoint || ', ' || variable_name 
        WHERE DataPoint LIKE 'Month %'
      `, function(err) {
        if (err) {
          console.error('Error updating rows:', err);
          db.run('ROLLBACK', () => db.close());
          return;
        }
        
        console.log(`Updated ${this.changes} rows with DataPoint starting with "Month "`);
        
        // Commit the transaction
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err);
            db.run('ROLLBACK', () => db.close());
            return;
          }
          
          console.log('All changes committed successfully');
          
          // Save to init file
          saveToInitFile(db);
        });
      });
    });
  });
}

// Save to init file
function saveToInitFile(db) {
  console.log('Saving to initialization file...');
  
  // Get all chart data
  db.all(`
    SELECT 
      id,
      DataPoint,
      chart_group as "chartGroup",
      chart_name as "chartName",
      variable_name as "variableName",
      server_name as "serverName",
      table_name as "tableName",
      calculation,
      sql_expression as "productionSqlExpression",
      value,
      last_updated as "lastUpdated"
    FROM chart_data
  `, (err, chartData) => {
    if (err) {
      console.error('Error getting chart data:', err);
      db.close();
      return;
    }
    
    console.log(`Retrieved ${chartData.length} rows of chart data`);
    
    // Process chart data to ensure all fields have valid values
    const processedChartData = chartData.map(row => {
      return {
        id: row.id || null,
        DataPoint: row.DataPoint || '',
        chartGroup: row.chartGroup || '',
        chartName: row.chartName || '',
        variableName: row.variableName || '',
        serverName: row.serverName || '',
        tableName: row.tableName || '',
        calculation: row.calculation || 'number',
        productionSqlExpression: row.productionSqlExpression || '',
        value: row.value || 0,
        lastUpdated: row.lastUpdated || new Date().toISOString()
      };
    });
    
    // Generate the file content
    const timestamp = new Date().toISOString();
    const fileContent = `/**
 * SINGLE SOURCE OF TRUTH for dashboard data
 * 
 * This file contains all SQL expressions, chart configurations, and server settings
 * for the Tallman Dashboard. This is the authoritative source that the database
 * will be initialized from.
 * 
 * When changes are made to the database through the admin interface, the "Save DB"
 * button will update this file directly.
 * 
 * When the "Load DB" button is clicked, the database will be populated from this file.
 * 
 * Last updated: ${timestamp}
 */

import type { SpreadsheetRow } from './types';

// Chart data for the dashboard
export const dashboardData: SpreadsheetRow[] = ${JSON.stringify(processedChartData, null, 2)};

// Chart group settings (placeholder - will be preserved by the admin interface)
export const chartGroupSettings = [];

// Server configurations (placeholder - will be preserved by the admin interface)
export const serverConfigs = [];`;
    
    // Write the file
    const filePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');
    fs.writeFile(filePath, fileContent, 'utf8', (err) => {
      if (err) {
        console.error('Error writing initialization file:', err);
        db.close();
        return;
      }
      
      console.log(`Successfully saved database content to: ${filePath}`);
      
      // Run the admin tests
      runAdminTests(db);
    });
  });
}

// Run the admin tests
function runAdminTests(db) {
  console.log('Running admin tests...');
  
  // Close the database connection
  db.close();
  
  // Run the admin tests
  const { exec } = require('child_process');
  exec('node tests/admin/admin.test.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running admin tests: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Admin tests stderr: ${stderr}`);
    }
    
    console.log(`Admin tests output: ${stdout}`);
    
    // Check for failed tests
    if (fs.existsSync(path.join(process.cwd(), 'tests', 'failed-admin-tests.txt'))) {
      const failedTests = fs.readFileSync(path.join(process.cwd(), 'tests', 'failed-admin-tests.txt'), 'utf8');
      
      if (failedTests.includes('# No failed admin tests')) {
        console.log('All admin tests passed!');
      } else {
        console.log('Some admin tests failed. Check the failed-admin-tests.txt file for details.');
        console.log('Failed tests summary:');
        console.log(failedTests);
      }
    } else {
      console.log('Admin tests completed, but no failed tests file was found.');
    }
    
    console.log('Done!');
  });
}

// Run the script
fixAccountsDirectSQL();
