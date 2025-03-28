// Script to save the database to the initialization file
const path = require('path');
const { saveDbToInitFile } = require('../lib/db/sqlite');

async function saveDb() {
  console.log('Saving database to initialization file...');
  
  try {
    await saveDbToInitFile();
    console.log('Successfully saved database to initialization file');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

saveDb();
