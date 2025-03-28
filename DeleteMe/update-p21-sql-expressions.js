// Script to update SQL expressions for all chart groups to use real P21 database tables
const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');

// SQL expressions for each chart group using real P21 database tables
const sqlExpressions = {
  'AR Aging': [
    {
      variableName: 'Current',
      sqlExpression: "SELECT SUM(current_due) as value FROM invoice_hdr WHERE current_due > 0",
      productionSqlExpression: "SELECT SUM(BALANCE) as value FROM AR_OPEN_ITEMS WHERE DATEDIFF(day, INVOICE_DATE, GETDATE()) <= 30",
      tableName: "AR_OPEN_ITEMS"
    },
    {
      variableName: '1-30 Days',
      sqlExpression: "SELECT SUM(past_due_1_30) as value FROM invoice_hdr WHERE past_due_1_30 > 0",
      productionSqlExpression: "SELECT SUM(BALANCE) as value FROM AR_OPEN_ITEMS WHERE DATEDIFF(day, INVOICE_DATE, GETDATE()) BETWEEN 31 AND 60",
      tableName: "AR_OPEN_ITEMS"
    },
    {
      variableName: '31-60 Days',
      sqlExpression: "SELECT SUM(past_due_31_60) as value FROM invoice_hdr WHERE past_due_31_60 > 0",
      productionSqlExpression: "SELECT SUM(BALANCE) as value FROM AR_OPEN_ITEMS WHERE DATEDIFF(day, INVOICE_DATE, GETDATE()) BETWEEN 61 AND 90",
      tableName: "AR_OPEN_ITEMS"
    },
    {
      variableName: '61-90 Days',
      sqlExpression: "SELECT SUM(past_due_61_90) as value FROM invoice_hdr WHERE past_due_61_90 > 0",
      productionSqlExpression: "SELECT SUM(BALANCE) as value FROM AR_OPEN_ITEMS WHERE DATEDIFF(day, INVOICE_DATE, GETDATE()) BETWEEN 91 AND 120",
      tableName: "AR_OPEN_ITEMS"
    },
    {
      variableName: '90+ Days',
      sqlExpression: "SELECT SUM(past_due_over_90) as value FROM invoice_hdr WHERE past_due_over_90 > 0",
      productionSqlExpression: "SELECT SUM(BALANCE) as value FROM AR_OPEN_ITEMS WHERE DATEDIFF(day, INVOICE_DATE, GETDATE()) > 120",
      tableName: "AR_OPEN_ITEMS"
    }
  ],
  'Accounts': [
    {
      variableName: 'Payable',
      monthPattern: /Payable \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT COALESCE(SUM(invoice_amt), 0) * 0.4 as value FROM invoice_hdr",
      productionSqlExpression: "SELECT SUM(BALANCE) as value FROM AP_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = {month_num} AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
      tableName: "AP_OPEN_ITEMS"
    },
    {
      variableName: 'Receivable',
      monthPattern: /Receivable \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT COALESCE(SUM(invoice_amt), 0) * 0.6 as value FROM invoice_hdr",
      productionSqlExpression: "SELECT SUM(BALANCE) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = {month_num} AND YEAR(INVOICE_DATE) = YEAR(GETDATE())",
      tableName: "AR_OPEN_ITEMS"
    },
    {
      variableName: 'Overdue',
      monthPattern: /Overdue \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT COALESCE(SUM(invoice_amt), 0) * 0.2 as value FROM invoice_hdr",
      productionSqlExpression: "SELECT SUM(BALANCE) as value FROM AR_OPEN_ITEMS WHERE MONTH(INVOICE_DATE) = {month_num} AND YEAR(INVOICE_DATE) = YEAR(GETDATE()) AND DATEDIFF(day, DUE_DATE, GETDATE()) > 0",
      tableName: "AR_OPEN_ITEMS"
    }
  ],
  'Customer Metrics': [
    {
      variableName: 'New',
      monthPattern: /New \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT COUNT(*) as value FROM customer",
      productionSqlExpression: "SELECT COUNT(*) as value FROM CUSTOMER_MST WHERE MONTH(CONVERT(DATE, created_date)) = {month_num} AND YEAR(CONVERT(DATE, created_date)) = YEAR(GETDATE())",
      tableName: "CUSTOMER_MST"
    },
    {
      variableName: 'Prospects',
      monthPattern: /Prospects \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT COUNT(*) as value FROM customer",
      productionSqlExpression: "SELECT COUNT(*) as value FROM CUSTOMER_MST WHERE CUST_TYPE = 'Prospect' AND MONTH(CONVERT(DATE, created_date)) = {month_num} AND YEAR(CONVERT(DATE, created_date)) = YEAR(GETDATE())",
      tableName: "CUSTOMER_MST"
    }
  ],
  'Daily Orders': [
    {
      variableName: 'Orders',
      dayPattern: /Orders \((Today|Yesterday|Today-2|Today-3|Today-4|Today-5|Today-6)\)/,
      sqlExpression: "SELECT COUNT(*) as value FROM order_hdr",
      productionSqlExpression: "SELECT COUNT(*) as value FROM OE_HDR WHERE CONVERT(DATE, ORD_DATE) = DATEADD(day, {day_offset}, CONVERT(DATE, GETDATE()))",
      tableName: "OE_HDR"
    }
  ],
  'Historical Data': [
    {
      variableName: 'P21',
      monthPattern: /P21 \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT COUNT(*) * 100 as value FROM order_hdr",
      productionSqlExpression: "SELECT COUNT(*) as value FROM OE_HDR WHERE MONTH(ORD_DATE) = {month_num} AND YEAR(ORD_DATE) = YEAR(GETDATE())",
      tableName: "OE_HDR"
    },
    {
      variableName: 'POR',
      monthPattern: /POR \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT COUNT(*) * 50 as value FROM purchase_orders",
      productionSqlExpression: "SELECT COUNT(*) as value FROM purchase_orders WHERE MONTH(order_date) = {month_num} AND YEAR(order_date) = YEAR(GETDATE())",
      tableName: "purchase_orders"
    },
    {
      variableName: 'Total',
      monthPattern: /Total \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT (COUNT(*) * 150) as value FROM order_hdr",
      productionSqlExpression: "SELECT (SELECT COUNT(*) FROM OE_HDR WHERE MONTH(ORD_DATE) = {month_num} AND YEAR(ORD_DATE) = YEAR(GETDATE())) + (SELECT COUNT(*) FROM purchase_orders WHERE MONTH(order_date) = {month_num} AND YEAR(order_date) = YEAR(GETDATE())) as value",
      tableName: "OE_HDR"
    }
  ],
  'Inventory': [
    {
      variableName: 'In Stock',
      departmentPattern: /In Stock \((Plumbing|Electrical|HVAC|Tools)\)/,
      sqlExpression: "SELECT SUM(qty_on_hand) * 10 as value FROM inventory",
      productionSqlExpression: "SELECT SUM(QTY_ON_HAND) as value FROM INV_MAST WHERE CATEGORY = '{department}'",
      tableName: "INV_MAST"
    },
    {
      variableName: 'On Order',
      departmentPattern: /On Order \((Plumbing|Electrical|HVAC|Tools)\)/,
      sqlExpression: "SELECT SUM(qty_on_hand) * 5 as value FROM inventory",
      productionSqlExpression: "SELECT SUM(qty_ordered - qty_received) as value FROM purchase_line_items pli JOIN INV_MAST im ON pli.item_id = im.ITEM_ID WHERE im.CATEGORY = '{department}' AND pli.status = 'Open'",
      tableName: "INV_MAST"
    }
  ],
  'Key Metrics': [
    {
      variableName: 'Total Orders',
      sqlExpression: "SELECT COUNT(*) * 10 as value FROM order_hdr",
      productionSqlExpression: "SELECT COUNT(*) as value FROM OE_HDR WHERE ORD_DATE >= DATEADD(day, -30, GETDATE())",
      tableName: "OE_HDR"
    },
    {
      variableName: 'Gross Revenue',
      sqlExpression: "SELECT SUM(order_total) * 2 as value FROM order_hdr",
      productionSqlExpression: "SELECT SUM(ORDER_TOTAL) as value FROM OE_HDR WHERE ORD_DATE >= DATEADD(day, -30, GETDATE())",
      tableName: "OE_HDR"
    },
    {
      variableName: 'Net Profit',
      sqlExpression: "SELECT SUM(order_total) * 0.3 as value FROM order_hdr",
      productionSqlExpression: "SELECT SUM(ORDER_TOTAL) * 0.25 as value FROM OE_HDR WHERE ORD_DATE >= DATEADD(day, -30, GETDATE())",
      tableName: "OE_HDR"
    },
    {
      variableName: 'Average Order Value',
      sqlExpression: "SELECT AVG(order_total) as value FROM order_hdr",
      productionSqlExpression: "SELECT AVG(ORDER_TOTAL) as value FROM OE_HDR WHERE ORD_DATE >= DATEADD(day, -30, GETDATE())",
      tableName: "OE_HDR"
    },
    {
      variableName: 'Return Rate',
      sqlExpression: "SELECT 5.2 as value",
      productionSqlExpression: "SELECT (COUNT(CASE WHEN ORD_STATUS = 'Returned' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as value FROM OE_HDR WHERE ORD_DATE >= DATEADD(day, -30, GETDATE())",
      tableName: "OE_HDR"
    },
    {
      variableName: 'Inventory Value',
      sqlExpression: "SELECT SUM(qty_on_hand * cost) as value FROM inventory",
      productionSqlExpression: "SELECT SUM(QTY_ON_HAND * COST) as value FROM INV_MAST",
      tableName: "INV_MAST"
    },
    {
      variableName: 'Backorder Value',
      sqlExpression: "SELECT SUM(qty_on_hand * cost) * 0.15 as value FROM inventory",
      productionSqlExpression: "SELECT SUM((qty_ordered - qty_received) * im.COST) as value FROM purchase_line_items pli JOIN INV_MAST im ON pli.item_id = im.ITEM_ID WHERE pli.status = 'Backordered'",
      tableName: "INV_MAST"
    }
  ],
  'Site Distribution': [
    {
      variableName: 'Columbus',
      sqlExpression: "SELECT SUM(qty_on_hand) * 0.4 as value FROM inventory",
      productionSqlExpression: "SELECT SUM(QTY_ON_HAND) as value FROM INV_MAST im JOIN LOCATION_MST lm ON im.location_id = lm.LOC_ID WHERE lm.LOC_NAME = 'Columbus'",
      tableName: "INV_MAST"
    },
    {
      variableName: 'Addison',
      sqlExpression: "SELECT SUM(qty_on_hand) * 0.35 as value FROM inventory",
      productionSqlExpression: "SELECT SUM(QTY_ON_HAND) as value FROM INV_MAST im JOIN LOCATION_MST lm ON im.location_id = lm.LOC_ID WHERE lm.LOC_NAME = 'Addison'",
      tableName: "INV_MAST"
    },
    {
      variableName: 'Lake City',
      sqlExpression: "SELECT SUM(qty_on_hand) * 0.25 as value FROM inventory",
      productionSqlExpression: "SELECT SUM(QTY_ON_HAND) as value FROM INV_MAST im JOIN LOCATION_MST lm ON im.location_id = lm.LOC_ID WHERE lm.LOC_NAME = 'Lake City'",
      tableName: "INV_MAST"
    }
  ],
  'POR Overview': [
    {
      variableName: 'New Rentals',
      monthPattern: /New Rentals \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT COUNT(*) * 3 as value FROM purchase_orders",
      productionSqlExpression: "SELECT COUNT(*) as value FROM purchase_orders WHERE status = 'New' AND MONTH(order_date) = {month_num} AND YEAR(order_date) = YEAR(GETDATE())",
      tableName: "purchase_orders"
    },
    {
      variableName: 'Open Rentals',
      monthPattern: /Open Rentals \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT COUNT(*) * 5 as value FROM purchase_orders",
      productionSqlExpression: "SELECT COUNT(*) as value FROM purchase_orders WHERE status = 'Open' AND MONTH(order_date) = {month_num} AND YEAR(order_date) = YEAR(GETDATE())",
      tableName: "purchase_orders"
    },
    {
      variableName: 'Rental Value',
      monthPattern: /Rental Value \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT SUM(total_amount) as value FROM purchase_orders",
      productionSqlExpression: "SELECT SUM(total_amount) as value FROM purchase_orders WHERE MONTH(order_date) = {month_num} AND YEAR(order_date) = YEAR(GETDATE())",
      tableName: "purchase_orders"
    }
  ],
  'Web Orders': [
    {
      variableName: 'Orders',
      monthPattern: /Orders \((January|February|March|April|May|June|July|August|September|October|November|December)\)/,
      sqlExpression: "SELECT COUNT(*) * 2 as value FROM order_hdr",
      productionSqlExpression: "SELECT COUNT(*) as value FROM OE_HDR WHERE ORDER_TYPE = 'Web' AND MONTH(ORD_DATE) = {month_num} AND YEAR(ORD_DATE) = YEAR(GETDATE())",
      tableName: "OE_HDR"
    }
  ]
};

