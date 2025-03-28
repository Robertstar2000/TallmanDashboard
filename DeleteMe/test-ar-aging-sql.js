// Script to test SQL expressions for AR Aging chart group
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// First, let's examine the invoice_hdr table structure
console.log('\n--- Examining invoice_hdr table structure ---');
db.all("PRAGMA table_info(invoice_hdr)", (err, columns) => {
  if (err) {
    console.error('Error getting table structure:', err.message);
    closeDb();
    return;
  }
  
  if (columns.length === 0) {
    console.log('Table invoice_hdr does not exist or has no columns');
    
    // Create a test table if it doesn't exist
    console.log('Creating test invoice_hdr table with sample data...');
    createTestTable();
  } else {
    console.log('Table structure:');
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    // Test the SQL queries
    testArAgingQueries();
  }
});

// Create a test table with sample data
function createTestTable() {
  db.serialize(() => {
    // Drop the table if it exists
    db.run("DROP TABLE IF EXISTS invoice_hdr", (err) => {
      if (err) {
        console.error('Error dropping table:', err.message);
        return;
      }
      
      // Create the invoice_hdr table
      db.run(`
        CREATE TABLE invoice_hdr (
          invoice_id INTEGER PRIMARY KEY,
          customer_id TEXT,
          invoice_date TEXT,
          due_date TEXT,
          total_amount REAL,
          current_due REAL,
          past_due_1_30 REAL,
          past_due_31_60 REAL,
          past_due_61_90 REAL,
          past_due_over_90 REAL,
          status TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          return;
        }
        
        console.log('Created invoice_hdr table');
        
        // Insert sample data
        const stmt = db.prepare(`
          INSERT INTO invoice_hdr (
            customer_id, invoice_date, due_date, total_amount,
            current_due, past_due_1_30, past_due_31_60, past_due_61_90, past_due_over_90, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        // Current invoices
        for (let i = 1; i <= 20; i++) {
          stmt.run(
            `CUST${i.toString().padStart(3, '0')}`,
            new Date().toISOString().split('T')[0],
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            1000 + Math.random() * 5000,
            1000 + Math.random() * 5000,
            0, 0, 0, 0,
            'OPEN'
          );
        }
        
        // 1-30 days past due
        for (let i = 1; i <= 15; i++) {
          stmt.run(
            `CUST${(i + 20).toString().padStart(3, '0')}`,
            new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            1000 + Math.random() * 5000,
            0,
            1000 + Math.random() * 5000,
            0, 0, 0,
            'OVERDUE'
          );
        }
        
        // 31-60 days past due
        for (let i = 1; i <= 10; i++) {
          stmt.run(
            `CUST${(i + 35).toString().padStart(3, '0')}`,
            new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            1000 + Math.random() * 5000,
            0, 0,
            1000 + Math.random() * 5000,
            0, 0,
            'OVERDUE'
          );
        }
        
        // 61-90 days past due
        for (let i = 1; i <= 8; i++) {
          stmt.run(
            `CUST${(i + 45).toString().padStart(3, '0')}`,
            new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            1000 + Math.random() * 5000,
            0, 0, 0,
            1000 + Math.random() * 5000,
            0,
            'OVERDUE'
          );
        }
        
        // 90+ days past due
        for (let i = 1; i <= 12; i++) {
          stmt.run(
            `CUST${(i + 53).toString().padStart(3, '0')}`,
            new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            1000 + Math.random() * 5000,
            0, 0, 0, 0,
            1000 + Math.random() * 5000,
            'OVERDUE'
          );
        }
        
        stmt.finalize();
        console.log('Inserted sample data into invoice_hdr table');
        
        // Test the SQL queries
        testArAgingQueries();
      });
    });
  });
}

