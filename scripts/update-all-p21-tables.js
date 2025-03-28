// Script to update all P21 rows in the admin database with correct table names and SQL expressions
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

// Define mappings for P21 tables and SQL expressions
const p21TableMappings = {
  // Order-related tables
  'oe_hdr': {
    tableName: 'oe_hdr',
    sqlExpressionTemplates: [
      // Count queries
      'SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK)',
      // Sum queries
      'SELECT ISNULL(SUM(order_amt), 0) FROM dbo.oe_hdr WITH (NOLOCK)',
      // Average queries
      'SELECT ISNULL(AVG(order_amt), 0) FROM dbo.oe_hdr WITH (NOLOCK)',
      // Monthly queries
      'SELECT ISNULL(SUM(order_amt), 0) FROM dbo.oe_hdr WITH (NOLOCK) WHERE FORMAT(order_date, \'yyyy-MM\') = FORMAT(DATEADD(month, {monthOffset}, GETDATE()), \'yyyy-MM\')',
      'SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE FORMAT(order_date, \'yyyy-MM\') = FORMAT(DATEADD(month, {monthOffset}, GETDATE()), \'yyyy-MM\')'
    ]
  },
  'oe_line': {
    tableName: 'oe_line',
    sqlExpressionTemplates: [
      'SELECT COUNT(*) FROM dbo.oe_line WITH (NOLOCK)',
      'SELECT ISNULL(SUM(extended_amt), 0) FROM dbo.oe_line WITH (NOLOCK)',
      'SELECT ISNULL(AVG(extended_amt), 0) FROM dbo.oe_line WITH (NOLOCK)',
      'SELECT ISNULL(SUM(extended_amt), 0) FROM dbo.oe_line WITH (NOLOCK) WHERE FORMAT(promise_date, \'yyyy-MM\') = FORMAT(DATEADD(month, {monthOffset}, GETDATE()), \'yyyy-MM\')'
    ]
  },
  // Invoice-related tables
  'invoice_hdr': {
    tableName: 'invoice_hdr',
    sqlExpressionTemplates: [
      'SELECT COUNT(*) FROM dbo.invoice_hdr WITH (NOLOCK)',
      'SELECT ISNULL(SUM(invoice_amt), 0) FROM dbo.invoice_hdr WITH (NOLOCK)',
      'SELECT ISNULL(AVG(invoice_amt), 0) FROM dbo.invoice_hdr WITH (NOLOCK)',
      'SELECT ISNULL(SUM(invoice_amt), 0) FROM dbo.invoice_hdr WITH (NOLOCK) WHERE FORMAT(invoice_date, \'yyyy-MM\') = FORMAT(DATEADD(month, {monthOffset}, GETDATE()), \'yyyy-MM\')',
      'SELECT COUNT(*) FROM dbo.invoice_hdr WITH (NOLOCK) WHERE FORMAT(invoice_date, \'yyyy-MM\') = FORMAT(DATEADD(month, {monthOffset}, GETDATE()), \'yyyy-MM\')'
    ]
  },
  'invoice_line': {
    tableName: 'invoice_line',
    sqlExpressionTemplates: [
      'SELECT COUNT(*) FROM dbo.invoice_line WITH (NOLOCK)',
      'SELECT ISNULL(SUM(extended_amt), 0) FROM dbo.invoice_line WITH (NOLOCK)',
      'SELECT ISNULL(AVG(extended_amt), 0) FROM dbo.invoice_line WITH (NOLOCK)',
      'SELECT ISNULL(SUM(extended_amt), 0) FROM dbo.invoice_line WITH (NOLOCK) WHERE FORMAT(invoice_date, \'yyyy-MM\') = FORMAT(DATEADD(month, {monthOffset}, GETDATE()), \'yyyy-MM\')'
    ]
  },
  // Inventory-related tables
  'inv_mast': {
    tableName: 'inv_mast',
    sqlExpressionTemplates: [
      'SELECT COUNT(*) FROM dbo.inv_mast WITH (NOLOCK)',
      'SELECT COUNT(*) FROM dbo.inv_mast WITH (NOLOCK) WHERE status = \'A\''
    ]
  },
  'inv_loc': {
    tableName: 'inv_loc',
    sqlExpressionTemplates: [
      'SELECT COUNT(*) FROM dbo.inv_loc WITH (NOLOCK)',
      'SELECT ISNULL(SUM(qty_on_hand), 0) FROM dbo.inv_loc WITH (NOLOCK)',
      'SELECT ISNULL(SUM(qty_on_hand * unit_cost), 0) FROM dbo.inv_loc WITH (NOLOCK)'
    ]
  },
  // Customer-related tables
  'customer': {
    tableName: 'customer',
    sqlExpressionTemplates: [
      'SELECT COUNT(*) FROM dbo.customer WITH (NOLOCK)',
      'SELECT COUNT(*) FROM dbo.customer WITH (NOLOCK) WHERE status = \'A\''
    ]
  },
  // Default fallback
  'default': {
    tableName: 'oe_hdr',
    sqlExpressionTemplates: [
      'SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK)',
      'SELECT ISNULL(SUM(order_amt), 0) FROM dbo.oe_hdr WITH (NOLOCK)'
    ]
  }
};

