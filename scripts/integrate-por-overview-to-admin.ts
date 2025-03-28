/**
 * Integrate POR Overview Queries to Admin Spreadsheet
 * 
 * This script integrates the tested POR Overview queries directly into the admin spreadsheet
 * to ensure they work properly in production mode.
 */

import fs from 'fs';
import path from 'path';
import { getAdminVariables, updateAdminVariable } from '../lib/db/admin';
import { AdminVariable } from '../lib/types/dashboard';

interface POROverviewRow {
  chartName: string;
  variableName: string;
  server: string;
  tableName: string;
  sqlExpression: string;
  value: number;
}

async function integratePOROverviewQueries() {
  console.log('Integrating POR Overview Queries to Admin Spreadsheet...');
  
  try {
    // Read the tested queries with values
    const queriesPath = path.join(process.cwd(), 'por-overview-rows-with-values.json');
    
    if (!fs.existsSync(queriesPath)) {
      console.error(`Error: File not found: ${queriesPath}`);
      console.error('Please run the test-por-overview-queries.ts script first to generate this file.');
      return;
    }
    
    const porOverviewRows: POROverviewRow[] = JSON.parse(fs.readFileSync(queriesPath, 'utf8'));
    
    // Get the current admin rows
    const currentAdminRows = await getAdminVariables();
    
    // Create a backup of the current admin rows
    const backupPath = path.join(process.cwd(), 'admin-rows-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(currentAdminRows, null, 2));
    console.log(`Created backup of current admin rows at: ${backupPath}`);
    
    // Find existing POR Overview rows or determine where to insert them
    const porOverviewIndex = currentAdminRows.findIndex((row: AdminVariable) => 
      row.chartGroup === 'POR Overview' && row.variableName.startsWith('New Rentals'));
    
    // Update each POR Overview row in the database
    console.log('Updating POR Overview rows in the database...');
    let updatedCount = 0;
    
    for (const row of porOverviewRows) {
      // Ensure the row has the required fields for the admin spreadsheet
      const adminRow: AdminVariable = {
        id: String(Math.floor(Math.random() * 10000)), // Generate a random ID
        name: row.variableName,
        value: String(row.value || 0),
        category: 'POR',
        chartGroup: 'POR Overview',
        chartName: row.chartName,
        variableName: row.variableName,
        server: row.server,
        sqlExpression: row.sqlExpression,
        tableName: row.tableName
      };
      
      // Update the row in the database
      await updateAdminVariable(adminRow);
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} POR Overview rows in the database.`);
    
    // Create a log file with the changes
    let logContent = '# POR Overview Integration Log\n\n';
    logContent += `Integration Date: ${new Date().toLocaleString()}\n\n`;
    logContent += `Added/Updated ${porOverviewRows.length} POR Overview rows.\n\n`;
    
    logContent += '## SQL Queries Added\n\n';
    for (const row of porOverviewRows) {
      logContent += `### ${row.variableName}\n\n`;
      logContent += '```sql\n';
      logContent += row.sqlExpression;
      logContent += '\n```\n\n';
    }
    
    const logPath = path.join(process.cwd(), 'por-overview-integration-log.md');
    fs.writeFileSync(logPath, logContent);
    console.log(`Created integration log at: ${logPath}`);
    
    console.log('\nPOR Overview queries have been successfully integrated into the admin spreadsheet.');
    console.log('The queries will be executed against the POR database when the admin spreadsheet is run in production mode.');
  } catch (error) {
    console.error('Error integrating POR Overview queries:', error instanceof Error ? error.message : String(error));
  }
}

// Run the integration
integratePOROverviewQueries().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
