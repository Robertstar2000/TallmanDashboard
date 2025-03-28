// Script to fix all blank SQL expressions in the SQLite database
// This script reads SQL expressions from complete-chart-data.ts and updates the database
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Path to the complete-chart-data.ts file
const completeChartDataPath = path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts');

// Function to read and parse the complete-chart-data.ts file
function readCompleteChartData() {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(completeChartDataPath, 'utf8');
    
    // Create a temporary JavaScript file to evaluate the TypeScript content
    const tempJsPath = path.join(process.cwd(), 'temp-chart-data.js');
    
    // Convert TypeScript to JavaScript (simple conversion for this specific case)
    const jsContent = fileContent
      .replace('export const initialSpreadsheetData =', 'module.exports =')
      .replace(/import.*?;/g, '');
    
    fs.writeFileSync(tempJsPath, jsContent);
    
    // Load the JavaScript file
    const chartData = require(tempJsPath);
    
    // Delete the temporary file
    fs.unlinkSync(tempJsPath);
    
    return chartData;
  } catch (error) {
    console.error('Error reading complete-chart-data.ts:', error);
    return null;
  }
}

// Function to update SQL expressions in the database
async function updateSqlExpressions(chartData) {
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Get all rows from the chart_data table
    const dbRows = await db.all('SELECT id, variable_name, chart_group, production_sql_expression FROM chart_data');
    
    console.log(`Found ${dbRows.length} rows in the database`);
    
    // Create a map of chart data by ID for easier lookup
    const chartDataMap = new Map();
    chartData.forEach(item => {
      chartDataMap.set(item.id, item);
    });
    
    // Count variables for reporting
    let totalUpdated = 0;
    let blankExpressions = 0;
    let missingInFile = 0;
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each row in the database
    for (const dbRow of dbRows) {
      const fileRow = chartDataMap.get(dbRow.id);
      
      if (!fileRow) {
        console.log(`Row with ID ${dbRow.id} not found in complete-chart-data.ts`);
        missingInFile++;
        continue;
      }
      
      // Check if the database row has a blank SQL expression
      const dbSql = dbRow.production_sql_expression || '';
      
      if (!dbSql.trim()) {
        blankExpressions++;
        
        // Get the SQL expression from the file
        const fileSql = fileRow.productionSqlExpression || '';
        
        if (fileSql.trim()) {
          // Update the database with the SQL expression from the file
          await db.run(`
            UPDATE chart_data 
            SET production_sql_expression = ? 
            WHERE id = ?
          `, [fileSql, dbRow.id]);
          
          console.log(`Updated SQL expression for ID ${dbRow.id}, Variable: ${dbRow.variable_name}, Chart Group: ${dbRow.chart_group}`);
          totalUpdated++;
        } else {
          console.log(`Both file and database have blank SQL expression for ID ${dbRow.id}, Variable: ${fileRow.variableName}, Chart Group: ${fileRow.chartGroup}`);
        }
      }
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Close the database connection
    await db.close();
    
    return {
      totalUpdated,
      blankExpressions,
      missingInFile
    };
  } catch (error) {
    console.error('Error updating SQL expressions:', error);
    return null;
  }
}

// Function to create a script that will reload the database from the initialization file
function createReloadDbScript() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'reload-db-from-init.js');
  
  const scriptContent = `// Script to reload the database from the initialization file
const path = require('path');
const { loadDbFromInitFile } = require('../lib/db/sqlite');

async function reloadDb() {
  console.log('Reloading database from initialization file...');
  
  try {
    await loadDbFromInitFile();
    console.log('Successfully reloaded database from initialization file');
  } catch (error) {
    console.error('Error reloading database:', error);
  }
}

reloadDb();
`;
  
  fs.writeFileSync(scriptPath, scriptContent);
  console.log(`Created reload script at ${scriptPath}`);
}

// Main function to fix all blank SQL expressions
async function fixAllSqlExpressions() {
  console.log('Fixing all blank SQL expressions in the SQLite database...');
  
  try {
    // Read complete-chart-data.ts
    console.log('Reading complete-chart-data.ts...');
    const chartData = readCompleteChartData();
    
    if (!chartData) {
      console.error('Failed to read complete-chart-data.ts');
      return;
    }
    
    console.log(`Successfully read ${chartData.length} items from complete-chart-data.ts`);
    
    // Update SQL expressions in the database
    console.log('Updating SQL expressions in the database...');
    const result = await updateSqlExpressions(chartData);
    
    if (!result) {
      console.error('Failed to update SQL expressions in the database');
      return;
    }
    
    // Print results
    console.log('\n=== RESULTS ===');
    console.log(`Total rows with blank SQL expressions: ${result.blankExpressions}`);
    console.log(`Total rows updated: ${result.totalUpdated}`);
    console.log(`Total rows missing in complete-chart-data.ts: ${result.missingInFile}`);
    
    // Create reload script
    createReloadDbScript();
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Restart the application or click the "Load DB" button in the admin panel to see the changes');
    console.log('2. If the issue persists, run the reload-db-from-init.js script to completely reload the database:');
    console.log('   node scripts/reload-db-from-init.js');
    
  } catch (error) {
    console.error('Error fixing SQL expressions:', error);
  }
}

// Run the main function
fixAllSqlExpressions();
