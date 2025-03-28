// Script to check and fix the values in the database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Function to check the values in the database
async function checkDatabaseValues() {
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Check Accounts values
    console.log('\nChecking Accounts values in the database...');
    
    const accountIds = [
      '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', // Payable
      '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', // Receivable
      '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41'  // Overdue
    ];
    
    for (const id of accountIds) {
      const row = await db.get('SELECT id, DataPoint, value FROM chart_data WHERE id = ?', id);
      
      if (row) {
        console.log(`ID: ${row.id}, DataPoint: ${row.DataPoint}, Value: ${row.value}`);
      } else {
        console.log(`ID: ${id} not found in the database`);
      }
    }
    
    // Fix the values in the database
    console.log('\nFixing values in the database...');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each value to 0 to reset them
    for (const id of accountIds) {
      await db.run('UPDATE chart_data SET value = ? WHERE id = ?', ['0', id]);
      console.log(`Reset value for ID: ${id}`);
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    console.log('\nValues have been reset to 0. Please click the "Load DB" button in the admin panel to reload the data.');
    
    // Close the database connection
    await db.close();
    
  } catch (error) {
    console.error('Error checking database values:', error);
  }
}

// Run the function
checkDatabaseValues();