// Function to get a SQL expression template based on the row's name and timeframe
function getSqlExpressionForRow(row) {
  // Get the mapping for the table
  const tableMapping = p21TableMappings[row.table_name] || p21TableMappings.default;
  
  // Check if this is a historical data row with a timeframe
  if (row.timeframe && row.timeframe.toLowerCase().includes('month')) {
    // Extract the month number from the timeframe
    const monthMatch = row.timeframe.match(/Month\s+(\d+)/i);
    const monthNumber = monthMatch ? parseInt(monthMatch[1], 10) : 1;
    
    // Calculate the month offset (Month 1 = 0, Month 2 = -1, etc.)
    const monthOffset = monthNumber === 1 ? 0 : -(monthNumber - 1);
    
    // Find a template that includes a month offset
    const monthlyTemplate = tableMapping.sqlExpressionTemplates.find(template => 
      template.includes('{monthOffset}')
    );
    
    if (monthlyTemplate) {
      return monthlyTemplate.replace('{monthOffset}', monthOffset);
    }
  }
  
  // For non-monthly data or if no monthly template is found
  // Choose a template based on the row name
  const rowName = row.name.toLowerCase();
  
  if (rowName.includes('count') || rowName.includes('total') || rowName.includes('number')) {
    return tableMapping.sqlExpressionTemplates.find(template => template.includes('COUNT(*)')) || tableMapping.sqlExpressionTemplates[0];
  }
  
  if (rowName.includes('sum') || rowName.includes('value') || rowName.includes('amount')) {
    return tableMapping.sqlExpressionTemplates.find(template => template.includes('SUM(')) || tableMapping.sqlExpressionTemplates[0];
  }
  
  if (rowName.includes('average') || rowName.includes('avg')) {
    return tableMapping.sqlExpressionTemplates.find(template => template.includes('AVG(')) || tableMapping.sqlExpressionTemplates[0];
  }
  
  // Default to the first template
  return tableMapping.sqlExpressionTemplates[0];
}

// Function to update all P21 rows
function updateAllP21Rows() {
  console.log('Updating all P21 rows in admin database...');

  // Get all rows where server_name is P21
  db.all('SELECT * FROM admin_variables WHERE server_name = "P21"', [], (err, rows) => {
    if (err) {
      console.error('Error querying admin_variables:', err.message);
      closeDb();
      return;
    }

    if (!rows || rows.length === 0) {
      console.log('No P21 rows found in the admin database.');
      closeDb();
      return;
    }

    console.log(`Found ${rows.length} P21 rows to update.`);
    
    // Process each row
    let completed = 0;
    
    for (const row of rows) {
      // Determine the appropriate table name based on the row's name or current table name
      let tableName = row.table_name;
      
      // If the table name is missing or is 'historical_data', assign a default table
      if (!tableName || tableName === 'historical_data') {
        // Try to determine the appropriate table from the row name
        const rowName = row.name.toLowerCase();
        
        if (rowName.includes('order')) {
          tableName = 'oe_hdr';
        } else if (rowName.includes('invoice')) {
          tableName = 'invoice_hdr';
        } else if (rowName.includes('inventory') || rowName.includes('item')) {
          tableName = 'inv_mast';
        } else if (rowName.includes('customer')) {
          tableName = 'customer';
        } else {
          // Default to oe_hdr for historical data
          tableName = 'oe_hdr';
        }
      }
      
      // Ensure the table name is valid
      tableName = p21TableMappings[tableName] ? tableName : 'oe_hdr';
      
      // Update the table name
      db.run('UPDATE admin_variables SET table_name = ? WHERE id = ?', 
        [tableName, row.id], 
        function(err) {
          if (err) {
            console.error(`Error updating table_name for row ${row.id}:`, err.message);
            completed++;
            checkCompletion(completed, rows.length);
            return;
          }
          
          // Get the appropriate SQL expression for this row
          const sqlExpression = getSqlExpressionForRow({...row, table_name: tableName});
          
          // Update the production_sql_expression
          db.run('UPDATE admin_variables SET production_sql_expression = ? WHERE id = ?', 
            [sqlExpression, row.id], 
            function(err) {
              if (err) {
                console.error(`Error updating production_sql_expression for row ${row.id}:`, err.message);
                completed++;
                checkCompletion(completed, rows.length);
                return;
              }
              
              console.log(`Updated row ${row.id} (${row.name}): Set table_name to ${tableName} and updated production_sql_expression`);
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
    console.log('All P21 rows update completed successfully.');
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
updateAllP21Rows();
