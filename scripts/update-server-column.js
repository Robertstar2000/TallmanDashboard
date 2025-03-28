// Script to update the server column in the server_configs table
const sqlite3 = require('better-sqlite3');
const path = require('path');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Updating server column in database at: ${dbPath}`);

function main() {
  try {
    // Open the database
    const db = sqlite3(dbPath);
    
    // Update the server column with the correct values
    console.log('Updating server column values...');
    
    // First, update P21 server
    db.exec(`UPDATE server_configs SET server = 'P21' WHERE server_name = 'P21'`);
    
    // Then, update POR server
    db.exec(`UPDATE server_configs SET server = 'POR' WHERE server_name = 'POR'`);
    
    // Verify the update
    const rows = db.prepare('SELECT id, server, server_name FROM server_configs').all();
    
    console.log('\nVerification - Server column values:');
    rows.forEach(row => {
      console.log(`- Row ${row.id}: server = "${row.server}", server_name = "${row.server_name}"`);
    });
    
    db.close();
    console.log('Update completed successfully');
  } catch (error) {
    console.error('Error updating server column:', error);
  }
}

main();
