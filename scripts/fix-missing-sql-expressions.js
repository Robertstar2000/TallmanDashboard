/**
 * Script to fix missing SQL expressions in the database
 * This script identifies all rows with "number" as production_sql_expression
 * and updates them with proper SQL expressions based on chart group and variable name
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the database file
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');

// Function to generate proper SQL expression based on chart group and variable name
function generateSqlExpression(chartGroup, variableName, serverName) {
  // Default to P21 if serverName is empty
  const isP21 = !serverName || serverName.toUpperCase() === 'P21';
  
  // SQL expressions for P21 (SQL Server)
  if (isP21) {
    switch (chartGroup) {
      case 'Key Metrics':
        switch (variableName) {
          case 'total_orders':
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())";
          case 'open_orders':
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'";
          case 'open_orders_2':
            return "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'";
          case 'daily_revenue':
            return "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))";
          case 'open_invoices':
            return "SELECT COUNT(*) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())";
          case 'orders_backlogged':
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())";
          case 'total_sales_monthly':
            return "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())";
          default:
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)";
        }
      
      case 'Accounts Data':
        switch (variableName) {
          case 'payable':
            return "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.apinv_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())";
          case 'receivable':
            return "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())";
          case 'overdue':
            return "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date < DATEADD(day, -30, GETDATE()) AND paid = 'N'";
          default:
            return "SELECT COUNT(*) as value FROM dbo.invoice_hdr WITH (NOLOCK)";
        }
      
      case 'Historical Data':
        switch (variableName) {
          case 'p21':
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = MONTH(GETDATE()) AND YEAR(order_date) = YEAR(GETDATE())";
          case 'por':
            return "SELECT 0 as value"; // This would be handled by POR database
          case 'combined':
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = MONTH(GETDATE()) AND YEAR(order_date) = YEAR(GETDATE())";
          case 'value_1':
            return "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE MONTH(h.order_date) = MONTH(GETDATE()) AND YEAR(h.order_date) = YEAR(GETDATE())";
          case 'value_2':
            return "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE MONTH(h.order_date) = MONTH(DATEADD(month, -1, GETDATE())) AND YEAR(h.order_date) = YEAR(DATEADD(month, -1, GETDATE()))";
          case 'value_3':
            return "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE MONTH(h.order_date) = MONTH(DATEADD(month, -2, GETDATE())) AND YEAR(h.order_date) = YEAR(DATEADD(month, -2, GETDATE()))";
          default:
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = MONTH(GETDATE()) AND YEAR(order_date) = YEAR(GETDATE())";
        }
      
      case 'Customer Metrics':
        switch (variableName) {
          case 'new_customers':
            return "SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = MONTH(GETDATE()) AND YEAR(date_created) = YEAR(GETDATE())";
          case 'returning_customers':
            return "SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE last_sale_date >= DATEADD(month, -1, GETDATE()) AND date_created < DATEADD(month, -1, GETDATE())";
          default:
            return "SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK)";
        }
      
      case 'Inventory':
        switch (variableName) {
          case 'in_stock':
            return "SELECT ISNULL(SUM(qty_on_hand), 0) as value FROM dbo.inv_mast WITH (NOLOCK)";
          case 'on_order':
            return "SELECT ISNULL(SUM(qty_on_po), 0) as value FROM dbo.inv_mast WITH (NOLOCK)";
          default:
            return "SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK)";
        }
      
      case 'Site Distribution':
        switch (variableName) {
          case 'columbus':
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '101' AND completed = 'N'";
          case 'addison':
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '100' AND completed = 'N'";
          case 'lake_city':
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '107' AND completed = 'N'";
          default:
            return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'";
        }
      
      case 'AR Aging':
        switch (variableName) {
          case 'current':
            return "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(day, -30, GETDATE()) AND paid = 'N'";
          case 'days_1_30':
            return "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date BETWEEN DATEADD(day, -60, GETDATE()) AND DATEADD(day, -31, GETDATE()) AND paid = 'N'";
          case 'days_31_60':
            return "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date BETWEEN DATEADD(day, -90, GETDATE()) AND DATEADD(day, -61, GETDATE()) AND paid = 'N'";
          case 'days_61_90':
            return "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date BETWEEN DATEADD(day, -120, GETDATE()) AND DATEADD(day, -91, GETDATE()) AND paid = 'N'";
          case 'days_90_plus':
            return "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date < DATEADD(day, -120, GETDATE()) AND paid = 'N'";
          default:
            return "SELECT ISNULL(SUM(amount), 0) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE paid = 'N'";
        }
      
      case 'Daily Orders':
        return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))";
      
      case 'Web Orders':
        return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = MONTH(GETDATE()) AND YEAR(order_date) = YEAR(GETDATE()) AND order_source = 'WEB'";
      
      default:
        return "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)";
    }
  } 
  // SQL expressions for POR (MS Access/Jet SQL)
  else {
    switch (chartGroup) {
      case 'POR Overview':
        switch (variableName) {
          case 'new_rentals':
            return "SELECT Count(*) as value FROM [Rentals] WHERE DatePart('m', [RentalDate]) = DatePart('m', Now()) AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())";
          case 'open_rentals':
            return "SELECT Count(*) as value FROM [Rentals] WHERE [Status] = 'Open'";
          case 'rental_value':
            return "SELECT Sum(Nz([TotalAmount], 0)) as value FROM [Rentals] WHERE DatePart('m', [RentalDate]) = DatePart('m', Now()) AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())";
          default:
            return "SELECT Count(*) as value FROM [Rentals]";
        }
      
      case 'Historical Data':
        if (variableName === 'por') {
          return "SELECT Count(*) as value FROM [Rentals] WHERE DatePart('m', [RentalDate]) = DatePart('m', Now()) AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())";
        }
        return "SELECT Count(*) as value FROM [Rentals]";
      
      default:
        return "SELECT Count(*) as value FROM [Rentals]";
    }
  }
}

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the dashboard database.');
});

// Get all rows with missing SQL expressions
db.all("SELECT id, chart_group, variable_name, server_name FROM chart_data WHERE production_sql_expression = 'number'", [], (err, rows) => {
  if (err) {
    console.error('Error querying database:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log(`Found ${rows.length} rows with missing SQL expressions.`);
  
  // Begin transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Error starting transaction:', err.message);
      db.close();
      process.exit(1);
    }
    
    let updateCount = 0;
    let errorCount = 0;
    
    // Process each row
    rows.forEach((row) => {
      const sqlExpression = generateSqlExpression(row.chart_group, row.variable_name, row.server_name);
      
      // Update the row with the new SQL expression
      db.run(
        "UPDATE chart_data SET production_sql_expression = ? WHERE id = ?",
        [sqlExpression, row.id],
        function(err) {
          if (err) {
            console.error(`Error updating row ${row.id}:`, err.message);
            errorCount++;
          } else {
            console.log(`Updated row ${row.id} (${row.chart_group} - ${row.variable_name}) with SQL expression.`);
            updateCount++;
          }
          
          // Check if all updates are complete
          if (updateCount + errorCount === rows.length) {
            // Commit or rollback transaction
            if (errorCount === 0) {
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('Error committing transaction:', err.message);
                  db.run('ROLLBACK');
                } else {
                  console.log(`Successfully updated ${updateCount} rows with SQL expressions.`);
                }
                db.close();
              });
            } else {
              console.error(`Encountered ${errorCount} errors. Rolling back transaction.`);
              db.run('ROLLBACK', () => {
                db.close();
              });
            }
          }
        }
      );
    });
  });
});

// Also update the single-source-data.ts file
const singleSourceDataPath = path.join(__dirname, '..', 'lib', 'db', 'single-source-data.ts');

fs.readFile(singleSourceDataPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading single-source-data.ts:', err.message);
    return;
  }
  
  // Create a backup of the original file
  fs.writeFile(`${singleSourceDataPath}.bak`, data, (err) => {
    if (err) {
      console.error('Error creating backup file:', err.message);
    } else {
      console.log('Created backup of single-source-data.ts');
    }
  });
  
  // Parse the dashboardData array
  const dashboardDataMatch = data.match(/export const dashboardData: SpreadsheetRow\[\] = \[([\s\S]*?)\];/);
  
  if (!dashboardDataMatch) {
    console.error('Could not find dashboardData array in single-source-data.ts');
    return;
  }
  
  const dashboardDataString = dashboardDataMatch[1];
  
  // Split into individual row objects
  const rowStrings = dashboardDataString.split('},');
  
  // Process each row
  const updatedRowStrings = rowStrings.map((rowString) => {
    // Check if this row has a missing SQL expression
    if (rowString.includes('"productionSqlExpression": "number"')) {
      // Extract chart group, variable name, and server name
      const chartGroupMatch = rowString.match(/"chartGroup":\s*"([^"]*)"/);
      const variableNameMatch = rowString.match(/"variableName":\s*"([^"]*)"/);
      const serverNameMatch = rowString.match(/"serverName":\s*"([^"]*)"/);
      
      if (chartGroupMatch && variableNameMatch) {
        const chartGroup = chartGroupMatch[1];
        const variableName = variableNameMatch[1];
        const serverName = serverNameMatch ? serverNameMatch[1] : '';
        
        // Generate SQL expression
        const sqlExpression = generateSqlExpression(chartGroup, variableName, serverName);
        
        // Replace the "number" with the actual SQL expression
        return rowString.replace(
          '"productionSqlExpression": "number"',
          `"productionSqlExpression": ${JSON.stringify(sqlExpression)}`
        );
      }
    }
    
    return rowString;
  });
  
  // Reconstruct the file content
  const updatedDashboardDataString = updatedRowStrings.join('},');
  const updatedData = data.replace(dashboardDataString, updatedDashboardDataString);
  
  // Write the updated file
  fs.writeFile(singleSourceDataPath, updatedData, (err) => {
    if (err) {
      console.error('Error writing updated single-source-data.ts:', err.message);
    } else {
      console.log('Successfully updated single-source-data.ts with SQL expressions');
    }
  });
});

console.log('Script execution started. Please wait for completion...');
