// Script to update site location names
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Connect to the database
const db = new Database('./data/dashboard.db');

try {
  console.log('Connected to the database at', path.resolve('./data/dashboard.db'));
  
  // Start a transaction
  db.prepare('BEGIN').run();
  
  // Update Jackson to Addison
  const updateJackson = db.prepare("UPDATE chart_data SET variable_name = 'Addison' WHERE chart_group = 'Site Distribution' AND variable_name = 'Jackson'");
  const jacksonResult = updateJackson.run();
  console.log(`Updated ${jacksonResult.changes} rows: Jackson -> Addison`);
  
  // Update Elk City to Lake City
  const updateElkCity = db.prepare("UPDATE chart_data SET variable_name = 'Lake City' WHERE chart_group = 'Site Distribution' AND variable_name = 'Elk City'");
  const elkCityResult = updateElkCity.run();
  console.log(`Updated ${elkCityResult.changes} rows: Elk City -> Lake City`);
  
  // Commit the transaction
  db.prepare('COMMIT').run();
  
  // Now update the initial-data.ts file
  const initialDataPath = path.resolve('./lib/db/initial-data.ts');
  console.log('Updating initial-data.ts file...');
  
  // Create a backup of the file
  const backupPath = `${initialDataPath}.backup-${Date.now()}.ts`;
  fs.copyFileSync(initialDataPath, backupPath);
  console.log(`Created backup of initial-data.ts at ${backupPath}`);
  
  // Read the file
  let initialData = fs.readFileSync(initialDataPath, 'utf8');
  
  // Replace Jackson with Addison and Elk City with Lake City
  initialData = initialData.replace(/variableName: 'Jackson'/g, "variableName: 'Addison'");
  initialData = initialData.replace(/variableName: 'Elk City'/g, "variableName: 'Lake City'");
  
  // Write the updated file
  fs.writeFileSync(initialDataPath, initialData);
  console.log(`Successfully updated ${initialDataPath}`);
  
  console.log('\nSite location names update completed successfully!');
} catch (err) {
  // Rollback the transaction in case of error
  db.prepare('ROLLBACK').run();
  console.error('Error:', err.message);
} finally {
  // Close the database connection
  db.close();
  console.log('Database connection closed');
}
