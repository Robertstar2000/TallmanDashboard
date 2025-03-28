// Script to update SQL queries in initial-data.ts
const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let fileContent = fs.readFileSync(filePath, 'utf8');

// Define the SQL query updates
const updates = [
  // Key Metrics
  {
    id: '2', // Open Orders
    oldQuery: /productionSqlExpression: "SELECT COUNT\(\*\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE order_status = 'Open'"/,
    newQuery: 'productionSqlExpression: "SELECT SUM(oh.net_total) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE oh.status = \'O\'"'
  },
  {
    id: '3', // Open Orders 2
    oldQuery: /productionSqlExpression: "SELECT COUNT\(\*\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE order_status = 'Pending'"/,
    newQuery: 'productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE status = \'O\'"'
  },
  {
    id: '4', // Daily Revenue
    oldQuery: /productionSqlExpression: "SELECT ISNULL\(SUM\(order_amt\), 0\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE CONVERT\(date, order_date\) = CONVERT\(date, GETDATE\(\)\)"/,
    newQuery: 'productionSqlExpression: "SELECT SUM(oh.net_total) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE CAST(oh.ord_date AS date) = CAST(GETDATE() AS date)"'
  },
  {
    id: '5', // Open Invoices
    oldQuery: /productionSqlExpression: "SELECT ISNULL\(SUM\(invoice_amt\), 0\) as value FROM P21\.dbo\.ar_open_items WITH \(NOLOCK\) WHERE item_status = 'Open'"/,
    newQuery: 'productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.po_hdr ph WITH (NOLOCK) WHERE ph.order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND ph.order_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0) AND ph.completed = 0"'
  },
  {
    id: '6', // Orders Backlogged
    oldQuery: /productionSqlExpression: "SELECT COUNT\(\*\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE order_status = 'Backlogged'"/,
    newQuery: 'productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE oh.status = \'B\' AND oh.ord_date >= DATEADD(day, -30, CAST(GETDATE() AS date))"'
  },
  {
    id: '7', // Total Sales Monthly
    oldQuery: /productionSqlExpression: "SELECT ISNULL\(SUM\(order_amt\), 0\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE FORMAT\(order_date, 'yyyy-MM'\) = FORMAT\(GETDATE\(\), 'yyyy-MM'\)"/,
    newQuery: 'productionSqlExpression: "SELECT SUM(oh.net_total) as value FROM P21.dbo.oe_hdr oh WITH (NOLOCK) WHERE CAST(oh.ord_date AS date) >= DATEADD(month, -11, CAST(GETDATE() AS date))"'
  },
  
  // Site Distribution
  {
    id: '8', // Columbus
    oldQuery: /productionSqlExpression: "SELECT COUNT\(\*\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE location_id = '01' AND order_status = 'Open'"/,
    newQuery: 'productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE location_id = \'01\' AND status = \'O\'"'
  },
  {
    id: '9', // Addison
    oldQuery: /productionSqlExpression: "SELECT COUNT\(\*\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE location_id = '02' AND order_status = 'Open'"/,
    newQuery: 'productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE location_id = \'02\' AND status = \'O\'"'
  },
  {
    id: '10', // Lake City
    oldQuery: /productionSqlExpression: "SELECT COUNT\(\*\) as value FROM P21\.dbo\.oe_hdr WITH \(NOLOCK\) WHERE location_id = '03' AND order_status = 'Open'"/,
    newQuery: 'productionSqlExpression: "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK) WHERE location_id = \'03\' AND status = \'O\'"'
  },
  
  // Accounts - Month 1
  {
    id: '11', // Accounts Payable - Month 1
    oldQuery: /productionSqlExpression: "SELECT ISNULL\(SUM\(invoice_amt\), 0\) as value FROM P21\.dbo\.ap_open_items WITH \(NOLOCK\) WHERE FORMAT\(invoice_date, 'yyyy-MM'\) = FORMAT\(GETDATE\(\), 'yyyy-MM'\)"/,
    newQuery: 'productionSqlExpression: "SELECT ISNULL(SUM(ap.inv_amt - ap.amt_paid), 0) AS value FROM P21.dbo.ap_inv_hdr ap WITH (NOLOCK) WHERE ap.inv_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND ap.inv_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)"'
  },
  {
    id: '12', // Accounts Overdue - Month 1
    oldQuery: /productionSqlExpression: "SELECT ISNULL\(SUM\(invoice_amt\), 0\) as value FROM P21\.dbo\.ap_open_items WITH \(NOLOCK\) WHERE DATEDIFF\(day, due_date, GETDATE\(\)\) > 0 AND FORMAT\(invoice_date, 'yyyy-MM'\) = FORMAT\(GETDATE\(\), 'yyyy-MM'\)"/,
    newQuery: 'productionSqlExpression: "SELECT ISNULL(SUM(invoice_amt), 0) as value FROM P21.dbo.ap_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 0 AND FORMAT(invoice_date, \'yyyy-MM\') = FORMAT(GETDATE(), \'yyyy-MM\')"'
  },
  {
    id: '13', // Accounts Receivable - Month 1
    oldQuery: /productionSqlExpression: "SELECT ISNULL\(SUM\(invoice_amt\), 0\) as value FROM P21\.dbo\.ar_open_items WITH \(NOLOCK\) WHERE FORMAT\(invoice_date, 'yyyy-MM'\) = FORMAT\(GETDATE\(\), 'yyyy-MM'\)"/,
    newQuery: 'productionSqlExpression: "SELECT ISNULL(SUM(ar.balance), 0) AS value FROM P21.dbo.ar_open_invc ar WITH (NOLOCK) WHERE ar.inv_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND ar.inv_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)"'
  }
];

// Apply the updates
updates.forEach(update => {
  if (update.oldQuery.test(fileContent)) {
    fileContent = fileContent.replace(update.oldQuery, update.newQuery);
    console.log(`Updated query for ID ${update.id}`);
  } else {
    console.log(`Could not find query for ID ${update.id}`);
  }
});

// Write the updated content back to the file
fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('File updated successfully');
