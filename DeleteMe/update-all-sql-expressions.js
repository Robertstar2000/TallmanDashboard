/**
 * Script to update all SQL expressions in initial-data.ts
 * This script:
 * 1. Creates proper SQL expressions for both test and production environments
 * 2. Handles different SQL dialects (SQL Server for P21, MS Access/Jet SQL for POR)
 * 3. Ensures all chart groups have appropriate SQL expressions
 */

const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Create a backup of the current file
const backupPath = `${filePath}.backup-sql-update-${Date.now()}`;
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Extract the initialSpreadsheetData array
const dataStartIndex = content.indexOf('export const initialSpreadsheetData');
const dataEndIndex = content.indexOf('// Chart group settings');

if (dataStartIndex === -1 || dataEndIndex === -1) {
  console.error('Could not find the initialSpreadsheetData array in the file');
  process.exit(1);
}

// Parse the data section
let dataSection = content.substring(dataStartIndex, dataEndIndex);

// Define SQL expressions for each chart group
const sqlExpressions = {
  // Key Metrics
  'Key Metrics': {
    'Total Orders': {
      test: "SELECT COUNT(*) as value FROM orders WHERE order_date >= date('now', '-7 days')",
      p21: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())",
      por: "SELECT COUNT(*) as value FROM PurchaseOrder WHERE OrderDate >= DateAdd('d', -7, Date())"
    },
    'Gross Revenue': {
      test: "SELECT SUM(total_amount) as value FROM invoices WHERE invoice_date >= date('now', '-30 days')",
      p21: "SELECT SUM(NET_TOTAL) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(day, -30, GETDATE())",
      por: "SELECT Sum(TotalAmount) as value FROM PurchaseOrder WHERE OrderDate >= DateAdd('d', -30, Date())"
    },
    'Net Profit': {
      test: "SELECT SUM(profit) as value FROM invoices WHERE invoice_date >= date('now', '-30 days')",
      p21: "SELECT SUM(NET_TOTAL - COST_TOTAL) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(day, -30, GETDATE())",
      por: "SELECT Sum(TotalAmount - TotalCost) as value FROM PurchaseOrder WHERE OrderDate >= DateAdd('d', -30, Date())"
    },
    'Average Order Value': {
      test: "SELECT AVG(total_amount) as value FROM orders WHERE order_date >= date('now', '-30 days')",
      p21: "SELECT AVG(NET_TOTAL) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())",
      por: "SELECT Avg(TotalAmount) as value FROM PurchaseOrder WHERE OrderDate >= DateAdd('d', -30, Date())"
    },
    'Return Rate': {
      test: "SELECT (COUNT(CASE WHEN status = 'returned' THEN 1 END) * 100.0 / COUNT(*)) as value FROM orders WHERE order_date >= date('now', '-30 days')",
      p21: "SELECT (COUNT(CASE WHEN ORD_STATUS = 'R' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())",
      por: "SELECT (Count(IIf(Status='Returned',1,Null)) * 100.0 / Count(*)) as value FROM PurchaseOrder WHERE OrderDate >= DateAdd('d', -30, Date())"
    },
    'Inventory Value': {
      test: "SELECT SUM(quantity * price) as value FROM inventory",
      p21: "SELECT SUM(QTY_ON_HAND * COST) as value FROM dbo.inv_mast WITH (NOLOCK)",
      por: "SELECT Sum(QuantityOnHand * UnitCost) as value FROM Inventory"
    },
    'Backorder Value': {
      test: "SELECT SUM(backorder_quantity * price) as value FROM inventory",
      p21: "SELECT SUM(QTY_BACKORD * COST) as value FROM dbo.inv_mast WITH (NOLOCK)",
      por: "SELECT Sum(BackorderQuantity * UnitCost) as value FROM Inventory"
    }
  },
  
  // Site Distribution
  'Site Distribution': {
    'Columbus': {
      test: "SELECT SUM(quantity) as value FROM inventory WHERE location = 'Columbus'",
      p21: "SELECT SUM(QTY_ON_HAND) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE LOCATION = 'Columbus'",
      por: "SELECT Sum(QuantityOnHand) as value FROM Inventory WHERE Location = 'Columbus'"
    },
    'Addison': {
      test: "SELECT SUM(quantity) as value FROM inventory WHERE location = 'Addison'",
      p21: "SELECT SUM(QTY_ON_HAND) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE LOCATION = 'Addison'",
      por: "SELECT Sum(QuantityOnHand) as value FROM Inventory WHERE Location = 'Addison'"
    },
    'Lake City': {
      test: "SELECT SUM(quantity) as value FROM inventory WHERE location = 'Lake City'",
      p21: "SELECT SUM(QTY_ON_HAND) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE LOCATION = 'Lake City'",
      por: "SELECT Sum(QuantityOnHand) as value FROM Inventory WHERE Location = 'Lake City'"
    }
  },
  
  // Accounts
  'Accounts': {
    'Payable': {
      test: "SELECT SUM(amount) as value FROM accounts WHERE type = 'payable' AND month = ?",
      p21: "SELECT SUM(BALANCE) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE MONTH(DUE_DATE) = ? AND YEAR(DUE_DATE) = YEAR(GETDATE())",
      por: "SELECT Sum(Balance) as value FROM AccountsPayable WHERE Month(DueDate) = ? AND Year(DueDate) = Year(Date())"
    },
    'Receivable': {
      test: "SELECT SUM(amount) as value FROM accounts WHERE type = 'receivable' AND month = ?",
      p21: "SELECT SUM(BALANCE) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(DUE_DATE) = ? AND YEAR(DUE_DATE) = YEAR(GETDATE())",
      por: "SELECT Sum(Balance) as value FROM AccountsReceivable WHERE Month(DueDate) = ? AND Year(DueDate) = Year(Date())"
    },
    'Overdue': {
      test: "SELECT SUM(amount) as value FROM accounts WHERE type = 'receivable' AND due_date < date('now') AND month = ?",
      p21: "SELECT SUM(BALANCE) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DUE_DATE < GETDATE() AND MONTH(DUE_DATE) = ? AND YEAR(DUE_DATE) = YEAR(GETDATE())",
      por: "SELECT Sum(Balance) as value FROM AccountsReceivable WHERE DueDate < Date() AND Month(DueDate) = ? AND Year(DueDate) = Year(Date())"
    }
  },
  
  // Customer Metrics
  'Customer Metrics': {
    'New': {
      test: "SELECT COUNT(*) as value FROM customers WHERE created_at >= date('now', 'start of month', '-? months') AND created_at < date('now', 'start of month', '-? months', '+1 month')",
      p21: "SELECT COUNT(*) as value FROM dbo.customer_mst WITH (NOLOCK) WHERE MONTH(CREATE_DATE) = ? AND YEAR(CREATE_DATE) = YEAR(DATEADD(month, -?, GETDATE()))",
      por: "SELECT Count(*) as value FROM Customers WHERE Month(CreatedDate) = ? AND Year(CreatedDate) = Year(DateAdd('m', -?, Date()))"
    },
    'Prospects': {
      test: "SELECT COUNT(*) as value FROM customers WHERE type = 'prospect' AND created_at >= date('now', 'start of month', '-? months') AND created_at < date('now', 'start of month', '-? months', '+1 month')",
      p21: "SELECT COUNT(*) as value FROM dbo.customer_mst WITH (NOLOCK) WHERE CUST_TYPE = 'P' AND MONTH(CREATE_DATE) = ? AND YEAR(CREATE_DATE) = YEAR(DATEADD(month, -?, GETDATE()))",
      por: "SELECT Count(*) as value FROM Customers WHERE CustomerType = 'Prospect' AND Month(CreatedDate) = ? AND Year(CreatedDate) = Year(DateAdd('m', -?, Date()))"
    }
  },
  
  // Daily Orders
  'Daily Orders': {
    'Orders': {
      test: "SELECT COUNT(*) as value FROM orders WHERE date(order_date) = date('now', '-? days')",
      p21: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, DATEADD(day, -?, GETDATE()))",
      por: "SELECT Count(*) as value FROM PurchaseOrder WHERE DateValue(OrderDate) = DateValue(DateAdd('d', -?, Date()))"
    }
  },
  
  // Historical Data
  'Historical Data': {
    'P21': {
      test: "SELECT COUNT(*) as value FROM orders WHERE source = 'P21' AND strftime('%m', order_date) = ? AND strftime('%Y', order_date) = strftime('%Y', 'now')",
      p21: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = ? AND YEAR(order_date) = YEAR(GETDATE())",
      por: null // Not applicable for POR
    },
    'POR': {
      test: "SELECT COUNT(*) as value FROM orders WHERE source = 'POR' AND strftime('%m', order_date) = ? AND strftime('%Y', order_date) = strftime('%Y', 'now')",
      p21: null, // Not applicable for P21
      por: "SELECT Count(*) as value FROM PurchaseOrder WHERE Month(OrderDate) = ? AND Year(OrderDate) = Year(Date())"
    },
    'Total': {
      test: "SELECT COUNT(*) as value FROM orders WHERE strftime('%m', order_date) = ? AND strftime('%Y', order_date) = strftime('%Y', 'now')",
      p21: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = ? AND YEAR(order_date) = YEAR(GETDATE())",
      por: "SELECT Count(*) as value FROM PurchaseOrder WHERE Month(OrderDate) = ? AND Year(OrderDate) = Year(Date())"
    }
  },
  
  // Inventory
  'Inventory': {
    'In Stock': {
      test: "SELECT SUM(quantity) as value FROM inventory WHERE department = ?",
      p21: "SELECT SUM(QTY_ON_HAND) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE DEPARTMENT = ?",
      por: "SELECT Sum(QuantityOnHand) as value FROM Inventory WHERE Department = ?"
    },
    'On Order': {
      test: "SELECT SUM(on_order) as value FROM inventory WHERE department = ?",
      p21: "SELECT SUM(QTY_ON_ORDER) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE DEPARTMENT = ?",
      por: "SELECT Sum(QuantityOnOrder) as value FROM Inventory WHERE Department = ?"
    }
  },
  
  // POR Overview
  'POR Overview': {
    'New Rentals': {
      test: "SELECT COUNT(*) as value FROM por_rentals WHERE status = 'new' AND strftime('%m', created_at) = ? AND strftime('%Y', created_at) = strftime('%Y', 'now')",
      p21: null, // Not applicable for P21
      por: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = ? AND Year(CreatedDate) = Year(Date())"
    },
    'Open Rentals': {
      test: "SELECT COUNT(*) as value FROM por_rentals WHERE status = 'open' AND strftime('%m', created_at) = ? AND strftime('%Y', created_at) = strftime('%Y', 'now')",
      p21: null, // Not applicable for P21
      por: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = ? AND Year(CreatedDate) = Year(Date())"
    },
    'Rental Value': {
      test: "SELECT SUM(value) as value FROM por_rentals WHERE strftime('%m', created_at) = ? AND strftime('%Y', created_at) = strftime('%Y', 'now')",
      p21: null, // Not applicable for P21
      por: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = ? AND Year(CreatedDate) = Year(Date())"
    }
  },
  
  // Web Orders
  'Web Orders': {
    'Orders': {
      test: "SELECT COUNT(*) as value FROM orders WHERE source = 'web' AND strftime('%m', order_date) = ? AND strftime('%Y', order_date) = strftime('%Y', 'now')",
      p21: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE ORDER_SOURCE = 'WEB' AND MONTH(order_date) = ? AND YEAR(order_date) = YEAR(GETDATE())",
      por: "SELECT Count(*) as value FROM PurchaseOrder WHERE OrderSource = 'Web' AND Month(OrderDate) = ? AND Year(OrderDate) = Year(Date())"
    }
  },
  
  // AR Aging
  'AR Aging': {
    'Current': {
      test: "SELECT SUM(amount) as value FROM ar_aging WHERE days_overdue = 0",
      p21: "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, DUE_DATE, GETDATE()) <= 0",
      por: "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) <= 0"
    },
    '1-30 Days': {
      test: "SELECT SUM(amount) as value FROM ar_aging WHERE days_overdue BETWEEN 1 AND 30",
      p21: "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, DUE_DATE, GETDATE()) BETWEEN 1 AND 30",
      por: "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 1 AND 30"
    },
    '31-60 Days': {
      test: "SELECT SUM(amount) as value FROM ar_aging WHERE days_overdue BETWEEN 31 AND 60",
      p21: "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, DUE_DATE, GETDATE()) BETWEEN 31 AND 60",
      por: "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 31 AND 60"
    },
    '61-90 Days': {
      test: "SELECT SUM(amount) as value FROM ar_aging WHERE days_overdue BETWEEN 61 AND 90",
      p21: "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, DUE_DATE, GETDATE()) BETWEEN 61 AND 90",
      por: "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 61 AND 90"
    },
    '90+ Days': {
      test: "SELECT SUM(amount) as value FROM ar_aging WHERE days_overdue > 90",
      p21: "SELECT COALESCE(SUM(OPEN_AMT), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, DUE_DATE, GETDATE()) > 90",
      por: "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) > 90"
    }
  }
};

