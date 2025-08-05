import fs from 'fs';
import path from 'path';

// Load the current allData.json
const allDataPath = path.join(process.cwd(), '..', 'allData.json');
const allData = JSON.parse(fs.readFileSync(allDataPath, 'utf8'));

console.log('🔧 Fixing SQL queries to use correct P21 table names...\n');

// Table name mappings from mock names to real P21 table names
const tableMapping = {
  'ar_invoices': 'invoice_hdr',
  'orders': 'oe_hdr',
  'order_lines': 'oe_line', 
  'customers': 'customer',
  'items': 'inv_mast',
  'inventory': 'inv_loc',
  'sales': 'invoice_line',
  'products': 'inv_mast',
  'accounts_receivable': 'invoice_hdr',
  'purchase_orders': 'po_hdr',
  'vendors': 'supplier',
  'locations': 'location'
};

// Column name mappings
const columnMapping = {
  'invoice_balance': 'total_amt_order',
  'due_date': 'date_due',
  'order_total': 'total_amt_order',
  'order_date': 'date_created',
  'customer_id': 'customer_id',
  'item_id': 'inv_mast_uid',
  'quantity': 'qty_ordered',
  'unit_price': 'unit_price',
  'status': 'delete_flag'
};

let fixedCount = 0;

// Process each metric
allData.forEach((metric, index) => {
  if (metric.productionSqlExpression) {
    let originalQuery = metric.productionSqlExpression;
    let fixedQuery = originalQuery;
    
    // Replace table names
    Object.entries(tableMapping).forEach(([oldTable, newTable]) => {
      const regex = new RegExp(`\\b${oldTable}\\b`, 'gi');
      if (regex.test(fixedQuery)) {
        fixedQuery = fixedQuery.replace(regex, newTable);
        console.log(`📋 Fixed table: ${oldTable} → ${newTable} in ${metric.variableName}`);
      }
    });
    
    // Replace column names
    Object.entries(columnMapping).forEach(([oldColumn, newColumn]) => {
      const regex = new RegExp(`\\b${oldColumn}\\b`, 'gi');
      if (regex.test(fixedQuery)) {
        fixedQuery = fixedQuery.replace(regex, newColumn);
        console.log(`📊 Fixed column: ${oldColumn} → ${newColumn} in ${metric.variableName}`);
      }
    });
    
    // Fix common SQL issues for P21
    // Replace GETDATE() with appropriate P21 function
    fixedQuery = fixedQuery.replace(/GETDATE\(\)/gi, 'GETDATE()');
    
    // Fix status conditions - P21 uses delete_flag instead of status
    fixedQuery = fixedQuery.replace(/status\s*=\s*['"](Open|Active)['"]/gi, "delete_flag = 'N'");
    fixedQuery = fixedQuery.replace(/status\s*=\s*['"](Closed|Inactive)['"]/gi, "delete_flag = 'Y'");
    
    // Update the metric if query changed
    if (fixedQuery !== originalQuery) {
      metric.productionSqlExpression = fixedQuery;
      fixedCount++;
      console.log(`✅ Updated query for ${metric.variableName}`);
      console.log(`   Old: ${originalQuery.substring(0, 100)}...`);
      console.log(`   New: ${fixedQuery.substring(0, 100)}...`);
      console.log('');
    }
  }
});

// Create specific queries for key metrics based on actual P21 structure
const keyMetricFixes = [
  {
    variableName: 'ARAgingCurrentP211',
    query: `SELECT ISNULL(SUM(total_amt_order - amt_paid), 0) 
            FROM invoice_hdr 
            WHERE delete_flag = 'N' 
            AND date_due >= GETDATE()`
  },
  {
    variableName: 'ARAging130DaysP212', 
    query: `SELECT ISNULL(SUM(total_amt_order - amt_paid), 0) 
            FROM invoice_hdr 
            WHERE delete_flag = 'N' 
            AND date_due BETWEEN DATEADD(day, -30, GETDATE()) AND DATEADD(day, -1, GETDATE())`
  },
  {
    variableName: 'TotalSalesP21',
    query: `SELECT ISNULL(SUM(il.extended_price), 0) 
            FROM invoice_line il 
            INNER JOIN invoice_hdr ih ON il.invoice_hdr_uid = ih.invoice_hdr_uid 
            WHERE ih.delete_flag = 'N' 
            AND ih.date_created >= DATEADD(month, -1, GETDATE())`
  },
  {
    variableName: 'TotalOrdersP21',
    query: `SELECT COUNT(*) 
            FROM oe_hdr 
            WHERE delete_flag = 'N' 
            AND date_created >= DATEADD(month, -1, GETDATE())`
  },
  {
    variableName: 'InventoryValueP21',
    query: `SELECT ISNULL(SUM(il.qty_on_hand * il.unit_cost), 0) 
            FROM inv_loc il 
            INNER JOIN inv_mast im ON il.inv_mast_uid = im.inv_mast_uid 
            WHERE il.delete_flag = 'N' AND im.delete_flag = 'N'`
  }
];

// Apply key metric fixes
keyMetricFixes.forEach(fix => {
  const metric = allData.find(m => m.variableName === fix.variableName);
  if (metric) {
    metric.productionSqlExpression = fix.query;
    console.log(`🎯 Applied specific fix for ${fix.variableName}`);
    fixedCount++;
  }
});

// Save the updated file
fs.writeFileSync(allDataPath, JSON.stringify(allData, null, 2));

console.log(`\n🎉 Query fixing complete!`);
console.log(`📊 Fixed ${fixedCount} queries out of ${allData.length} total metrics`);
console.log(`💾 Updated allData.json saved`);
console.log(`\n🔄 Restart the backend server to apply changes`);