// Test the AR Aging SQL queries
function testArAgingQueries() {
  console.log('\n--- Testing AR Aging SQL Queries ---');
  
  // Test queries for each aging bucket
  const queries = [
    {
      name: 'Current',
      testSql: 'SELECT SUM(current_due) as value FROM invoice_hdr WHERE current_due > 0',
      productionSql: 'SELECT SUM(current_due) as value FROM invoice_hdr WHERE current_due > 0'
    },
    {
      name: '1-30 Days',
      testSql: 'SELECT SUM(past_due_1_30) as value FROM invoice_hdr WHERE past_due_1_30 > 0',
      productionSql: 'SELECT SUM(past_due_1_30) as value FROM invoice_hdr WHERE past_due_1_30 > 0'
    },
    {
      name: '31-60 Days',
      testSql: 'SELECT SUM(past_due_31_60) as value FROM invoice_hdr WHERE past_due_31_60 > 0',
      productionSql: 'SELECT SUM(past_due_31_60) as value FROM invoice_hdr WHERE past_due_31_60 > 0'
    },
    {
      name: '61-90 Days',
      testSql: 'SELECT SUM(past_due_61_90) as value FROM invoice_hdr WHERE past_due_61_90 > 0',
      productionSql: 'SELECT SUM(past_due_61_90) as value FROM invoice_hdr WHERE past_due_61_90 > 0'
    },
    {
      name: '90+ Days',
      testSql: 'SELECT SUM(past_due_over_90) as value FROM invoice_hdr WHERE past_due_over_90 > 0',
      productionSql: 'SELECT SUM(past_due_over_90) as value FROM invoice_hdr WHERE past_due_over_90 > 0'
    }
  ];
  
  let completedQueries = 0;
  
  queries.forEach(query => {
    db.get(query.testSql, (err, result) => {
      if (err) {
        console.error(`Error executing ${query.name} query:`, err.message);
      } else {
        console.log(`${query.name}: ${result ? result.value : 'No result'}`);
      }
      
      completedQueries++;
      if (completedQueries === queries.length) {
        // Update the database with the new SQL expressions
        updateDatabase(queries);
      }
    });
  });
}

// Update the database with the new SQL expressions
function updateDatabase(queries) {
  console.log('\n--- Updating Database with New SQL Expressions ---');
  
  // Get the current rows from the chart_data table
  db.all("SELECT * FROM chart_data WHERE chart_group = 'AR Aging'", (err, rows) => {
    if (err) {
      console.error('Error getting AR Aging rows:', err.message);
      closeDb();
      return;
    }
    
    console.log(`Found ${rows.length} AR Aging rows in the database`);
    
    // Start a transaction
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Error beginning transaction:', err.message);
        closeDb();
        return;
      }
      
      let updatedRows = 0;
      
      // Update each row with the new SQL expressions
      rows.forEach(row => {
        const query = queries.find(q => q.name === row.variable_name);
        if (!query) {
          console.log(`No query found for variable ${row.variable_name}`);
          return;
        }
        
        db.run(`
          UPDATE chart_data
          SET sql_expression = ?,
              production_sql_expression = ?,
              tableName = ?
          WHERE id = ?
        `, [
          query.testSql,
          query.productionSql,
          'invoice_hdr',
          row.id
        ], function(err) {
          if (err) {
            console.error(`Error updating row ${row.id}:`, err.message);
            db.run('ROLLBACK');
            closeDb();
            return;
          }
          
          updatedRows++;
          console.log(`Updated row ${row.id} (${row.variable_name})`);
          
          if (updatedRows === rows.length) {
            // Commit the transaction
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err.message);
                db.run('ROLLBACK');
                closeDb();
                return;
              }
              
              console.log('Transaction committed');
              console.log(`Successfully updated ${updatedRows} rows`);
              
              // Verify the changes
              verifyChanges();
            });
          }
        });
      });
    });
  });
}

// Verify the changes
function verifyChanges() {
  console.log('\n--- Verifying Changes ---');
  
  db.all("SELECT id, variable_name, sql_expression, production_sql_expression, tableName FROM chart_data WHERE chart_group = 'AR Aging'", (err, rows) => {
    if (err) {
      console.error('Error verifying changes:', err.message);
      closeDb();
      return;
    }
    
    console.log('Updated AR Aging rows:');
    rows.forEach(row => {
      console.log(`- ${row.id} (${row.variable_name}):`);
      console.log(`  Table: ${row.tableName}`);
      console.log(`  Test SQL: ${row.sql_expression}`);
      console.log(`  Production SQL: ${row.production_sql_expression}`);
    });
    
    closeDb();
  });
}

// Close the database
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}