// Function to update SQL expressions in the data section
function updateSqlExpressions(dataSection) {
  // Regular expression to match each row object in the array
  const rowRegex = /{\s*id:\s*['"]([^'"]+)['"]\s*,\s*name:\s*["']([^"']+)["']\s*,\s*chartName:\s*["']([^"']+)["']\s*,\s*variableName:\s*["']([^"']+)["']\s*,\s*serverName:\s*['"]([^'"]+)['"]\s*,.*?}/gs;
  
  // Replace each row with updated SQL expressions
  return dataSection.replace(rowRegex, (match, id, name, chartName, variableName, serverName) => {
    // Extract the chart group from the match
    const chartGroupMatch = match.match(/chartGroup:\s*["']([^"']+)["']/);
    const chartGroup = chartGroupMatch ? chartGroupMatch[1] : chartName;
    
    // Get the SQL expressions for this chart group and variable
    const expressions = sqlExpressions[chartGroup] && sqlExpressions[chartGroup][variableName];
    
    if (!expressions) {
      console.log(`Warning: No SQL expressions found for chart group "${chartGroup}" and variable "${variableName}"`);
      return match; // Return the original match if no expressions found
    }
    
    // Determine which SQL expression to use based on the server name
    let testSql = expressions.test || "";
    let productionSql = "";
    
    if (serverName === 'P21') {
      productionSql = expressions.p21 || "";
    } else if (serverName === 'POR') {
      productionSql = expressions.por || "";
    } else {
      // Default to test SQL for unknown server names
      productionSql = testSql;
    }
    
    // If no production SQL is available for this server, use a placeholder
    if (!productionSql) {
      productionSql = `SELECT 0 as value -- Not applicable for ${serverName}`;
    }
    
    // Update the match with the new SQL expressions
    return match
      .replace(/sqlExpression:\s*["']([^"']*)["']/g, `sqlExpression: "${testSql}"`)
      .replace(/productionSqlExpression:\s*["']([^"']*)["']/g, `productionSqlExpression: "${productionSql}"`);
  });
}

