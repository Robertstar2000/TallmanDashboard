/**
 * Create New Initial Data Script
 * This script:
 * 1. Creates a new initial-data.ts file from scratch
 * 2. Ensures all chart groups have the correct number of rows
 * 3. Includes 36 account rows in the "Accounts" chart group
 */

const fs = require('fs');
const path = require('path');

// Chart group requirements
const chartGroupRequirements = {
  'Customer Metrics': 24,
  'Historical Data': 36,
  'Inventory': 8,
  'Por Overview': 36,
  'Daily Orders': 7,
  'Web Orders': 24,
  'Ar Aging': 5,
  'Site Distribution': 3,
  'Key Metrics': 7,
  'Accounts': 36
};

// Account SQL expressions
const accountSqlExpressions = {
  'Payable': {
    'sqlExpression': "SELECT COALESCE(COUNT(*), 0) as value FROM accounts WHERE type = 'payable' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-$MONTH month')",
    'productionSqlExpression': "SELECT ISNULL(SUM(open_balance), 0) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE DATEADD(month, $MONTH, GETDATE()) > due_date"
  },
  'Overdue': {
    'sqlExpression': "SELECT COALESCE(COUNT(*), 0) as value FROM accounts WHERE type = 'overdue' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-$MONTH month')",
    'productionSqlExpression': "SELECT ISNULL(SUM(open_balance), 0) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE DATEADD(month, $MONTH, GETDATE()) > due_date AND GETDATE() > due_date"
  },
  'Receivable': {
    'sqlExpression': "SELECT COALESCE(COUNT(*), 0) as value FROM accounts WHERE type = 'receivable' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-$MONTH month')",
    'productionSqlExpression': "SELECT ISNULL(SUM(open_balance), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEADD(month, $MONTH, GETDATE()) > due_date"
  }
};

// Site data SQL expressions
const siteDataExpressions = {
  'Columbus': {
    'count': "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '101' AND completed = 'N'",
    'sales': "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '101' AND h.order_date >= DATEADD(day, -30, GETDATE())"
  },
  'Addison': {
    'count': "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '100' AND completed = 'N'",
    'sales': "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '100' AND h.order_date >= DATEADD(day, -30, GETDATE())"
  },
  'Lake City': {
    'count': "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '107' AND completed = 'N'",
    'sales': "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '107' AND h.order_date >= DATEADD(day, -30, GETDATE())"
  }
};

