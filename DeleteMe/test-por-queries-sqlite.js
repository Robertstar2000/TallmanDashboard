const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Output file path
const outputFilePath = path.join(__dirname, 'por-query-results-sqlite.txt');

// Function to write to the output file
function writeToFile(message) {
  fs.appendFileSync(outputFilePath, message + '\n');
  console.log(message);
}

// Clear the output file if it exists
if (fs.existsSync(outputFilePath)) {
  fs.unlinkSync(outputFilePath);
}

writeToFile('=== POR Queries Test (SQLite) ===');
writeToFile(`Starting test at ${new Date().toISOString()}`);

// Create a test database with sample data for POR queries
const db = new sqlite3.Database(':memory:');

// Initialize the database with test data
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    writeToFile('Creating test database with sample data...');
    
    // Create purchase_orders table
    db.run(`
      CREATE TABLE purchase_orders (
        id INTEGER PRIMARY KEY,
        date TEXT,
        vendor_number TEXT,
        status TEXT,
        shipping_cost REAL,
        store TEXT
      )
    `, (err) => {
      if (err) {
        writeToFile(`Error creating table: ${err.message}`);
        reject(err);
        return;
      }
      
      // Insert sample data
      const stmt = db.prepare(`
        INSERT INTO purchase_orders (date, vendor_number, status, shipping_cost, store)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      // Current date for reference
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // Generate dates for the last 3 months
      const month1 = `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`; // Current month
      const month2 = `${currentYear}-${String(currentMonth - 1).padStart(2, '0')}-15`; // Last month
      const month3 = `${currentYear}-${String(currentMonth - 2).padStart(2, '0')}-15`; // 2 months ago
      
      // Insert 50 records with various dates, statuses, and values
      const statuses = ['Open', 'Closed', 'Pending', 'Shipped'];
      const vendors = ['Vendor1', 'Vendor2', 'Vendor3', 'Vendor4', 'Vendor5'];
      const stores = ['Store1', 'Store2', 'Store3', null];
      
      let count = 0;
      for (let i = 0; i < 50; i++) {
        // Distribute records across the 3 months
        let date;
        if (i < 20) {
          date = month1; // 20 records in current month
        } else if (i < 35) {
          date = month2; // 15 records in last month
        } else {
          date = month3; // 15 records 2 months ago
        }
        
        // Randomly select status, vendor, and store
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const store = stores[Math.floor(Math.random() * stores.length)];
        
        // Generate a random shipping cost between 100 and 1000
        const shippingCost = Math.round(Math.random() * 900 + 100);
        
        stmt.run(date, vendor, status, shippingCost, store);
        count++;
      }
      
      stmt.finalize();
      writeToFile(`Inserted ${count} sample records into purchase_orders table`);
      
      // Check the data distribution
      db.all('SELECT strftime("%Y-%m", date) as month, COUNT(*) as count FROM purchase_orders GROUP BY month', [], (err, rows) => {
        if (err) {
          writeToFile(`Error checking data distribution: ${err.message}`);
        } else {
          writeToFile('Data distribution by month:');
          rows.forEach(row => {
            writeToFile(`  ${row.month}: ${row.count} records`);
          });
        }
        resolve();
      });
    });
  });
}

// Test a query and log the results
function testQuery(query, name) {
  return new Promise((resolve, reject) => {
    writeToFile(`\n=== Testing query: ${name} ===`);
    writeToFile(`SQL: ${query}`);
    
    db.all(query, [], (err, rows) => {
      if (err) {
        writeToFile(`❌ Error executing query: ${err.message}`);
        resolve(false);
        return;
      }
      
      writeToFile('✅ Query executed successfully');
      
      if (rows.length === 0) {
        writeToFile('⚠️ Query returned no results');
        resolve(false);
        return;
      }
      
      // Log the results
      writeToFile(`Results (${rows.length} rows):`);
      rows.forEach((row, index) => {
        if (index < 5) { // Only show first 5 rows for brevity
          writeToFile(`  ${JSON.stringify(row)}`);
        }
      });
      
      if (rows.length > 5) {
        writeToFile(`  ... and ${rows.length - 5} more rows`);
      }
      
      // Check if the query returned a non-zero value
      if (rows[0].value !== undefined) {
        if (rows[0].value !== 0) {
          writeToFile(`✅ RETURNED NON-ZERO VALUE: ${rows[0].value}`);
        } else {
          writeToFile('⚠️ WARNING: Returned zero value');
        }
      }
      
      resolve(true);
    });
  });
}

// Run all tests
async function runTests() {
  try {
    await initializeDatabase();
    
    // Define test queries (SQLite versions of our MS Access queries)
    const queries = [
      {
        name: "POR Overview - New Rentals - Current Month",
        query: `
          SELECT (
            SELECT COUNT(*) FROM purchase_orders 
            WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
          ) - (
            SELECT COUNT(*) FROM purchase_orders 
            WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-1 month')
            AND status <> 'Closed'
          ) as value
        `
      },
      {
        name: "POR Overview - Open Rentals - Current Month",
        query: `
          SELECT COUNT(*) as value FROM purchase_orders 
          WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
          AND status <> 'Closed'
        `
      },
      {
        name: "POR Overview - Rental Value - Current Month",
        query: `
          SELECT COALESCE(SUM(shipping_cost), 0) as value FROM purchase_orders 
          WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
        `
      },
      {
        name: "Vendor Analysis - Top 5 Vendors",
        query: `
          SELECT vendor_number, COUNT(*) as value 
          FROM purchase_orders 
          WHERE date >= date('now', '-1 year')
          GROUP BY vendor_number 
          ORDER BY value DESC LIMIT 5
        `
      },
      {
        name: "PO Status - Status Distribution",
        query: `
          SELECT status, COUNT(*) as value 
          FROM purchase_orders 
          WHERE date >= date('now', '-1 year')
          GROUP BY status
        `
      },
      {
        name: "Store Analysis - PO by Store",
        query: `
          SELECT COALESCE(store, 'Unknown') as store, COUNT(*) as value 
          FROM purchase_orders 
          WHERE date >= date('now', '-1 year')
          GROUP BY COALESCE(store, 'Unknown')
        `
      }
    ];
    
    // Run each query test
    for (const query of queries) {
      await testQuery(query.query, query.name);
    }
    
    // Close the database
    db.close();
    writeToFile('\n✅ Tests completed successfully');
  } catch (error) {
    writeToFile(`\n❌ ERROR: ${error.message}`);
    if (db) db.close();
  }
  
  writeToFile(`\n=== Test completed at ${new Date().toISOString()} ===`);
  writeToFile(`Results have been saved to: ${outputFilePath}`);
}

// Run the tests
runTests();