// Update the data section with the new SQL expressions
const updatedDataSection = updateSqlExpressions(dataSection);

// Replace the data section in the content
const updatedContent = content.substring(0, dataStartIndex) + updatedDataSection + content.substring(dataEndIndex);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Updated SQL expressions in initial-data.ts');

// Count the number of rows for each chart group
const chartGroups = {};
const rows = updatedDataSection.match(/chartGroup: ['"]([^'"]+)['"]/g) || [];

rows.forEach(match => {
  const chartGroup = match.match(/['"]([^'"]+)['"]/)[1];
  chartGroups[chartGroup] = (chartGroups[chartGroup] || 0) + 1;
});

console.log('\nChart group row counts:');
Object.entries(chartGroups).forEach(([group, count]) => {
  console.log(`${group}: ${count} rows`);
});

// Verify that all chart groups have the expected number of rows
const expectedRowCounts = {
  'Key Metrics': 7,
  'Site Distribution': 3,
  'Accounts': 36,
  'Customer Metrics': 24,
  'Historical Data': 36,
  'Inventory': 8,
  'POR Overview': 36,
  'Daily Orders': 7,
  'Web Orders': 12,
  'AR Aging': 5
};

console.log('\nVerifying chart group row counts:');
let allCorrect = true;
Object.entries(expectedRowCounts).forEach(([group, expectedCount]) => {
  const actualCount = chartGroups[group] || 0;
  const isCorrect = actualCount === expectedCount;
  console.log(`${group}: ${actualCount}/${expectedCount} rows ${isCorrect ? '✓' : '✗'}`);
  if (!isCorrect) allCorrect = false;
});

if (allCorrect) {
  console.log('\n✅ All chart groups have the correct number of rows');
} else {
  console.log('\n⚠️ Some chart groups do not have the expected number of rows');
}
