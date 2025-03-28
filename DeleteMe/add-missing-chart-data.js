// Script to add missing chart data rows with proper chart names and chart groups
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Define chart categories and their expected data points based on the architecture documentation
const chartCategories = [
  {
    name: 'Key Metrics',
    group: 'Key Metrics',
    variables: ['Total Orders', 'Daily Revenue', 'Open Invoices', 'Orders Backlogged', 'Total Monthly Sales', 'Monthly Growth', 'Quarterly Performance'],
    expectedCount: 7
  },
  {
    name: 'Site Distribution',
    group: 'Site Distribution',
    variables: ['Columbus', 'Addison', 'Lake City'],
    expectedCount: 3
  },
  {
    name: 'Accounts',
    group: 'Accounts',
    variables: ['Payable', 'Receivable', 'Overdue'],
    monthlyData: true,
    expectedCount: 36 // 3 variables × 12 months
  },
  {
    name: 'Customer Metrics',
    group: 'Customer Metrics',
    variables: ['New Customers', 'Prospects'],
    monthlyData: true,
    expectedCount: 24 // 2 variables × 12 months
  },
  {
    name: 'Historical Data',
    group: 'Historical Data',
    variables: ['Sales', 'Orders'],
    monthlyData: true,
    expectedCount: 24 // 2 variables × 12 months
  },
  {
    name: 'Inventory',
    group: 'Inventory',
    variables: ['In Stock', 'Turnover'],
    monthlyData: true,
    expectedCount: 24 // 2 variables × 12 months
  },
  {
    name: 'POR Overview',
    group: 'POR Overview',
    variables: ['New Rentals', 'Open Rentals', 'Rental Value'],
    monthlyData: true,
    expectedCount: 36 // 3 variables × 12 months
  },
  {
    name: 'Open Orders',
    group: 'Open Orders',
    variables: ['Open Orders'],
    monthlyData: true,
    expectedCount: 12 // 1 variable × 12 months
  },
  {
    name: 'Daily Orders',
    group: 'Daily Orders',
    variables: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    expectedCount: 7 // 1 variable × 7 days
  },
  {
    name: 'AR Aging',
    group: 'AR Aging',
    variables: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
    expectedCount: 5 // 5 aging categories
  }
];

// Path to the SQLite database
const dbPath = path.join(__dirname, 'dashboard.db');

