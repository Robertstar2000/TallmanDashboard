// Script to set appropriate P21 queries in the admin database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Open the SQLite database
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the dashboard database.');
});

// Define sample P21 queries for different metrics
const p21Queries = [
  {
    name: 'Total Orders',
    sqlExpression: 'SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK)',
    tableName: 'oe_hdr'
  },
  {
    name: 'Open Orders',
    sqlExpression: 'SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_status = \'O\'',
    tableName: 'oe_hdr'
  },
  {
    name: 'Orders This Month',
    sqlExpression: 'SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = MONTH(GETDATE()) AND YEAR(order_date) = YEAR(GETDATE())',
    tableName: 'oe_hdr'
  },
  {
    name: 'Average Order Value',
    sqlExpression: 'SELECT ISNULL(AVG(order_amt), 0) FROM dbo.oe_hdr WITH (NOLOCK)',
    tableName: 'oe_hdr'
  },
  {
    name: 'Total Order Value',
    sqlExpression: 'SELECT ISNULL(SUM(order_amt), 0) FROM dbo.oe_hdr WITH (NOLOCK)',
    tableName: 'oe_hdr'
  },
  {
    name: 'Total Invoices',
    sqlExpression: 'SELECT COUNT(*) FROM dbo.invoice_hdr WITH (NOLOCK)',
    tableName: 'invoice_hdr'
  },
  {
    name: 'Invoices This Month',
    sqlExpression: 'SELECT COUNT(*) FROM dbo.invoice_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())',
    tableName: 'invoice_hdr'
  },
  {
    name: 'Average Invoice Value',
    sqlExpression: 'SELECT ISNULL(AVG(invoice_amt), 0) FROM dbo.invoice_hdr WITH (NOLOCK)',
    tableName: 'invoice_hdr'
  },
  {
    name: 'Total Invoice Value',
    sqlExpression: 'SELECT ISNULL(SUM(invoice_amt), 0) FROM dbo.invoice_hdr WITH (NOLOCK)',
    tableName: 'invoice_hdr'
  },
  {
    name: 'Total Customers',
    sqlExpression: 'SELECT COUNT(*) FROM dbo.customer WITH (NOLOCK)',
    tableName: 'customer'
  },
  {
    name: 'Active Customers',
    sqlExpression: 'SELECT COUNT(*) FROM dbo.customer WITH (NOLOCK) WHERE status = \'A\'',
    tableName: 'customer'
  },
  {
    name: 'Total Inventory Items',
    sqlExpression: 'SELECT COUNT(*) FROM dbo.inv_mast WITH (NOLOCK)',
    tableName: 'inv_mast'
  },
  {
    name: 'Active Inventory Items',
    sqlExpression: 'SELECT COUNT(*) FROM dbo.inv_mast WITH (NOLOCK) WHERE status = \'A\'',
    tableName: 'inv_mast'
  },
  {
    name: 'Total Inventory Value',
    sqlExpression: 'SELECT ISNULL(SUM(unit_cost * qty_on_hand), 0) FROM dbo.inv_loc WITH (NOLOCK)',
    tableName: 'inv_loc'
  },
  {
    name: 'Total Order Lines',
    sqlExpression: 'SELECT COUNT(*) FROM dbo.oe_line WITH (NOLOCK)',
    tableName: 'oe_line'
  },
  {
    name: 'Average Lines Per Order',
    sqlExpression: 'SELECT ISNULL(AVG(line_count), 0) FROM (SELECT oe_hdr_uid, COUNT(*) as line_count FROM dbo.oe_line WITH (NOLOCK) GROUP BY oe_hdr_uid) AS LineCount',
    tableName: 'oe_line'
  }
];

// Function to update P21 queries
function updateP21Queries() {
  console.log('Updating P21 queries in admin database...');

  // Get all admin variables with server_name = P21
  db.all('SELECT * FROM admin_variables WHERE server_name = "P21"', [], (err, rows) => {
    if (err) {
      console.error('Error querying admin_variables:', err.message);
      closeDb();
      return;
    }

    if (!rows || rows.length === 0) {
      console.log('No P21 variables found in the admin database.');
      closeDb();
      return;
    }

    console.log(`Found ${rows.length} P21 variables to update.`);
    
    // Process each variable
    let completed = 0;
    
    for (const row of rows) {
      // Find a matching query from our predefined list
      // Try to match by name first, then by position in the array
      const matchingQuery = p21Queries.find(q => q.name.toLowerCase() === row.name?.toLowerCase()) || 
                           p21Queries[completed % p21Queries.length];
      
      if (matchingQuery) {
        // Update the SQL expression and table name
        db.run(
          'UPDATE admin_variables SET sql_expression = ?, table_name = ? WHERE id = ?', 
          [matchingQuery.sqlExpression, matchingQuery.tableName, row.id], 
          function(err) {
            if (err) {
              console.error(`Error updating variable ${row.id}:`, err.message);
            } else {
              console.log(`Updated variable ${row.id} (${row.name}): Set to use ${matchingQuery.tableName} table`);
            }
            
            completed++;
            checkCompletion(completed, rows.length);
          }
        );
      } else {
        console.log(`Skipping variable ${row.id}: No matching query found`);
        completed++;
        checkCompletion(completed, rows.length);
      }
    }
  });
}

// Check if all updates are completed
function checkCompletion(completed, total) {
  if (completed >= total) {
    console.log('P21 queries update completed successfully.');
    closeDb();
  }
}

// Close the database connection
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
}

// Run the update function
updateP21Queries();
