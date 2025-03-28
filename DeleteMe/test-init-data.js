// Test script to verify the initial-data.ts file and its imports
const path = require('path');
const fs = require('fs');

async function testInitialData() {
  try {
    console.log('Testing initial-data.ts and its imports...');
    
    // Import the combined-spreadsheet-data module
    console.log('Importing combined-spreadsheet-data.js...');
    const combinedDataPath = path.join(__dirname, 'lib', 'db', 'combined-spreadsheet-data.js');
    
    if (!fs.existsSync(combinedDataPath)) {
      console.error(`Error: ${combinedDataPath} does not exist`);
      console.log('Looking for alternative files...');
      
      const dbDir = path.join(__dirname, 'lib', 'db');
      const files = fs.readdirSync(dbDir);
      console.log('Available files in lib/db:', files);
      
      // Check for .js or .ts files
      const jsFiles = files.filter(file => file.endsWith('.js'));
      console.log('JS files:', jsFiles);
      
      return;
    }
    
    // Try to import the combined data
    try {
      const { combinedSpreadsheetData } = require('./lib/db/combined-spreadsheet-data');
      console.log('Combined spreadsheet data imported successfully');
      console.log(`Data length: ${combinedSpreadsheetData ? combinedSpreadsheetData.length : 'undefined'}`);
      
      if (combinedSpreadsheetData && combinedSpreadsheetData.length > 0) {
        console.log('First row sample:', JSON.stringify(combinedSpreadsheetData[0], null, 2));
      }
    } catch (importError) {
      console.error('Error importing combined-spreadsheet-data:', importError);
    }
    
    // Try to import the initial data
    try {
      const initialDataPath = path.join(__dirname, 'lib', 'db', 'initial-data.js');
      
      if (!fs.existsSync(initialDataPath)) {
        console.error(`Error: ${initialDataPath} does not exist`);
        return;
      }
      
      const initialData = require('./lib/db/initial-data');
      console.log('Initial data imported successfully');
      console.log('Module keys:', Object.keys(initialData));
      
      // Check initialSpreadsheetData
      if (initialData.initialSpreadsheetData) {
        console.log(`initialSpreadsheetData length: ${initialData.initialSpreadsheetData.length}`);
        
        if (initialData.initialSpreadsheetData.length > 0) {
          console.log('First row sample:', JSON.stringify(initialData.initialSpreadsheetData[0], null, 2));
        }
      } else {
        console.error('initialSpreadsheetData is undefined or null');
      }
      
      // Check chartGroupSettings
      if (initialData.chartGroupSettings) {
        console.log(`chartGroupSettings length: ${initialData.chartGroupSettings.length}`);
        
        if (initialData.chartGroupSettings.length > 0) {
          console.log('First chart group sample:', JSON.stringify(initialData.chartGroupSettings[0], null, 2));
        }
      } else {
        console.error('chartGroupSettings is undefined or null');
      }
      
      // Check serverConfigs
      if (initialData.serverConfigs) {
        console.log(`serverConfigs length: ${initialData.serverConfigs.length}`);
        
        if (initialData.serverConfigs.length > 0) {
          console.log('First server config sample:', JSON.stringify(initialData.serverConfigs[0], null, 2));
        }
      } else {
        console.error('serverConfigs is undefined or null');
      }
    } catch (importError) {
      console.error('Error importing initial-data:', importError);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testInitialData();
