// Script to fix SQL queries in the admin spreadsheet
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Open the database
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');
const db = new sqlite3.Database(dbPath);

// Fixed SQL queries for P21 database
const fixedP21Queries = [
  {
    id: '1',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK)"
  },
  {
    id: '2',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Open'"
  },
  {
    id: '3',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Pending'"
  },
  {
    id: '4',
    sqlExpression: "SELECT ISNULL(SUM(order_amt), 0) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  {
    id: '5',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE item_status = 'Open'"
  },
  {
    id: '6',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Backlogged'"
  },
  {
    id: '7',
    sqlExpression: "SELECT ISNULL(SUM(order_amt), 0) as value FROM oe_hdr WITH (NOLOCK) WHERE FORMAT(order_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  {
    id: '8',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE location_id = '01' AND order_status = 'Open'"
  },
  {
    id: '9',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE location_id = '02' AND order_status = 'Open'"
  },
  {
    id: '10',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE location_id = '03' AND order_status = 'Open'"
  },
  {
    id: '11',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ap_open_items WITH (NOLOCK) WHERE FORMAT(invoice_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  {
    id: '12',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ap_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 0 AND FORMAT(invoice_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  {
    id: '13',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE FORMAT(invoice_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  {
    id: '14',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ap_open_items WITH (NOLOCK) WHERE FORMAT(invoice_date, 'yyyy-MM') = FORMAT(DATEADD(month, -1, GETDATE()), 'yyyy-MM')"
  },
  {
    id: '15',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE FORMAT(invoice_date, 'yyyy-MM') = FORMAT(DATEADD(month, -1, GETDATE()), 'yyyy-MM')"
  },
  {
    id: '16',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 0 AND FORMAT(invoice_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  {
    id: '17',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 30"
  },
  {
    id: '18',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30"
  },
  {
    id: '19',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60"
  },
  {
    id: '20',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 60"
  },
  {
    id: '21',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Shipped'"
  },
  {
    id: '22',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Invoiced'"
  },
  {
    id: '23',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Cancelled'"
  },
  {
    id: '24',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'On Hold'"
  },
  {
    id: '25',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_status = 'Completed'"
  },
  {
    id: '26',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  {
    id: '27',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  {
    id: '28',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -2, GETDATE()))"
  },
  {
    id: '29',
    sqlExpression: "SELECT COUNT(DISTINCT customer_id) as value FROM oe_hdr WITH (NOLOCK) WHERE FORMAT(order_date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')"
  },
  // Key Metrics - Total Orders (All Time)
  {
    id: '101',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK)"
  },
  // Key Metrics - Total Orders (Current Month)
  {
    id: '102',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE())"
  },
  // Key Metrics - Total Orders (Last 30 Days)
  {
    id: '103',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())"
  },
  // Key Metrics - Total Revenue (All Time)
  {
    id: '104',
    sqlExpression: "SELECT ISNULL(SUM(order_amt), 0) as value FROM oe_hdr WITH (NOLOCK)"
  },
  // Key Metrics - Total Revenue (Current Month)
  {
    id: '105',
    sqlExpression: "SELECT ISNULL(SUM(order_amt), 0) as value FROM oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE())"
  },
  // Key Metrics - Total Revenue (Last 30 Days)
  {
    id: '106',
    sqlExpression: "SELECT ISNULL(SUM(order_amt), 0) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())"
  },
  // Customer Metrics - Total Customers
  {
    id: '201',
    sqlExpression: "SELECT COUNT(DISTINCT customer_id) as value FROM customer WITH (NOLOCK)"
  },
  // Customer Metrics - Active Customers (Last 90 Days)
  {
    id: '202',
    sqlExpression: "SELECT COUNT(DISTINCT customer_id) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -90, GETDATE())"
  },
  // Customer Metrics - New Customers (Current Month)
  {
    id: '203',
    sqlExpression: "SELECT COUNT(*) as value FROM customer WITH (NOLOCK) WHERE YEAR(created_date) = YEAR(GETDATE()) AND MONTH(created_date) = MONTH(GETDATE())"
  },
  // Inventory - Total Items
  {
    id: '301',
    sqlExpression: "SELECT COUNT(*) as value FROM inv_mast WITH (NOLOCK)"
  },
  // Inventory - Items in Stock
  {
    id: '302',
    sqlExpression: "SELECT COUNT(*) as value FROM inv_mast WITH (NOLOCK) WHERE qty_on_hand > 0"
  },
  // Inventory - Total Value
  {
    id: '303',
    sqlExpression: "SELECT ISNULL(SUM(qty_on_hand * avg_cost), 0) as value FROM inv_mast WITH (NOLOCK)"
  },
  // AR Aging - Current
  {
    id: '401',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) <= 0"
  },
  // AR Aging - 1-30 Days
  {
    id: '402',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30"
  },
  // AR Aging - 31-60 Days
  {
    id: '403',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60"
  },
  // AR Aging - 61-90 Days
  {
    id: '404',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 61 AND 90"
  },
  // AR Aging - Over 90 Days
  {
    id: '405',
    sqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 90"
  },
  // Daily Orders - Today
  {
    id: '501',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  // Daily Orders - Yesterday
  {
    id: '502',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  // Daily Orders - 2 Days Ago
  {
    id: '503',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -2, GETDATE()))"
  },
  // Daily Orders - 3 Days Ago
  {
    id: '504',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -3, GETDATE()))"
  },
  // Daily Orders - 4 Days Ago
  {
    id: '505',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -4, GETDATE()))"
  },
  // Daily Orders - 5 Days Ago
  {
    id: '506',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -5, GETDATE()))"
  },
  // Daily Orders - 6 Days Ago
  {
    id: '507',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -6, GETDATE()))"
  },
  // Web Orders - Total
  {
    id: '601',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_source = 'Web'"
  },
  // Web Orders - Current Month
  {
    id: '602',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE())"
  },
  // Web Orders - Last Month
  {
    id: '603',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND YEAR(order_date) = YEAR(DATEADD(month, -1, GETDATE())) AND MONTH(order_date) = MONTH(DATEADD(month, -1, GETDATE()))"
  }
];

