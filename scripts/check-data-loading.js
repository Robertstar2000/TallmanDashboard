// Script to check if all data from complete-chart-data.ts is properly loaded into the SQLite database
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Path to the complete-chart-data.ts file
const completeChartDataPath = path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts');

// Function to extract data from complete-chart-data.ts
function extractDataFromFile() {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(completeChartDataPath, 'utf8');
    
    // Extract the array of data using regex
    const match = fileContent.match(/export const initialSpreadsheetData = (\[[\s\S]*?\]);/);
    
    if (!match || !match[1]) {
      console.error('Failed to extract data from complete-chart-data.ts');
      return null;
    }
    
    // Convert the extracted string to a JavaScript array
    // We need to replace single quotes with double quotes for JSON.parse
    let dataString = match[1].replace(/'/g, '"');
    
    // Handle the case where the file might have JavaScript template literals
    dataString = dataString.replace(/`/g, '"');
    
    // Replace any JS comments that might be in the file
    dataString = dataString.replace(/\/\/.*$/gm, '');
    
    // Evaluate the string as JavaScript to get the array
    // This is safer than using eval() directly
    const dataArray = new Function(`return ${dataString}`)();
    
    return dataArray;
  } catch (error) {
    console.error('Error extracting data from complete-chart-data.ts:', error);
    return null;
  }
}

// Function to get all data from the SQLite database
async function getDataFromDatabase() {
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Get all rows from the chart_data table
    const rows = await db.all('SELECT * FROM chart_data');
    
    // Close the database connection
    await db.close();
    
    return rows;
  } catch (error) {
    console.error('Error getting data from database:', error);
    return null;
  }
}

// Function to compare data from file and database
function compareData(fileData, dbData) {
  if (!fileData || !dbData) {
    return {
      success: false,
      message: 'Failed to compare data due to missing data'
    };
  }
  
  // Create maps for easier lookup
  const fileDataMap = new Map();
  const dbDataMap = new Map();
  
  // Map file data by ID
  fileData.forEach(item => {
    fileDataMap.set(item.id, item);
  });
  
  // Map database data by ID
  dbData.forEach(item => {
    dbDataMap.set(item.id, item);
  });
  
  // Find items in file but not in database
  const missingInDb = [];
  fileDataMap.forEach((item, id) => {
    if (!dbDataMap.has(id)) {
      missingInDb.push(item);
    }
  });
  
  // Find items in database but not in file
  const extraInDb = [];
  dbDataMap.forEach((item, id) => {
    if (!fileDataMap.has(id)) {
      extraInDb.push(item);
    }
  });
  
  // Check for differences in SQL expressions
  const differentSqlExpressions = [];
  fileDataMap.forEach((fileItem, id) => {
    const dbItem = dbDataMap.get(id);
    if (dbItem) {
      // Compare production SQL expressions
      const fileSql = fileItem.productionSqlExpression || '';
      const dbSql = dbItem.production_sql_expression || '';
      
      // Normalize SQL expressions for comparison (remove whitespace)
      const normalizedFileSql = fileSql.replace(/\s+/g, ' ').trim();
      const normalizedDbSql = dbSql.replace(/\s+/g, ' ').trim();
      
      if (normalizedFileSql !== normalizedDbSql) {
        differentSqlExpressions.push({
          id,
          variableName: fileItem.variableName,
          fileExpression: fileSql,
          dbExpression: dbSql
        });
      }
    }
  });
  
  return {
    success: true,
    fileDataCount: fileData.length,
    dbDataCount: dbData.length,
    missingInDb,
    extraInDb,
    differentSqlExpressions
  };
}

// Main function to check data loading
async function checkDataLoading() {
  console.log('Checking if all data from complete-chart-data.ts is properly loaded into the SQLite database...');
  
  try {
    // Extract data from complete-chart-data.ts
    console.log('Extracting data from complete-chart-data.ts...');
    const fileData = extractDataFromFile();
    
    if (!fileData) {
      console.error('Failed to extract data from complete-chart-data.ts');
      return;
    }
    
    console.log(`Successfully extracted ${fileData.length} items from complete-chart-data.ts`);
    
    // Get data from SQLite database
    console.log('Getting data from SQLite database...');
    const dbData = await getDataFromDatabase();
    
    if (!dbData) {
      console.error('Failed to get data from SQLite database');
      return;
    }
    
    console.log(`Successfully retrieved ${dbData.length} items from SQLite database`);
    
    // Compare data
    console.log('Comparing data...');
    const comparison = compareData(fileData, dbData);
    
    if (!comparison.success) {
      console.error(comparison.message);
      return;
    }
    
    // Print comparison results
    console.log('\n=== COMPARISON RESULTS ===');
    console.log(`Items in complete-chart-data.ts: ${comparison.fileDataCount}`);
    console.log(`Items in SQLite database: ${comparison.dbDataCount}`);
    
    // Print missing items
    if (comparison.missingInDb.length > 0) {
      console.log(`\n${comparison.missingInDb.length} items are in complete-chart-data.ts but not in the database:`);
      comparison.missingInDb.forEach(item => {
        console.log(`- ID: ${item.id}, Variable: ${item.variableName}, Chart Group: ${item.chartGroup}`);
      });
    } else {
      console.log('\nAll items from complete-chart-data.ts are in the database');
    }
    
    // Print extra items
    if (comparison.extraInDb.length > 0) {
      console.log(`\n${comparison.extraInDb.length} items are in the database but not in complete-chart-data.ts:`);
      comparison.extraInDb.forEach(item => {
        console.log(`- ID: ${item.id}, Variable: ${item.variable_name}, Chart Group: ${item.chart_group}`);
      });
    } else {
      console.log('\nAll items in the database are from complete-chart-data.ts');
    }
    
    // Print different SQL expressions
    if (comparison.differentSqlExpressions.length > 0) {
      console.log(`\n${comparison.differentSqlExpressions.length} items have different SQL expressions:`);
      comparison.differentSqlExpressions.forEach(item => {
        console.log(`- ID: ${item.id}, Variable: ${item.variableName}`);
        console.log(`  File: ${item.fileExpression.substring(0, 50)}...`);
        console.log(`  DB:   ${item.dbExpression.substring(0, 50)}...`);
      });
    } else {
      console.log('\nAll SQL expressions match between complete-chart-data.ts and the database');
    }
    
    // Print conclusion
    console.log('\n=== CONCLUSION ===');
    if (comparison.missingInDb.length === 0 && comparison.differentSqlExpressions.length === 0) {
      console.log('All data from complete-chart-data.ts is properly loaded into the SQLite database');
    } else {
      console.log('There are discrepancies between complete-chart-data.ts and the SQLite database');
      console.log('You may need to reload the database from the initialization file');
    }
    
  } catch (error) {
    console.error('Error checking data loading:', error);
  }
}

// Run the main function
checkDataLoading();
