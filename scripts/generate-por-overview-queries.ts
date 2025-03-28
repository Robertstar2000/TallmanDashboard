/**
 * Generate POR Overview Chart SQL Queries
 * 
 * This script generates MS Access SQL queries for the POR Overview chart in the admin spreadsheet.
 * It creates queries for:
 * 1. New Rentals (12 months) - This month's POs minus previous month's open POs
 * 2. Open Rentals (12 months) - Total number of POs in a given month
 * 3. Rental Value (12 months) - Total value of open POs
 */

import fs from 'fs';

// Helper function to format date as #MM/DD/YYYY# for MS Access
function formatAccessDate(date: Date): string {
  const month = String(date.getMonth() + 1);
  const day = String(date.getDate());
  const year = date.getFullYear();
  return `#${month}/${day}/${year}#`;
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

// Generate SQL for new rentals (12 months)
// New Rentals = This month's POs - Previous month's open POs
function generateNewRentalsSQL(): AdminRow[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  const rows: AdminRow[] = [];
  
  // Generate for 12 months
  for (let i = 0; i < 12; i++) {
    // Calculate the target month
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;
    
    // Adjust for previous year if needed
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    // Calculate previous month
    let prevMonth = targetMonth - 1;
    let prevYear = targetYear;
    if (prevMonth <= 0) {
      prevMonth += 12;
      prevYear -= 1;
    }
    
    // Calculate start and end dates for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0); // Last day of the month
    
    // Calculate start and end dates for the previous month
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0); // Last day of the previous month
    
    const monthName = startDate.toLocaleString('default', { month: 'long' });
    const shortYear = targetYear.toString().slice(-2);
    
    // SQL for this month's new POs (MS Access syntax)
    const thisMonthSql = `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= ${formatAccessDate(startDate)} 
                          AND [Date] <= ${formatAccessDate(endDate)})`;
    
    // SQL for previous month's open POs (MS Access syntax)
    const prevMonthSql = `(SELECT Count(*) FROM PurchaseOrder 
                          WHERE [Date] >= ${formatAccessDate(prevStartDate)} 
                          AND [Date] <= ${formatAccessDate(prevEndDate)}
                          AND [Status] <> 'Closed')`;
    
    // Final SQL: This month's POs - Previous month's open POs
    const sql = `${thisMonthSql} - ${prevMonthSql}`;
    
    rows.push({
      chartName: "POR Overview",
      variableName: `New Rentals ${monthName} '${shortYear}`,
      server: "POR",
      tableName: "PurchaseOrder",
      sqlExpression: sql,
      value: 0
    });
  }
  
  return rows;
}

// Generate SQL for open rentals (12 months)
// Open Rentals = Total number of POs in a given month
function generateOpenRentalsSQL(): AdminRow[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  const rows: AdminRow[] = [];
  
  // Generate for 12 months
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
    
    // SQL for total POs in the month (MS Access syntax)
    const sql = `SELECT Count(*) FROM PurchaseOrder 
                WHERE [Date] >= ${formatAccessDate(startDate)} 
                AND [Date] <= ${formatAccessDate(endDate)}`;
    
    rows.push({
      chartName: "POR Overview",
      variableName: `Open Rentals ${monthName} '${shortYear}`,
      server: "POR",
      tableName: "PurchaseOrder",
      sqlExpression: sql,
      value: 0
    });
  }
  
  return rows;
}

// Generate SQL for rental value (12 months)
// Rental Value = Total value of open POs
function generateRentalValueSQL(): AdminRow[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  const rows: AdminRow[] = [];
  
  // Generate for 12 months
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
    
    // SQL for total value of POs in the month (MS Access syntax)
    // Using ShippingCost as the amount field based on our PORTables.md analysis
    const sql = `SELECT Sum([ShippingCost]) FROM PurchaseOrder 
                WHERE [Date] >= ${formatAccessDate(startDate)} 
                AND [Date] <= ${formatAccessDate(endDate)}`;
    
    rows.push({
      chartName: "POR Overview",
      variableName: `Rental Value ${monthName} '${shortYear}`,
      server: "POR",
      tableName: "PurchaseOrder",
      sqlExpression: sql,
      value: 0
    });
  }
  
  return rows;
}

// Generate all admin rows
function generateAllRows(): void {
  const newRentalsRows = generateNewRentalsSQL();
  const openRentalsRows = generateOpenRentalsSQL();
  const rentalValueRows = generateRentalValueSQL();
  
  const allRows = [
    ...newRentalsRows,
    ...openRentalsRows,
    ...rentalValueRows
  ];
  
  // Create JSON file
  fs.writeFileSync('por-overview-rows.json', JSON.stringify(allRows, null, 2));
  
  // Create CSV file
  const csvHeader = 'ChartName,VariableName,Server,TableName,SQLExpression,Value\n';
  const csvRows = allRows.map(row => {
    return `"${row.chartName}","${row.variableName}","${row.server}","${row.tableName}","${row.sqlExpression.replace(/"/g, '""')}",${row.value}`;
  }).join('\n');
  
  fs.writeFileSync('por-overview-rows.csv', csvHeader + csvRows);
  
  // Create markdown file for documentation
  let markdown = '# POR Overview Chart SQL Queries (MS Access)\n\n';
  markdown += 'This document contains MS Access SQL queries for the POR Overview chart in the admin spreadsheet.\n\n';
  
  // Group by variable type
  const variableGroups = {
    'New Rentals': newRentalsRows,
    'Open Rentals': openRentalsRows,
    'Rental Value': rentalValueRows
  };
  
  // Create markdown sections for each variable type
  Object.entries(variableGroups).forEach(([groupName, rows]) => {
    markdown += `## ${groupName}\n\n`;
    markdown += '| Month | SQL Expression |\n';
    markdown += '|-------|---------------|\n';
    
    rows.forEach(row => {
      const monthPart = row.variableName.replace(`${groupName} `, '');
      markdown += `| ${monthPart} | \`${row.sqlExpression}\` |\n`;
    });
    
    markdown += '\n';
  });
  
  fs.writeFileSync('por-overview-queries.md', markdown);
  
  console.log(`Generated ${allRows.length} admin spreadsheet rows for POR Overview chart`);
  console.log('Files created:');
  console.log('- por-overview-rows.json (for programmatic import)');
  console.log('- por-overview-rows.csv (for spreadsheet import)');
  console.log('- por-overview-queries.md (for documentation)');
}

// Run the generator
generateAllRows();
