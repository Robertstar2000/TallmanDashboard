// Test script for AR Aging queries
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');

// Create an in-memory database for testing
const db = new sqlite3.Database(':memory:');

async function initTestDb() {
  try {
    console.log('Creating new in-memory test database');
    
    // Read and execute the SQL setup script
    const sqlPath = path.join(process.cwd(), 'lib', 'db', 'test-data.sql');
    console.log(`Reading SQL script from ${sqlPath}`);
    const sqlScript = await fs.readFile(sqlPath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      console.log('Executing SQL setup script...');
      db.exec(sqlScript, (err) => {
        if (err) {
          console.error('Error initializing test database:', err);
          reject(err);
        } else {
          console.log('Test database initialized successfully');
          resolve(db);
        }
      });
    });
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
}

async function executeTestQuery(query) {
  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) {
        console.error('Error executing test query:', err);
        resolve(0);
      } else if (rows && rows.length > 0) {
        // Extract the value from the first row
        const firstRow = rows[0];
        const keys = Object.keys(firstRow);
        
        if (keys.length > 0) {
          const value = firstRow[keys[0]];
          const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
          console.log(`Query returned value: ${numericValue}`);
          resolve(numericValue);
        } else {
          console.log('Query returned row with no columns, using default value 0');
          resolve(0);
        }
      } else {
        console.log('Query returned no rows, using default value 0');
        resolve(0);
      }
    });
  });
}

async function testARAgingQueries() {
  console.log('Initializing test database...');
  await initTestDb();
  
  // Define the AR Aging queries to test
  const queries = [
    {
      name: 'Current',
      query: "SELECT SUM(amount_open) as value FROM pub_ar_open_items WHERE days_past_due = 0"
    },
    {
      name: '1-30 Days',
      query: "SELECT SUM(amount_open) as value FROM pub_ar_open_items WHERE days_past_due > 0 AND days_past_due <= 30"
    },
    {
      name: '31-60 Days',
      query: "SELECT SUM(amount_open) as value FROM pub_ar_open_items WHERE days_past_due > 30 AND days_past_due <= 60"
    },
    {
      name: '61-90 Days',
      query: "SELECT SUM(amount_open) as value FROM pub_ar_open_items WHERE days_past_due > 60 AND days_past_due <= 90"
    },
    {
      name: '90+ Days',
      query: "SELECT SUM(amount_open) as value FROM pub_ar_open_items WHERE days_past_due > 90"
    }
  ];
  
  // Execute each query and log the results
  console.log('Testing AR Aging queries...');
  for (const query of queries) {
    try {
      const result = await executeTestQuery(query.query);
      console.log(`${query.name}: ${result}`);
      if (result === 0) {
        console.log(`WARNING: ${query.name} query returned 0`);
      }
    } catch (error) {
      console.error(`Error executing ${query.name} query:`, error);
    }
  }
  
  // Also test a query to get all records to see what data we have
  try {
    console.log('\nChecking available data in pub_ar_open_items:');
    const checkQuery = "SELECT invoice_id, amount_open, days_past_due FROM pub_ar_open_items ORDER BY days_past_due";
    db.all(checkQuery, (err, rows) => {
      if (err) {
        console.error('Error checking data:', err);
      } else {
        console.log('Data check result:', rows);
      }
      
      // Close the database connection
      db.close();
      console.log('Tests completed');
    });
  } catch (error) {
    console.error('Error checking data:', error);
    db.close();
  }
}

// Run the tests
testARAgingQueries().catch(error => {
  console.error('Test failed:', error);
  db.close();
  process.exit(1);
});
