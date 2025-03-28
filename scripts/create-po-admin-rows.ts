/**
 * Create Purchase Order Admin Spreadsheet Rows
 * 
 * This script generates rows for the admin spreadsheet to retrieve
 * historical purchase order data from the PurchaseOrder table in the POR database.
 */

import fs from 'fs';

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Define the admin row structure
interface AdminRow {
  chartName: string;
  variableName: string;
  server: string;
  tableName: string;
  sqlExpression: string;
  value: number;
}

// Generate rows for monthly purchase order counts
function generateMonthlyPOCountRows(): AdminRow[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  const rows: AdminRow[] = [];
  
  // Generate rows for the last 12 months
  for (let i = 0; i < 12; i++) {
    // Calculate the target month
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;
    
    // Adjust for previous year if needed
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    // Calculate start and end dates for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0); // Last day of the month
    
    const monthName = startDate.toLocaleString('default', { month: 'long' });
    const shortYear = targetYear.toString().slice(-2);
    
    const sql = `SELECT COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '${formatDate(startDate)}' AND Date <= '${formatDate(endDate)}'`;
    
    rows.push({
      chartName: "Monthly PO Counts",
      variableName: `${monthName} '${shortYear}`,
      server: "POR",
      tableName: "PurchaseOrder",
      sqlExpression: sql,
      value: 0
    });
  }
  
  return rows;
}

// Generate rows for monthly purchase order totals
function generateMonthlyPOTotalRows(): AdminRow[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  const rows: AdminRow[] = [];
  
  // Generate rows for the last 12 months
  for (let i = 0; i < 12; i++) {
    // Calculate the target month
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;
    
    // Adjust for previous year if needed
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    // Calculate start and end dates for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0); // Last day of the month
    
    const monthName = startDate.toLocaleString('default', { month: 'long' });
    const shortYear = targetYear.toString().slice(-2);
    
    // Note: Using ShippingCost as the amount field based on our PORTables.md analysis
    const sql = `SELECT SUM(ShippingCost) AS Total FROM PurchaseOrder WHERE Date >= '${formatDate(startDate)}' AND Date <= '${formatDate(endDate)}'`;
    
    rows.push({
      chartName: "Monthly PO Totals",
      variableName: `${monthName} '${shortYear}`,
      server: "POR",
      tableName: "PurchaseOrder",
      sqlExpression: sql,
      value: 0
    });
  }
  
  return rows;
}

// Generate rows for vendor purchase order counts
function generateVendorPOCountRows(): AdminRow[] {
  return [
    {
      chartName: "Vendor Analysis",
      variableName: "Top 5 Vendors",
      server: "POR",
      tableName: "PurchaseOrder",
      sqlExpression: `SELECT TOP 5 VendorNumber, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '${formatDate(new Date(new Date().getFullYear(), 0, 1))}' GROUP BY VendorNumber ORDER BY Count DESC`,
      value: 0
    }
  ];
}

// Generate rows for status distribution
function generateStatusDistributionRows(): AdminRow[] {
  return [
    {
      chartName: "PO Status",
      variableName: "Status Distribution",
      server: "POR",
      tableName: "PurchaseOrder",
      sqlExpression: `SELECT Status, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '${formatDate(new Date(new Date().getFullYear(), 0, 1))}' GROUP BY Status`,
      value: 0
    }
  ];
}

// Generate rows for store distribution
function generateStoreDistributionRows(): AdminRow[] {
  return [
    {
      chartName: "Store Analysis",
      variableName: "PO by Store",
      server: "POR",
      tableName: "PurchaseOrder",
      sqlExpression: `SELECT Store, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= '${formatDate(new Date(new Date().getFullYear(), 0, 1))}' GROUP BY Store`,
      value: 0
    }
  ];
}

// Generate all admin rows
function generateAllRows(): void {
  const monthlyCountRows = generateMonthlyPOCountRows();
  const monthlyTotalRows = generateMonthlyPOTotalRows();
  const vendorRows = generateVendorPOCountRows();
  const statusRows = generateStatusDistributionRows();
  const storeRows = generateStoreDistributionRows();
  
  const allRows = [
    ...monthlyCountRows,
    ...monthlyTotalRows,
    ...vendorRows,
    ...statusRows,
    ...storeRows
  ];
  
  // Create JSON file
  fs.writeFileSync('po-admin-rows.json', JSON.stringify(allRows, null, 2));
  
  // Create CSV file
  const csvHeader = 'ChartName,VariableName,Server,TableName,SQLExpression,Value\n';
  const csvRows = allRows.map(row => {
    return `"${row.chartName}","${row.variableName}","${row.server}","${row.tableName}","${row.sqlExpression.replace(/"/g, '""')}",${row.value}`;
  }).join('\n');
  
  fs.writeFileSync('po-admin-rows.csv', csvHeader + csvRows);
  
  // Create markdown file for documentation
  let markdown = '# Purchase Order Admin Spreadsheet Rows\n\n';
  markdown += 'This document contains rows for the admin spreadsheet to retrieve purchase order data from the POR database.\n\n';
  
  // Group by chart name
  const chartGroups: Record<string, AdminRow[]> = {};
  allRows.forEach(row => {
    if (!chartGroups[row.chartName]) {
      chartGroups[row.chartName] = [];
    }
    chartGroups[row.chartName].push(row);
  });
  
  // Create markdown sections for each chart
  Object.entries(chartGroups).forEach(([chartName, rows]) => {
    markdown += `## ${chartName}\n\n`;
    markdown += '| Variable Name | Server | Table | SQL Expression |\n';
    markdown += '|---------------|--------|-------|---------------|\n';
    
    rows.forEach(row => {
      markdown += `| ${row.variableName} | ${row.server} | ${row.tableName} | \`${row.sqlExpression}\` |\n`;
    });
    
    markdown += '\n';
  });
  
  fs.writeFileSync('po-admin-rows.md', markdown);
  
  console.log(`Generated ${allRows.length} admin spreadsheet rows`);
  console.log('Files created:');
  console.log('- po-admin-rows.json (for programmatic import)');
  console.log('- po-admin-rows.csv (for spreadsheet import)');
  console.log('- po-admin-rows.md (for documentation)');
}

// Run the generator
generateAllRows();
