const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to the database at ${dbPath}`);
});

// Function to remove the Open Orders chart group from the database
async function removeOpenOrdersFromDatabase() {
  return new Promise((resolve, reject) => {
    // Begin transaction
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        return reject(err);
      }

      // Delete all rows with chart_group = 'Open Orders'
      db.run('DELETE FROM chart_data WHERE chart_group = ?', ['Open Orders'], function(err) {
        if (err) {
          db.run('ROLLBACK', () => {
            return reject(err);
          });
        }
        
        console.log(`Deleted ${this.changes} rows from chart_data table with chart_group = 'Open Orders'`);
        
        // Commit transaction
        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK', () => {
              return reject(err);
            });
          }
          
          resolve(this.changes);
        });
      });
    });
  });
}

// Function to remove Open Orders from initial-data.ts
async function removeOpenOrdersFromInitialData() {
  // Path to the initial-data.ts file
  const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
  
  try {
    // Read the file content
    const initialDataContent = fs.readFileSync(initialDataPath, 'utf8');
    
    // Extract the initialSpreadsheetData array
    const dataStartRegex = /export const initialSpreadsheetData: SpreadsheetRow\[] = \[/;
    const dataEndRegex = /\];(\r?\n\r?\n\/\/ Chart group settings)/;
    
    const dataStartMatch = initialDataContent.match(dataStartRegex);
    const dataEndMatch = initialDataContent.match(dataEndRegex);
    
    if (!dataStartMatch || !dataEndMatch) {
      throw new Error('Could not find initialSpreadsheetData array in the file');
    }
    
    const dataStartIndex = dataStartMatch.index + dataStartMatch[0].length;
    const dataEndIndex = dataEndMatch.index;
    
    // Extract the data array as a string
    const dataArrayString = initialDataContent.substring(dataStartIndex, dataEndIndex);
    
    // Create a temporary file with the data array
    const tempFilePath = path.join(process.cwd(), 'temp-data-array.js');
    fs.writeFileSync(tempFilePath, 'module.exports = [' + dataArrayString + '];');
    
    // Require the temporary file
    const initialSpreadsheetData = require('./temp-data-array.js');
    
    // Delete the temporary file
    fs.unlinkSync(tempFilePath);
    
    console.log(`Loaded ${initialSpreadsheetData.length} rows from initial-data.ts`);
    
    // Filter out rows with chartGroup = 'Open Orders'
    const filteredData = initialSpreadsheetData.filter(row => row.chartGroup !== 'Open Orders');
    
    console.log(`Removed ${initialSpreadsheetData.length - filteredData.length} rows with chartGroup = 'Open Orders'`);
    
    // Convert the filtered data back to a string
    let filteredDataString = JSON.stringify(filteredData, null, 2)
      .replace(/^\[/, '') // Remove opening bracket
      .replace(/\]$/, ''); // Remove closing bracket
    
    // Fix the formatting to match the original file
    filteredDataString = filteredDataString
      .replace(/"([^"]+)":/g, '$1:') // Remove quotes around property names
      .replace(/"/g, "'") // Replace double quotes with single quotes for string values
      .replace(/,\n  \}/g, '\n  }') // Remove trailing commas in objects
      .replace(/\n/g, '\n  '); // Add proper indentation
    
    // Create the updated file content
    const updatedContent = initialDataContent.substring(0, dataStartIndex) + 
      filteredDataString + 
      initialDataContent.substring(dataEndIndex);
    
    // Write the updated content back to the file
    fs.writeFileSync(initialDataPath, updatedContent);
    
    console.log(`Successfully updated initial-data.ts`);
    
    return initialSpreadsheetData.length - filteredData.length;
  } catch (error) {
    console.error(`Error updating initial-data.ts: ${error.message}`);
    throw error;
  }
}

// Function to check for references to Open Orders in data transformers
async function checkTransformerReferences() {
  const transformersPath = path.join(process.cwd(), 'lib', 'db', 'data-transformers.ts');
  
  try {
    if (!fs.existsSync(transformersPath)) {
      console.log(`Transformers file not found at ${transformersPath}`);
      return;
    }
    
    const transformersContent = fs.readFileSync(transformersPath, 'utf8');
    
    // Check for references to 'Open Orders'
    const openOrdersReferences = (transformersContent.match(/Open Orders/g) || []).length;
    
    if (openOrdersReferences > 0) {
      console.log(`Found ${openOrdersReferences} references to 'Open Orders' in data-transformers.ts`);
      console.log(`Please manually review and update the transformers file to remove any references to the 'Open Orders' chart group.`);
    } else {
      console.log(`No references to 'Open Orders' found in data-transformers.ts`);
    }
  } catch (error) {
    console.error(`Error checking transformer references: ${error.message}`);
  }
}

// Run all functions
async function run() {
  try {
    console.log('Removing Open Orders chart group from database...');
    const dbRowsRemoved = await removeOpenOrdersFromDatabase();
    
    console.log('\nRemoving Open Orders chart group from initial-data.ts...');
    const initDataRowsRemoved = await removeOpenOrdersFromInitialData();
    
    console.log('\nChecking for references to Open Orders in data transformers...');
    await checkTransformerReferences();
    
    console.log('\nSummary:');
    console.log(`- Removed ${dbRowsRemoved} rows from database`);
    console.log(`- Removed ${initDataRowsRemoved} rows from initial-data.ts`);
    console.log('\nRemoval of Open Orders chart group completed successfully!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error(`Error closing database: ${err.message}`);
      }
      console.log('Database connection closed');
    });
  }
}

// Run the script
run();