// Fixed SQL queries for POR database (MS Access syntax)
const fixedPORQueries = [
  {
    id: '30',
    sqlExpression: "SELECT COUNT(*) as value FROM Orders"
  },
  {
    id: '31',
    sqlExpression: "SELECT COUNT(*) as value FROM Orders WHERE OrderStatus = 'Open'"
  },
  {
    id: '32',
    sqlExpression: "SELECT COUNT(*) as value FROM Orders WHERE OrderStatus = 'Pending'"
  },
  {
    id: '33',
    sqlExpression: "SELECT SUM(OrderAmount) as value FROM Orders WHERE Format(OrderDate, 'yyyy-mm-dd') = Format(Date(), 'yyyy-mm-dd')"
  },
  // POR Overview - Total Rentals
  {
    id: '701',
    sqlExpression: "SELECT COUNT(*) as value FROM Contracts"
  },
  // POR Overview - Active Rentals
  {
    id: '702',
    sqlExpression: "SELECT COUNT(*) as value FROM Contracts WHERE Status = 'Active'"
  },
  // POR Overview - Overdue Rentals
  {
    id: '703',
    sqlExpression: "SELECT COUNT(*) as value FROM Contracts WHERE Status = 'Active' AND DueDate < Date()"
  },
  // POR Overview - Revenue MTD
  {
    id: '704',
    sqlExpression: "SELECT SUM(Amount) as value FROM Payments WHERE Year(PaymentDate) = Year(Date()) AND Month(PaymentDate) = Month(Date())"
  },
  // POR Overview - Revenue YTD
  {
    id: '705',
    sqlExpression: "SELECT SUM(Amount) as value FROM Payments WHERE Year(PaymentDate) = Year(Date())"
  }
];

// Function to update the SQL expressions in the database
function updateSqlExpressions() {
  // Start a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // First, check if the table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='spreadsheet_rows'", (err, table) => {
      if (err) {
        console.error('Error checking table:', err.message);
        db.run('ROLLBACK');
        db.close();
        return;
      }

      if (table) {
        console.log('Using spreadsheet_rows table');
        
        // Update P21 queries
        const p21Stmt = db.prepare('UPDATE spreadsheet_rows SET sql_expression = ? WHERE id = ?');
        fixedP21Queries.forEach(query => {
          p21Stmt.run(query.sqlExpression, query.id, function(err) {
            if (err) {
              console.error(`Error updating row ID ${query.id}:`, err.message);
            } else if (this.changes > 0) {
              console.log(`Updated query for row ID: ${query.id}`);
            } else {
              console.log(`No row found with ID: ${query.id}`);
            }
          });
        });
        p21Stmt.finalize();

        // Update POR queries
        const porStmt = db.prepare('UPDATE spreadsheet_rows SET sql_expression = ? WHERE id = ?');
        fixedPORQueries.forEach(query => {
          porStmt.run(query.sqlExpression, query.id, function(err) {
            if (err) {
              console.error(`Error updating row ID ${query.id}:`, err.message);
            } else if (this.changes > 0) {
              console.log(`Updated query for row ID: ${query.id}`);
            } else {
              console.log(`No row found with ID: ${query.id}`);
            }
          });
        });
        porStmt.finalize();
        
      } else {
        console.log('Checking for chart_data table');
        
        // Check if chart_data table exists
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='chart_data'", (err, chartTable) => {
          if (err) {
            console.error('Error checking chart_data table:', err.message);
            db.run('ROLLBACK');
            db.close();
            return;
          }
          
          if (chartTable) {
            console.log('Using chart_data table');
            
            // Update P21 queries in chart_data
            const p21Stmt = db.prepare('UPDATE chart_data SET sql_expression = ? WHERE id = ?');
            fixedP21Queries.forEach(query => {
              p21Stmt.run(query.sqlExpression, query.id, function(err) {
                if (err) {
                  console.error(`Error updating row ID ${query.id}:`, err.message);
                } else if (this.changes > 0) {
                  console.log(`Updated query for row ID: ${query.id}`);
                } else {
                  console.log(`No row found with ID: ${query.id}`);
                }
              });
            });
            p21Stmt.finalize();

            // Update POR queries in chart_data
            const porStmt = db.prepare('UPDATE chart_data SET sql_expression = ? WHERE id = ?');
            fixedPORQueries.forEach(query => {
              porStmt.run(query.sqlExpression, query.id, function(err) {
                if (err) {
                  console.error(`Error updating row ID ${query.id}:`, err.message);
                } else if (this.changes > 0) {
                  console.log(`Updated query for row ID: ${query.id}`);
                } else {
                  console.log(`No row found with ID: ${query.id}`);
                }
              });
            });
            porStmt.finalize();
          } else {
            console.error('Neither spreadsheet_rows nor chart_data table found');
            db.run('ROLLBACK');
            db.close();
            return;
          }
        });
      }
    });

    // Commit the transaction
    db.run('COMMIT', err => {
      if (err) {
        console.error('Error committing transaction:', err.message);
        db.run('ROLLBACK');
      } else {
        console.log('SQL queries updated successfully!');
      }
      
      // Close the database connection
      db.close();
    });
  });
}

// Run the update function
updateSqlExpressions();