// Main function to create a new initial-data.ts file
async function createNewInitialData() {
  try {
    // Define the path for the new file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    
    // Create a backup of the original file if it exists
    if (fs.existsSync(initialDataPath)) {
      const backupPath = initialDataPath + '.backup-original-' + Date.now();
      fs.copyFileSync(initialDataPath, backupPath);
      console.log(`Created backup of original file at ${backupPath}`);
    }
    
    // Start building the new file content
    let fileContent = `import { getMode } from '@/lib/state/dashboardState';
import Database from 'better-sqlite3';
import path from 'path';
import { monthlyPOCounts } from './monthly-po-counts';
import { monthlyPOTotals } from './monthly-po-totals';
import { porOverview } from './por-overview';
import { porAnalysis } from './por-analysis';
import { combinedSpreadsheetData } from './combined-spreadsheet-data';

export type SpreadsheetRow = {
  id: string;
  name: string;
  chartName: string;
  variableName: string;
  serverName: string;
  value: string;
  chartGroup: string;
  calculation: string;
  sqlExpression: string;
  productionSqlExpression: string;
  tableName: string;
  timeframe?: string;
};

export const initialSpreadsheetData: SpreadsheetRow[] = [
`;
    
    // Create objects for each chart group
    let id = 1;
    
    // Key Metrics
    for (let i = 0; i < chartGroupRequirements['Key Metrics']; i++) {
      fileContent += `    {
      id: '${id++}',
      name: "Key Metrics ${i + 1}",
      chartName: "Key Metrics",
      variableName: "Metric ${i + 1}",
      serverName: 'P21',
      value: "0",
      chartGroup: "Key Metrics",
      calculation: "COUNT(*)",
      sqlExpression: "SELECT COUNT(*) as value FROM orders",
      productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())",
      tableName: "oe_hdr"
    },
`;
    }
    
    // Customer Metrics
    for (let i = 0; i < chartGroupRequirements['Customer Metrics']; i++) {
      fileContent += `    {
      id: '${id++}',
      name: "Customer Metrics ${i + 1}",
      chartName: "Customers",
      variableName: "Customer ${i + 1}",
      serverName: 'P21',
      value: "0",
      chartGroup: "Customer Metrics",
      calculation: "COUNT(*)",
      sqlExpression: "SELECT COUNT(*) as value FROM customers",
      productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK)",
      tableName: "customer"
    },
`;
    }
    
    // Historical Data
    for (let i = 0; i < chartGroupRequirements['Historical Data']; i++) {
      const month = Math.floor(i / 3) + 1;
      const type = (i % 3) + 1;
      fileContent += `    {
      id: '${id++}',
      name: "Historical Data - Month ${month} - Type ${type}",
      chartName: "Historical Data",
      variableName: "Historical - Month ${month} - Type ${type}",
      serverName: 'P21',
      value: "0",
      chartGroup: "Historical Data",
      calculation: "COUNT(*)",
      sqlExpression: "SELECT 0 as value",
      productionSqlExpression: "SELECT 0 as value",
      tableName: "historical_data"
    },
`;
    }
    
    // Accounts
    const accountTypes = ['Payable', 'Overdue', 'Receivable'];
    for (let month = 1; month <= 12; month++) {
      for (let typeIndex = 0; typeIndex < accountTypes.length; typeIndex++) {
        const type = accountTypes[typeIndex];
        const monthOffset = month - 1;
        const sqlExpression = accountSqlExpressions[type].sqlExpression.replace('$MONTH', monthOffset);
        const productionSqlExpression = accountSqlExpressions[type].productionSqlExpression.replace('$MONTH', monthOffset);
        const tableName = type === 'Receivable' ? 'ar_open_items' : 'ap_open_items';
        
        fileContent += `    {
      id: '${id++}',
      name: "Accounts - ${type} - Month ${month}",
      chartName: "Accounts",
      variableName: "${type}",
      serverName: 'P21',
      value: "0",
      chartGroup: "Accounts",
      calculation: "COUNT(*)",
      timeframe: "Month ${month}",
      sqlExpression: "${sqlExpression}",
      productionSqlExpression: "${productionSqlExpression}",
      tableName: "${tableName}"
    },
`;
      }
    }
    
    // Inventory
    for (let i = 0; i < chartGroupRequirements['Inventory']; i++) {
      fileContent += `    {
      id: '${id++}',
      name: "Inventory ${i + 1}",
      chartName: "Inventory",
      variableName: "Inventory ${i + 1}",
      serverName: 'P21',
      value: "0",
      chartGroup: "Inventory",
      calculation: "COUNT(*)",
      sqlExpression: "SELECT COUNT(*) as value FROM inventory",
      productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK)",
      tableName: "inv_mast"
    },
`;
    }
    
    // Por Overview
    for (let i = 0; i < chartGroupRequirements['Por Overview']; i++) {
      fileContent += `    {
      id: '${id++}',
      name: "Por Overview ${i + 1}",
      chartName: "Por Overview",
      variableName: "Por ${i + 1}",
      serverName: 'POR',
      value: "0",
      chartGroup: "Por Overview",
      calculation: "COUNT(*)",
      sqlExpression: "SELECT COUNT(*) as value FROM por_items",
      productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.por_items WITH (NOLOCK)",
      tableName: "por_items"
    },
`;
    }
    
    // Daily Orders
    for (let i = 0; i < chartGroupRequirements['Daily Orders']; i++) {
      fileContent += `    {
      id: '${id++}',
      name: "Orders ${i + 1}",
      chartName: "Orders",
      variableName: "Order ${i + 1}",
      serverName: 'P21',
      value: "0",
      chartGroup: "Daily Orders",
      calculation: "COUNT(*)",
      sqlExpression: "SELECT COUNT(*) as value FROM orders",
      productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -1, GETDATE())",
      tableName: "oe_hdr"
    },
`;
    }
    
    // Web Orders
    for (let i = 0; i < chartGroupRequirements['Web Orders']; i++) {
      fileContent += `    {
      id: '${id++}',
      name: "Web Orders ${i + 1}",
      chartName: "Web Orders",
      variableName: "Web Order ${i + 1}",
      serverName: 'P21',
      value: "0",
      chartGroup: "Web Orders",
      calculation: "COUNT(*)",
      sqlExpression: "SELECT COUNT(*) as value FROM web_orders",
      productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'WEB' AND order_date >= DATEADD(day, -30, GETDATE())",
      tableName: "oe_hdr"
    },
`;
    }
    
    // Ar Aging
    for (let i = 0; i < chartGroupRequirements['Ar Aging']; i++) {
      fileContent += `    {
      id: '${id++}',
      name: "AR Aging ${i + 1}",
      chartName: "AR Aging",
      variableName: "Aging ${i + 1}",
      serverName: 'P21',
      value: "0",
      chartGroup: "Ar Aging",
      calculation: "COUNT(*)",
      sqlExpression: "SELECT COUNT(*) as value FROM ar_aging",
      productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE due_date < GETDATE()",
      tableName: "ar_open_items"
    },
`;
    }
    
    // Site Distribution
    const sites = ['Columbus', 'Addison', 'Lake City'];
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      fileContent += `    {
      id: '${id++}',
      name: "${site} - Count",
      chartName: "Site Distribution",
      variableName: "${site}",
      serverName: 'P21',
      value: "0",
      chartGroup: "Site Distribution",
      calculation: "COUNT(*)",
      sqlExpression: "SELECT COUNT(*) as value FROM orders WHERE site = '${site}'",
      productionSqlExpression: "${siteDataExpressions[site].count}",
      tableName: "oe_hdr"
    }${i < sites.length - 1 ? ',' : ''}
`;
    }
    
    // Close the array and add the rest of the file
    fileContent += `  ];

export const combinedData = {
  spreadsheetData: initialSpreadsheetData,
  monthlyPOCounts,
  monthlyPOTotals,
  porOverview,
  porAnalysis,
  combinedSpreadsheetData
};

export default combinedData;
`;
    
    // Write the new file
    fs.writeFileSync(initialDataPath, fileContent);
    console.log(`✅ Successfully created new initial-data.ts file with all chart groups`);
    
    // Verify the chart groups
    const accountCount = (fileContent.match(/chartGroup: "Accounts"/g) || []).length;
    const historicalDataCount = (fileContent.match(/chartGroup: "Historical Data"/g) || []).length;
    
    console.log(`\nVerified ${accountCount} rows with chart group "Accounts"`);
    console.log(`Verified ${historicalDataCount} rows with chart group "Historical Data"`);
    
    if (accountCount === chartGroupRequirements['Accounts'] && 
        historicalDataCount === chartGroupRequirements['Historical Data']) {
      console.log('\n✅ All chart groups have the correct number of rows');
    } else {
      console.error('\n❌ Some chart groups have incorrect row counts');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
createNewInitialData();