// Month name to number mapping
const monthToNumber = {
  'January': 1,
  'February': 2,
  'March': 3,
  'April': 4,
  'May': 5,
  'June': 6,
  'July': 7,
  'August': 8,
  'September': 9,
  'October': 10,
  'November': 11,
  'December': 12
};

// Day offset mapping
const dayOffsetMapping = {
  'Today': 0,
  'Yesterday': -1,
  'Today-2': -2,
  'Today-3': -3,
  'Today-4': -4,
  'Today-5': -5,
  'Today-6': -6
};

// Read the initial-data.ts file
fs.readFile(initialDataPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading initial-data.ts:', err.message);
    return;
  }
  
  console.log('Successfully read initial-data.ts');
  
  let updatedData = data;
  let totalUpdatedRows = 0;
  
  // Process each chart group
  Object.keys(sqlExpressions).forEach(chartGroup => {
    console.log(`\nProcessing chart group: ${chartGroup}`);
    let groupUpdatedRows = 0;
    
    // Process each expression in the chart group
    sqlExpressions[chartGroup].forEach(expr => {
      // Handle different variable name patterns
      if (expr.monthPattern) {
        // This is a month-based variable (like "Payable (January)")
        Object.keys(monthToNumber).forEach(month => {
          const variableName = expr.variableName + ` (${month})`;
          const monthNum = monthToNumber[month];
          
          // Replace {month_num} placeholder in SQL expressions
          const testSql = expr.sqlExpression;
          const prodSql = expr.productionSqlExpression.replace('{month_num}', monthNum);
          
          // Create a regex pattern to find the row with the matching variableName and chartGroup
          const pattern = new RegExp(`({\\s*id:\\s*['"]row_\\d+['"],\\s*name:\\s*['"].*?['"],\\s*chartGroup:\\s*['"]${chartGroup}['"],\\s*variableName:\\s*['"]${variableName.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}['"].*?})`, 's');
          
          const match = updatedData.match(pattern);
          if (match) {
            let rowData = match[1];
            
            // Update the SQL expressions and table name
            rowData = rowData.replace(/sqlExpression:\s*["'`].*?["'`]/, `sqlExpression: "${testSql}"`);
            rowData = rowData.replace(/productionSqlExpression:\s*["'`].*?["'`]/, `productionSqlExpression: "${prodSql}"`);
            rowData = rowData.replace(/tableName:\s*["'`].*?["'`]/, `tableName: "${expr.tableName}"`);
            
            // Replace the row in the file
            updatedData = updatedData.replace(pattern, rowData);
            groupUpdatedRows++;
            totalUpdatedRows++;
            
            console.log(`  Updated row for '${variableName}'`);
          } else {
            console.log(`  Could not find row for '${variableName}'`);
          }
        });
      } else if (expr.dayPattern) {
        // This is a day-based variable (like "Orders (Today)")
        Object.keys(dayOffsetMapping).forEach(day => {
          const variableName = expr.variableName + ` (${day})`;
          const dayOffset = dayOffsetMapping[day];
          
          // Replace {day_offset} placeholder in SQL expressions
          const testSql = expr.sqlExpression;
          const prodSql = expr.productionSqlExpression.replace('{day_offset}', dayOffset);
          
          // Create a regex pattern to find the row with the matching variableName and chartGroup
          const pattern = new RegExp(`({\\s*id:\\s*['"]row_\\d+['"],\\s*name:\\s*['"].*?['"],\\s*chartGroup:\\s*['"]${chartGroup}['"],\\s*variableName:\\s*['"]${variableName.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}['"].*?})`, 's');
          
          const match = updatedData.match(pattern);
          if (match) {
            let rowData = match[1];
            
            // Update the SQL expressions and table name
            rowData = rowData.replace(/sqlExpression:\s*["'`].*?["'`]/, `sqlExpression: "${testSql}"`);
            rowData = rowData.replace(/productionSqlExpression:\s*["'`].*?["'`]/, `productionSqlExpression: "${prodSql}"`);
            rowData = rowData.replace(/tableName:\s*["'`].*?["'`]/, `tableName: "${expr.tableName}"`);
            
            // Replace the row in the file
            updatedData = updatedData.replace(pattern, rowData);
            groupUpdatedRows++;
            totalUpdatedRows++;
            
            console.log(`  Updated row for '${variableName}'`);
          } else {
            console.log(`  Could not find row for '${variableName}'`);
          }
        });
      } else if (expr.departmentPattern) {
        // This is a department-based variable (like "In Stock (Plumbing)")
        ['Plumbing', 'Electrical', 'HVAC', 'Tools'].forEach(department => {
          const variableName = expr.variableName + ` (${department})`;
          
          // Replace {department} placeholder in SQL expressions
          const testSql = expr.sqlExpression;
          const prodSql = expr.productionSqlExpression.replace('{department}', department);
          
          // Create a regex pattern to find the row with the matching variableName and chartGroup
          const pattern = new RegExp(`({\\s*id:\\s*['"]row_\\d+['"],\\s*name:\\s*['"].*?['"],\\s*chartGroup:\\s*['"]${chartGroup}['"],\\s*variableName:\\s*['"]${variableName.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}['"].*?})`, 's');
          
          const match = updatedData.match(pattern);
          if (match) {
            let rowData = match[1];
            
            // Update the SQL expressions and table name
            rowData = rowData.replace(/sqlExpression:\s*["'`].*?["'`]/, `sqlExpression: "${testSql}"`);
            rowData = rowData.replace(/productionSqlExpression:\s*["'`].*?["'`]/, `productionSqlExpression: "${prodSql}"`);
            rowData = rowData.replace(/tableName:\s*["'`].*?["'`]/, `tableName: "${expr.tableName}"`);
            
            // Replace the row in the file
            updatedData = updatedData.replace(pattern, rowData);
            groupUpdatedRows++;
            totalUpdatedRows++;
            
            console.log(`  Updated row for '${variableName}'`);
          } else {
            console.log(`  Could not find row for '${variableName}'`);
          }
        });
      } else {
        // This is a simple variable (like "Total Orders")
        const variableName = expr.variableName;
        
        // Create a regex pattern to find the row with the matching variableName and chartGroup
        const pattern = new RegExp(`({\\s*id:\\s*['"]row_\\d+['"],\\s*name:\\s*['"].*?['"],\\s*chartGroup:\\s*['"]${chartGroup}['"],\\s*variableName:\\s*['"]${variableName}['"].*?})`, 's');
        
        const match = updatedData.match(pattern);
        if (match) {
          let rowData = match[1];
          
          // Update the SQL expressions and table name
          rowData = rowData.replace(/sqlExpression:\s*["'`].*?["'`]/, `sqlExpression: "${expr.sqlExpression}"`);
          rowData = rowData.replace(/productionSqlExpression:\s*["'`].*?["'`]/, `productionSqlExpression: "${expr.productionSqlExpression}"`);
          rowData = rowData.replace(/tableName:\s*["'`].*?["'`]/, `tableName: "${expr.tableName}"`);
          
          // Replace the row in the file
          updatedData = updatedData.replace(pattern, rowData);
          groupUpdatedRows++;
          totalUpdatedRows++;
          
          console.log(`  Updated row for '${variableName}'`);
        } else {
          console.log(`  Could not find row for '${variableName}'`);
        }
      }
    });
    
    console.log(`Updated ${groupUpdatedRows} rows in ${chartGroup}`);
  });
  
  // Write the updated file
  if (totalUpdatedRows > 0) {
    fs.writeFile(initialDataPath, updatedData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing initial-data.ts:', err.message);
        return;
      }
      
      console.log(`\nSuccessfully updated ${totalUpdatedRows} rows in initial-data.ts`);
    });
  } else {
    console.log('\nNo rows were updated in initial-data.ts');
  }
});
