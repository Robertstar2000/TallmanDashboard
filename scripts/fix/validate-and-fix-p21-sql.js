/**
 * VALIDATE AND FIX P21 SQL EXPRESSIONS
 * 
 * This script:
 * 1. Parses the P21Tables.md file to extract valid table and column names
 * 2. Retrieves all P21 SQL expressions from the database
 * 3. Validates each SQL expression against the valid tables and columns
 * 4. Fixes any expressions using invalid tables or columns
 * 5. Updates the database and single-source-data.ts file with the fixed expressions
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the dashboard database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
// Path to the P21Tables.md file
const p21TablesPath = path.join(process.cwd(), 'P21Tables.md');
// Path to the single-source-data.ts file
const singleSourcePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');
// Path to create a cache-busting file
const cacheBustPath = path.join(process.cwd(), 'data', 'cache-bust.txt');

// Function to parse the P21Tables.md file and extract valid tables and columns
function parseP21Tables() {
  console.log('Parsing P21Tables.md file...');
  
  const content = fs.readFileSync(p21TablesPath, 'utf8');
  
  // Extract all table names
  const tableRegex = /\|\s*(\w+)\s*\|\s*(\w+)\s*\|/g;
  const tables = new Set();
  let match;
  
  while ((match = tableRegex.exec(content)) !== null) {
    const schema = match[1].trim();
    const tableName = match[2].trim();
    
    // Skip header rows and non-schema/table rows
    if (schema !== 'Schema' && schema !== '--------' && tableName !== 'Table' && tableName !== '------------') {
      tables.add(`${schema}.${tableName}`);
    }
  }
  
  console.log(`Found ${tables.size} tables in P21Tables.md`);
  
  // Extract all column names
  const columnRegex = /\|\s*(\w+)\s*\|\s*(\w+)\s*\|/g;
  const columns = new Set();
  
  // Find all column sections
  const columnSections = content.match(/\*\*Columns:\*\*\n\n\|.*?\n\|.*?\n([\s\S]*?)(?:\n\n|$)/g) || [];
  
  for (const section of columnSections) {
    let columnMatch;
    const columnRegex = /\|\s*([^|]+?)\s*\|\s*[^|]+?\s*\|/g;
    
    while ((columnMatch = columnRegex.exec(section)) !== null) {
      const columnName = columnMatch[1].trim();
      
      // Skip header and separator rows
      if (columnName !== 'Column Name' && columnName !== '-------------') {
        columns.add(columnName);
      }
    }
  }
  
  console.log(`Found ${columns.size} columns in P21Tables.md`);
  
  return { tables, columns };
}

// Function to validate and fix a SQL expression
function validateAndFixSqlExpression(sqlExpression, validTables, validColumns) {
  if (!sqlExpression) return { fixed: false, fixedSql: sqlExpression };
  
  let fixed = false;
  let fixedSql = sqlExpression;
  
  // Extract table names from the SQL expression
  const tableRegex = /FROM\s+([^\s,()]+)|JOIN\s+([^\s,()]+)/gi;
  let tableMatch;
  const invalidTables = new Set();
  
  while ((tableMatch = tableRegex.exec(sqlExpression)) !== null) {
    const tableName = (tableMatch[1] || tableMatch[2]).replace(/WITH\s*\(\s*NOLOCK\s*\)/i, '').trim();
    
    // Check if the table exists
    if (!validTables.has(tableName)) {
      invalidTables.add(tableName);
    }
  }
  
  // Fix invalid tables
  for (const invalidTable of invalidTables) {
    // Extract schema and table name
    const parts = invalidTable.split('.');
    if (parts.length !== 2) continue;
    
    const schema = parts[0];
    const tableName = parts[1];
    
    // Find similar table names
    const similarTables = Array.from(validTables)
      .filter(table => {
        const tableParts = table.split('.');
        return tableParts[0] === schema && tableParts[1].toLowerCase().includes(tableName.toLowerCase());
      });
    
    if (similarTables.length > 0) {
      // Use the first similar table as replacement
      const replacement = similarTables[0];
      console.log(`Replacing invalid table ${invalidTable} with ${replacement}`);
      
      // Replace the table name in the SQL expression
      fixedSql = fixedSql.replace(new RegExp(invalidTable.replace(/\./g, '\\.'), 'g'), replacement);
      fixed = true;
    }
  }
  
  // Extract column names from the SQL expression
  const columnRegex = /SELECT\s+.*?FROM|WHERE\s+([^=<>!]+)[=<>!]|ORDER\s+BY\s+([^,)]+)|GROUP\s+BY\s+([^,)]+)|HAVING\s+([^=<>!]+)[=<>!]/gi;
  let columnMatch;
  const invalidColumns = new Set();
  
  while ((columnMatch = columnRegex.exec(sqlExpression)) !== null) {
    const columnPart = columnMatch[0];
    
    // Extract individual column names
    const individualColumns = columnPart.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    
    for (const column of individualColumns) {
      // Skip common SQL keywords and functions
      const keywords = ['SELECT', 'FROM', 'WHERE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'AS', 'ON', 'JOIN', 'INNER', 'OUTER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'UNION', 'ALL', 'ANY', 'SOME', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DISTINCT', 'TOP', 'WITH', 'NOLOCK', 'SUM', 'AVG', 'MIN', 'MAX', 'COUNT', 'YEAR', 'MONTH', 'DAY', 'GETDATE', 'DATEADD', 'DATEDIFF', 'CONVERT', 'CAST', 'ISNULL', 'COALESCE', 'NULLIF', 'value'];
      
      if (!keywords.includes(column.toUpperCase()) && !validColumns.has(column) && isNaN(column)) {
        invalidColumns.add(column);
      }
    }
  }
  
  // Fix invalid columns
  for (const invalidColumn of invalidColumns) {
    // Find similar column names
    const similarColumns = Array.from(validColumns)
      .filter(column => column.toLowerCase().includes(invalidColumn.toLowerCase()) || 
               invalidColumn.toLowerCase().includes(column.toLowerCase()));
    
    if (similarColumns.length > 0) {
      // Use the first similar column as replacement
      const replacement = similarColumns[0];
      console.log(`Replacing invalid column ${invalidColumn} with ${replacement}`);
      
      // Replace the column name in the SQL expression
      fixedSql = fixedSql.replace(new RegExp(`\\b${invalidColumn}\\b`, 'g'), replacement);
      fixed = true;
    }
  }
  
  return { fixed, fixedSql };
}

// Main function
async function main() {
  try {
    console.log('VALIDATE AND FIX P21 SQL EXPRESSIONS');
    console.log('===================================');
    
    // Step 1: Parse P21Tables.md file
    console.log('\nStep 1: Parsing P21Tables.md file...');
    const { tables, columns } = parseP21Tables();
    
    // Step 2: Connect to the database
    console.log('\nStep 2: Connecting to the database...');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Database connection successful');
    
    // Step 3: Retrieve all P21 SQL expressions
    console.log('\nStep 3: Retrieving all P21 SQL expressions...');
    const rows = await db.all(`
      SELECT 
        id,
        DataPoint,
        chart_group as "chartGroup",
        chart_name as "chartName",
        variable_name as "variableName",
        server_name as "serverName",
        table_name as "tableName",
        calculation,
        sql_expression as "sqlExpression",
        value,
        last_updated as "lastUpdated"
      FROM chart_data
      WHERE server_name = 'P21'
      ORDER BY id
    `);
    console.log(`Retrieved ${rows.length} P21 SQL expressions from database`);
    
    // Step 4: Validate and fix each SQL expression
    console.log('\nStep 4: Validating and fixing SQL expressions...');
    
    let fixedCount = 0;
    const fixedRows = [];
    
    for (const row of rows) {
      console.log(`\nProcessing row ${row.id} (${row.DataPoint})...`);
      
      const { fixed, fixedSql } = validateAndFixSqlExpression(row.sqlExpression, tables, columns);
      
      if (fixed) {
        console.log(`Fixed SQL expression for row ${row.id}`);
        console.log(`Original: ${row.sqlExpression}`);
        console.log(`Fixed: ${fixedSql}`);
        
        // Update the row with the fixed SQL expression
        row.sqlExpression = fixedSql;
        row.lastUpdated = new Date().toISOString();
        
        fixedRows.push(row);
        fixedCount++;
      }
    }
    
    console.log(`\nFixed ${fixedCount} SQL expressions`);
    
    // Step 5: Update the database with the fixed SQL expressions
    console.log('\nStep 5: Updating the database with fixed SQL expressions...');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    for (const row of fixedRows) {
      await db.run(`
        UPDATE chart_data
        SET 
          sql_expression = ?,
          last_updated = ?
        WHERE id = ?
      `, [
        row.sqlExpression,
        row.lastUpdated,
        row.id
      ]);
    }
    
    // Step 6: Update the single-source-data.ts file
    console.log('\nStep 6: Updating single-source-data.ts file...');
    
    // Get all rows from the database
    const allRows = await db.all(`
      SELECT 
        id,
        DataPoint,
        chart_group as "chartGroup",
        chart_name as "chartName",
        variable_name as "variableName",
        server_name as "serverName",
        table_name as "tableName",
        calculation,
        sql_expression as "sqlExpression",
        value,
        last_updated as "lastUpdated"
      FROM chart_data
      ORDER BY id
    `);
    console.log(`Retrieved ${allRows.length} rows from database`);
    
    // Get chart group settings
    const chartGroupSettings = await db.all(`
      SELECT 
        id,
        name,
        display_order,
        is_visible,
        settings
      FROM chart_groups
      ORDER BY display_order
    `);
    console.log(`Retrieved ${chartGroupSettings.length} chart group settings`);
    
    // Get server configs
    const serverConfigs = await db.all(`
      SELECT 
        id,
        server_name as "name",
        host,
        port,
        database,
        username,
        password,
        is_active,
        connection_type,
        server,
        created_at,
        updated_at,
        config
      FROM server_configs
    `);
    console.log(`Retrieved ${serverConfigs.length} server configs`);
    
    // Process chart group settings
    const processedChartGroupSettings = chartGroupSettings.map((group) => {
      let settings = {};
      try {
        settings = JSON.parse(group.settings || '{}');
      } catch (error) {
        console.warn(`Error parsing settings for chart group ${group.id}:`, error);
      }
      
      return {
        id: group.id || '',
        name: group.name || '',
        display_order: group.display_order || 0,
        is_visible: group.is_visible || 1,
        settings
      };
    });
    
    // Process server configs
    const processedServerConfigs = serverConfigs.map((config) => {
      let configObj = {};
      try {
        configObj = JSON.parse(config.config || '{}');
      } catch (error) {
        console.warn(`Error parsing config for server ${config.name}:`, error);
      }
      
      return {
        id: config.id || '',
        name: config.name || '',
        host: config.host || '',
        port: config.port || 0,
        database: config.database || '',
        username: config.username || '',
        password: config.password || '',
        is_active: config.is_active || 1,
        connection_type: config.connection_type || 'sqlserver',
        server: config.server || '',
        created_at: config.created_at || new Date().toISOString(),
        updated_at: config.updated_at || new Date().toISOString(),
        config: configObj
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

import type { SpreadsheetRow, ChartGroupSetting, ServerConfig } from './types';

// Chart data for the dashboard
export const dashboardData: SpreadsheetRow[] = ${JSON.stringify(allRows, null, 2)};

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = ${JSON.stringify(processedChartGroupSettings, null, 2)};

// Server configurations
export const serverConfigs: ServerConfig[] = ${JSON.stringify(processedServerConfigs, null, 2)};`;
    
    // Write the file
    fs.writeFileSync(singleSourcePath, fileContent);
    console.log(`Updated single-source-data.ts file at: ${singleSourcePath}`);
    
    // Step 7: Create a cache-busting file to force dashboard refresh
    console.log('\nStep 7: Creating cache-busting file...');
    fs.writeFileSync(cacheBustPath, new Date().toISOString());
    console.log(`Created cache-busting file at: ${cacheBustPath}`);
    
    // Step 8: Commit the transaction
    console.log('\nStep 8: Committing transaction...');
    await db.run('COMMIT');
    console.log('Transaction committed successfully');
    
    // Step 9: Close the database connection
    console.log('\nStep 9: Closing database connection...');
    await db.close();
    console.log('Database connection closed');
    
    console.log('\nValidate and fix P21 SQL expressions completed successfully!');
    console.log(`Fixed ${fixedCount} SQL expressions`);
    
    if (fixedCount > 0) {
      console.log('\nNext steps:');
      console.log('1. Restart the Next.js server with "npm run dev"');
      console.log('2. Open the dashboard to verify the data is displayed correctly');
      console.log('3. Open the admin spreadsheet to verify the data is displayed correctly');
    }
    
  } catch (error) {
    console.error('Error during validate and fix P21 SQL expressions:', error);
    
    // Try to rollback the transaction if an error occurred
    try {
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      await db.run('ROLLBACK');
      await db.close();
      console.log('Transaction rolled back due to error');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
  }
}

// Run the main function
main();

