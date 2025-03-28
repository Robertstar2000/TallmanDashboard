// Script to save the database to the initialization file
const path = require('path');

// Use the correct path for the sqlite module
async function saveDb() {
  console.log('Saving database to initialization file...');
  
  try {
    // Dynamically import the sqlite module with the correct path
    const { saveDbToInitFile } = await import('../lib/db/sqlite.js');
    
    // Call the saveDbToInitFile function
    await saveDbToInitFile();
    console.log('Successfully saved database to initialization file');
  } catch (error) {
    console.error('Error saving database:', error);
    console.error('Error details:', error.stack);
  }
}

// Run the main function
saveDb();
