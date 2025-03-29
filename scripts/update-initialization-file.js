/**
 * Script to update the single-source-data.ts file with the corrected SQL expressions
 * This ensures that the expressions will load on app startup
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the database file and single-source-data.ts file
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');
const singleSourceDataPath = path.join(__dirname, '..', 'lib', 'db', 'single-source-data.ts');

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the dashboard database.');
});

// Get all rows from the database
db.all("SELECT * FROM chart_data", [], (err, rows) => {
  if (err) {
    console.error('Error querying database:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log(`Retrieved ${rows.length} rows from the database.`);
  
  // Create a backup of the original file
  fs.readFile(singleSourceDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading single-source-data.ts:', err.message);
      db.close();
      process.exit(1);
    }
    
    fs.writeFile(`${singleSourceDataPath}.bak`, data, (err) => {
      if (err) {
        console.error('Error creating backup file:', err.message);
      } else {
        console.log('Created backup of single-source-data.ts');
      }
    });
    
    // Generate new dashboardData array content
    const dashboardDataContent = rows.map(row => {
      return `  {
    "id": "${row.id}",
    "DataPoint": "${row.DataPoint || ''}",
    "chartGroup": "${row.chart_group || ''}",
    "chartName": "${row.chart_name || ''}",
    "variableName": "${row.variable_name || ''}",
    "serverName": "${row.server_name || ''}",
    "tableName": "${row.table_name || ''}",
    "calculation": "${row.calculation || ''}",
    "productionSqlExpression": ${JSON.stringify(row.production_sql_expression || '')},
    "value": "${row.value || '0'}",
    "lastUpdated": "${row.last_updated || new Date().toISOString()}"
  }`;
    }).join(',\n');
    
    // Create the new file content
    const newFileContent = `/**
 * Single source of truth for dashboard data
 * Last updated: ${new Date().toISOString()}
 */

import { SpreadsheetRow, ChartGroupSettings, ServerConfig } from '@/lib/types/dashboard';

export const dashboardData: SpreadsheetRow[] = [
${dashboardDataContent}
];

// Add properly typed empty arrays for chartGroupSettings and serverConfigs to fix TypeScript errors
export const chartGroupSettings: ChartGroupSettings[] = [];
export const serverConfigs: ServerConfig[] = [];
`;
    
    // Write the new file
    fs.writeFile(singleSourceDataPath, newFileContent, (err) => {
      if (err) {
        console.error('Error writing updated single-source-data.ts:', err.message);
      } else {
        console.log('Successfully updated single-source-data.ts with all SQL expressions');
        console.log('The corrected expressions will now load on app startup');
      }
      db.close();
    });
  });
});

console.log('Script execution started. Please wait for completion...');