try {
  // Connect to the database
  const db = new Database(dbPath);
  
  console.log('Connected to database:', dbPath);
  
  // Begin transaction
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    // Get existing chart data rows
    const existingRows = db.prepare('SELECT * FROM chart_data').all();
    console.log(`Found ${existingRows.length} existing chart data rows`);
    
    // Group existing rows by chart name
    const existingByChartName = {};
    existingRows.forEach(row => {
      if (!existingByChartName[row.chart_name]) {
        existingByChartName[row.chart_name] = [];
      }
      existingByChartName[row.chart_name].push(row);
    });
    
    // Get the highest existing ID
    let maxId = 0;
    existingRows.forEach(row => {
      const id = parseInt(row.id);
      if (!isNaN(id) && id > maxId) {
        maxId = id;
      }
    });
    
    // Insert statement for new chart data rows
    const insertChartData = db.prepare(`
      INSERT INTO chart_data (
        id, 
        chart_name, 
        chart_group, 
        variable_name, 
        server_name, 
        db_table_name, 
        sql_expression, 
        production_sql_expression, 
        value, 
        transformer, 
        last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    // Track added rows
    let addedRows = 0;
    
    // Process each chart category
    for (const category of chartCategories) {
      const existingForCategory = existingByChartName[category.name] || [];
      console.log(`${category.name}: Found ${existingForCategory.length} of ${category.expectedCount} expected rows`);
      
      // If we have fewer rows than expected, add the missing ones
      if (existingForCategory.length < category.expectedCount) {
        // Track which variables we already have
        const existingVariables = new Set();
        existingForCategory.forEach(row => {
          existingVariables.add(row.variable_name);
        });
        
        // Add missing variables
        for (const variable of category.variables) {
          if (category.monthlyData) {
            // For monthly data, add 12 months for each variable
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            for (const month of months) {
              const variableName = `${variable} ${month}`;
              
              // Check if this variable-month combination already exists
              if (!existingForCategory.some(row => row.variable_name === variableName)) {
                maxId++;
                
                // Default SQL expression based on category and variable
                let sqlExpression = `SELECT COUNT(*) FROM ${category.name.toLowerCase().replace(/\s+/g, '_')} WHERE month = '${month}'`;
                let tableName = category.name.toLowerCase().replace(/\s+/g, '_');
                let serverName = 'P21';
                
                // Customize SQL based on category
                if (category.name === 'Accounts') {
                  if (variable === 'Payable') {
                    sqlExpression = `SELECT SUM(amount) FROM accounts_payable WHERE month = '${month}'`;
                    tableName = 'accounts_payable';
                  } else if (variable === 'Receivable') {
                    sqlExpression = `SELECT SUM(amount) FROM accounts_receivable WHERE month = '${month}'`;
                    tableName = 'accounts_receivable';
                  } else if (variable === 'Overdue') {
                    sqlExpression = `SELECT SUM(amount) FROM accounts_overdue WHERE month = '${month}'`;
                    tableName = 'accounts_overdue';
                  }
                } else if (category.name === 'POR Overview') {
                  serverName = 'POR';
                  tableName = 'por_data';
                  if (variable === 'New Rentals') {
                    sqlExpression = `SELECT COUNT(*) FROM por_rentals WHERE status = 'new' AND month = '${month}'`;
                  } else if (variable === 'Open Rentals') {
                    sqlExpression = `SELECT COUNT(*) FROM por_rentals WHERE status = 'open' AND month = '${month}'`;
                  } else if (variable === 'Rental Value') {
                    sqlExpression = `SELECT SUM(value) FROM por_rentals WHERE month = '${month}'`;
                  }
                }
                
                // Insert the new row
                insertChartData.run(
                  maxId.toString(),
                  category.name,
                  category.group,
                  variableName,
                  serverName,
                  tableName,
                  sqlExpression,
                  sqlExpression, // Use same SQL for production
                  Math.floor(Math.random() * 900 + 100).toString(), // Random value between 100-999
                  'number', // Default transformer
                );
                
                addedRows++;
              }
            }
          } else {
            // For non-monthly data, just add the variable if it doesn't exist
            if (!existingForCategory.some(row => row.variable_name === variable)) {
              maxId++;
              
              // Default SQL expression based on category and variable
              let sqlExpression = `SELECT COUNT(*) FROM ${category.name.toLowerCase().replace(/\s+/g, '_')} WHERE variable = '${variable}'`;
              let tableName = category.name.toLowerCase().replace(/\s+/g, '_');
              let serverName = 'P21';
              
              // Customize SQL based on category
              if (category.name === 'Key Metrics') {
                if (variable === 'Total Orders') {
                  sqlExpression = 'SELECT COUNT(*) FROM orders';
                  tableName = 'orders';
                } else if (variable === 'Daily Revenue') {
                  sqlExpression = 'SELECT SUM(amount) FROM orders WHERE date = CURRENT_DATE';
                  tableName = 'orders';
                } else if (variable === 'Open Invoices') {
                  sqlExpression = 'SELECT COUNT(*) FROM invoices WHERE status = "open"';
                  tableName = 'invoices';
                }
              } else if (category.name === 'Site Distribution') {
                if (variable === 'Columbus') {
                  sqlExpression = 'SELECT COUNT(*) FROM inventory WHERE location = "Columbus"';
                  tableName = 'inventory';
                } else if (variable === 'Addison') {
                  sqlExpression = 'SELECT COUNT(*) FROM inventory WHERE location = "Addison"';
                  tableName = 'inventory';
                } else if (variable === 'Lake City') {
                  sqlExpression = 'SELECT COUNT(*) FROM inventory WHERE location = "Lake City"';
                  tableName = 'inventory';
                }
              } else if (category.name === 'Daily Orders') {
                sqlExpression = `SELECT COUNT(*) FROM orders WHERE DAYNAME(date) = '${variable}'`;
                tableName = 'orders';
              } else if (category.name === 'AR Aging') {
                tableName = 'ar_aging';
                if (variable === 'Current') {
                  sqlExpression = 'SELECT SUM(amount) FROM ar_aging WHERE days_overdue = 0';
                } else if (variable === '1-30 Days') {
                  sqlExpression = 'SELECT SUM(amount) FROM ar_aging WHERE days_overdue BETWEEN 1 AND 30';
                } else if (variable === '31-60 Days') {
                  sqlExpression = 'SELECT SUM(amount) FROM ar_aging WHERE days_overdue BETWEEN 31 AND 60';
                } else if (variable === '61-90 Days') {
                  sqlExpression = 'SELECT SUM(amount) FROM ar_aging WHERE days_overdue BETWEEN 61 AND 90';
                } else if (variable === '90+ Days') {
                  sqlExpression = 'SELECT SUM(amount) FROM ar_aging WHERE days_overdue > 90';
                }
              }
              
              // Insert the new row
              insertChartData.run(
                maxId.toString(),
                category.name,
                category.group,
                variable,
                serverName,
                tableName,
                sqlExpression,
                sqlExpression, // Use same SQL for production
                Math.floor(Math.random() * 900 + 100).toString(), // Random value between 100-999
                'number', // Default transformer
              );
              
              addedRows++;
            }
          }
        }
      }
    }
    
    // Commit the transaction
    db.prepare('COMMIT').run();
    
    console.log(`Added ${addedRows} new chart data rows`);
    console.log('Chart data has been updated with missing rows');
  } catch (error) {
    // Rollback the transaction on error
    db.prepare('ROLLBACK').run();
    console.error('Error adding missing chart data:', error);
  }
  
  // Close the database connection
  db.close();
  
  console.log('Database connection closed');
} catch (error) {
  console.error('Error connecting to database:', error);
}
