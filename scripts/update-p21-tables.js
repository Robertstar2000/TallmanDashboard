// Script to update P21 table names in the admin database
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

// Table mapping for common P21 tables
const p21TableMapping = {
  'orders': 'oe_hdr',
  'order_lines': 'oe_line',
  'invoices': 'invoice_hdr',
  'invoice_lines': 'invoice_line',
  'inventory': 'inv_mast',
  'inventory_locations': 'inv_loc',
  'customers': 'customer',
  'vendors': 'vendor',
  'salesreps': 'salesrep',
  'products': 'inv_mast'
};

// Additional P21 tables with their correct names
const additionalP21Tables = {
  'oe_hdr': 'oe_hdr',
  'oe_line': 'oe_line',
  'oe_hdr_salesrep': 'oe_hdr_salesrep',
  'oe_line_salesrep': 'oe_line_salesrep',
  'oe_hdr_notepad': 'oe_hdr_notepad',
  'oe_line_notepad': 'oe_line_notepad',
  'oe_line_schedule': 'oe_line_schedule',
  'oe_line_serial': 'oe_line_serial',
  'oe_line_lot': 'oe_line_lot',
  'oe_hdr_status': 'oe_hdr_status',
  'oe_contacts_customer': 'oe_contacts_customer',
  'invoice_hdr': 'invoice_hdr',
  'invoice_line': 'invoice_line',
  'invoice_hdr_salesrep': 'invoice_hdr_salesrep',
  'invoice_line_salesrep': 'invoice_line_salesrep',
  'invoice_hdr_notepad': 'invoice_hdr_notepad',
  'invoice_line_notepad': 'invoice_line_notepad',
  'invoice_line_taxes': 'invoice_line_taxes',
  'invoice_batch': 'invoice_batch',
  'inv_mast': 'inv_mast',
  'inv_loc': 'inv_loc',
  'inv_lot': 'inv_lot',
  'inv_serial': 'inv_serial',
  'inv_tran': 'inv_tran',
  'inv_bin': 'inv_bin',
  'inv_xref': 'inv_xref',
  'inv_on_hand': 'inv_on_hand',
  'inv_period_usage': 'inv_period_usage',
  'inv_sub': 'inv_sub',
  'customer': 'customer',
  'customer_notepad': 'customer_notepad',
  'customer_ship_to': 'customer_ship_to',
  'customer_contact': 'customer_contact',
  'customer_class': 'customer_class',
  'customer_order_history': 'customer_order_history',
  'customer_oe_info': 'customer_oe_info',
  'vendor': 'vendor',
  'vendor_notepad': 'vendor_notepad',
  'vendor_contact': 'vendor_contact',
  'vendor_class': 'vendor_class',
  'vendor_item': 'vendor_item',
  'vendor_address': 'vendor_address'
};

// Combine all table mappings
const allTableMappings = { ...p21TableMapping, ...additionalP21Tables };

// Function to update P21 table names
function updateP21TableNames() {
  console.log('Updating P21 table names in admin database...');

  // Get all admin variables
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
      // Skip if no SQL expression
      if (!row.sql_expression) {
        console.log(`Skipping variable ${row.id}: No SQL expression`);
        completed++;
        checkCompletion(completed, rows.length);
        continue;
      }
      
      // Extract table name from SQL expression
      const fromMatch = row.sql_expression.match(/FROM\s+(\w+)/i);
      if (!fromMatch || !fromMatch[1]) {
        console.log(`Skipping variable ${row.id}: Could not extract table name from SQL expression`);
        completed++;
        checkCompletion(completed, rows.length);
        continue;
      }
      
      const currentTableName = fromMatch[1];
      const correctTableName = allTableMappings[currentTableName.toLowerCase()] || currentTableName;
      
      // Update the table name in the database
      db.run('UPDATE admin_variables SET table_name = ? WHERE id = ?', 
        [correctTableName, row.id], 
        function(err) {
          if (err) {
            console.error(`Error updating table_name for variable ${row.id}:`, err.message);
            completed++;
            checkCompletion(completed, rows.length);
            return;
          }
          
          // Update the SQL expression to use the correct table name
          const updatedSqlExpression = row.sql_expression.replace(
            new RegExp(`FROM\\s+${currentTableName}`, 'i'),
            `FROM ${correctTableName}`
          );
          
          db.run('UPDATE admin_variables SET sql_expression = ? WHERE id = ?', 
            [updatedSqlExpression, row.id], 
            function(err) {
              if (err) {
                console.error(`Error updating sql_expression for variable ${row.id}:`, err.message);
              } else {
                console.log(`Updated variable ${row.id}: Table name changed from ${currentTableName} to ${correctTableName}`);
              }
              
              completed++;
              checkCompletion(completed, rows.length);
            }
          );
        }
      );
    }
  });
}

// Check if all updates are completed
function checkCompletion(completed, total) {
  if (completed >= total) {
    console.log('P21 table names update completed successfully.');
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
updateP21TableNames();
