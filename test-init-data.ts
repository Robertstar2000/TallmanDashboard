// Test script to verify the initial-data.ts file and its imports
import path from 'path';
import fs from 'fs';

async function testInitialData() {
  try {
    console.log('Testing initial-data.ts and its imports...');
    
    // Try to import the combined-spreadsheet-data module
    try {
      console.log('Importing combined-spreadsheet-data.ts...');
      const combinedData = await import('./lib/db/combined-spreadsheet-data');
      console.log('Combined spreadsheet data imported successfully');
      console.log('Module keys:', Object.keys(combinedData));
      
      if (combinedData.combinedSpreadsheetData) {
        console.log(`Combined data length: ${combinedData.combinedSpreadsheetData.length}`);
        
        if (combinedData.combinedSpreadsheetData.length > 0) {
          console.log('First row sample:', JSON.stringify(combinedData.combinedSpreadsheetData[0], null, 2));
        }
      } else {
        console.error('combinedSpreadsheetData is undefined or null');
      }
    } catch (importError) {
      console.error('Error importing combined-spreadsheet-data:', importError);
    }
    
    // Try to import the initial data
    try {
      console.log('\nImporting initial-data.ts...');
      const initialData = await import('./lib/db/initial-data');
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
    
    // Try to import the types
    try {
      console.log('\nImporting types.ts...');
      const types = await import('./lib/db/types');
      console.log('Types imported successfully');
      console.log('Module keys:', Object.keys(types));
    } catch (importError) {
      console.error('Error importing types:', importError);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testInitialData();
