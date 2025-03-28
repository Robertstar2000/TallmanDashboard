// Script to generate complete chart data for all chart groups
const fs = require('fs');
const path = require('path');

// Define the chart group structure based on requirements
const chartGroups = [
  {
    name: 'AR Aging',
    variables: ['Amount Due'],
    steps: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
    serverName: 'P21',
    tableName: 'ar_aging',
    calculation: 'number'
  },
  {
    name: 'Accounts',
    variables: ['Payable', 'Receivable', 'Overdue'],
    steps: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    serverName: 'P21',
    tableName: 'accounts',
    calculation: 'number'
  },
  {
    name: 'Customer Metrics',
    variables: ['New Customers', 'Prospects'],
    steps: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    serverName: 'P21',
    tableName: 'customers',
    calculation: 'number'
  },
  {
    name: 'Daily Orders',
    variables: ['Orders'],
    steps: ['Today', 'Yesterday', 'Day-2', 'Day-3', 'Day-4', 'Day-5', 'Day-6'],
    serverName: 'P21',
    tableName: 'daily_orders',
    calculation: 'number'
  },
  {
    name: 'Historical Data',
    variables: ['P21', 'POR', 'Total'],
    steps: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    serverName: 'P21',
    tableName: 'historical_data',
    calculation: 'number'
  },
  {
    name: 'Inventory',
    variables: ['In Stock', 'On Order'],
    steps: ['Columbus', 'Addison', 'Lake City', 'Warehouse'],
    serverName: 'P21',
    tableName: 'inventory',
    calculation: 'number'
  },
  {
    name: 'Key Metrics',
    variables: ['Value'],
    steps: [
      'Total Orders', 'Open Orders', 'Shipped Orders', 
      'Total Sales', 'Average Order Value', 'Order Fill Rate', 'On-Time Delivery'
    ],
    serverName: 'P21',
    tableName: 'key_metrics',
    calculation: 'number'
  },
  {
    name: 'Site Distribution',
    variables: ['Inventory'],
    steps: ['Columbus', 'Addison', 'Lake City'],
    serverName: 'P21',
    tableName: 'site_distribution',
    calculation: 'number'
  },
  {
    name: 'POR Overview',
    variables: ['New Rentals', 'Open Rentals', 'Rental Value'],
    steps: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    serverName: 'POR',
    tableName: 'por_overview',
    calculation: 'number'
  },
  {
    name: 'Web Orders',
    variables: ['Orders'],
    steps: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    serverName: 'P21',
    tableName: 'web_orders',
    calculation: 'number'
  }
];

// Function to generate SQL expressions based on chart group, variable, and step
function generateSqlExpression(chartGroup, variable, step, serverName) {
  // Default SQL expressions based on chart group and server
  if (serverName === 'P21') {
    // P21 SQL syntax
    switch (chartGroup) {
      case 'AR Aging':
        return `SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = '${step}'`;
      
      case 'Accounts':
        return `SELECT SUM(amount) as value FROM dbo.${variable.toLowerCase()}_accounts WITH (NOLOCK) WHERE MONTH(transaction_date) = ${getMonthNumber(step)} AND YEAR(transaction_date) = YEAR(GETDATE())`;
      
      case 'Customer Metrics':
        if (variable === 'New Customers') {
          return `SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(created_date) = ${getMonthNumber(step)} AND YEAR(created_date) = YEAR(GETDATE())`;
        } else { // Prospects
          return `SELECT COUNT(*) as value FROM dbo.prospect WITH (NOLOCK) WHERE MONTH(created_date) = ${getMonthNumber(step)} AND YEAR(created_date) = YEAR(GETDATE())`;
        }
      
      case 'Daily Orders':
        const dayOffset = getDayOffset(step);
        return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date = DATEADD(day, -${dayOffset}, CAST(GETDATE() AS date))`;
      
      case 'Historical Data':
        if (variable === 'P21') {
          return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = ${getMonthNumber(step)} AND YEAR(order_date) = YEAR(GETDATE())`;
        } else if (variable === 'POR') {
          return `SELECT 0 as value`; // Placeholder for POR data in P21
        } else { // Total
          return `SELECT 0 as value`; // Placeholder for Total calculation
        }
      
      case 'Inventory':
        return `SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE warehouse_id = '${getWarehouseId(step)}' AND ${variable === 'On Order' ? 'qty_on_order' : 'qty_on_hand'} > 0`;
      
      case 'Key Metrics':
        switch (step) {
          case 'Total Orders':
            return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())`;
          case 'Open Orders':
            return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_status = 'Open'`;
          case 'Shipped Orders':
            return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_status = 'Shipped' AND ship_date >= DATEADD(day, -30, GETDATE())`;
          case 'Total Sales':
            return `SELECT SUM(order_amt) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())`;
          case 'Average Order Value':
            return `SELECT AVG(order_amt) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())`;
          case 'Order Fill Rate':
            return `SELECT CAST(COUNT(CASE WHEN line_status = 'Shipped' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as DECIMAL(10,2)) as value FROM dbo.oe_line WITH (NOLOCK) WHERE created_date >= DATEADD(day, -30, GETDATE())`;
          case 'On-Time Delivery':
            return `SELECT CAST(COUNT(CASE WHEN ship_date <= promised_date THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as DECIMAL(10,2)) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE ship_date IS NOT NULL AND order_date >= DATEADD(day, -30, GETDATE())`;
          default:
            return `SELECT 0 as value`;
        }
      
      case 'Site Distribution':
        return `SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE warehouse_id = '${getWarehouseId(step)}'`;
      
      case 'Web Orders':
        return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = ${getMonthNumber(step)} AND YEAR(order_date) = YEAR(GETDATE())`;
      
      default:
        return `SELECT 0 as value`;
    }
  } else if (serverName === 'POR') {
    // POR SQL syntax (MS Access/Jet SQL)
    switch (chartGroup) {
      case 'POR Overview':
        if (variable === 'New Rentals') {
          return `SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = ${getMonthNumber(step)} AND Year(CreatedDate) = Year(Date())`;
        } else if (variable === 'Open Rentals') {
          return `SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = ${getMonthNumber(step)} AND Year(CreatedDate) = Year(Date())`;
        } else { // Rental Value
          return `SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = ${getMonthNumber(step)} AND Year(CreatedDate) = Year(Date())`;
        }
      
      case 'Historical Data':
        if (variable === 'POR') {
          return `SELECT Count(*) as value FROM Rentals WHERE Month(CreatedDate) = ${getMonthNumber(step)} AND Year(CreatedDate) = Year(Date())`;
        } else {
          return `SELECT 0 as value`; // Placeholder for non-POR data
        }
      
      default:
        return `SELECT 0 as value`;
    }
  }
  
  return `SELECT 0 as value`; // Default fallback
}

// Helper function to get month number from month name
function getMonthNumber(monthName) {
  const months = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
  };
  return months[monthName] || 1;
}

// Helper function to get day offset from day name
function getDayOffset(dayName) {
  const days = {
    'Today': 0, 'Yesterday': 1, 'Day-2': 2, 'Day-3': 3, 'Day-4': 4, 'Day-5': 5, 'Day-6': 6
  };
  return days[dayName] || 0;
}

// Helper function to get warehouse ID from location name
function getWarehouseId(locationName) {
  const locations = {
    'Columbus': 'COL', 'Addison': 'ADD', 'Lake City': 'LKC', 'Warehouse': 'WHS'
  };
  return locations[locationName] || 'MAIN';
}

// Generate all chart data rows
function generateChartData() {
  let allRows = [];
  let id = 1;
  
  // For each chart group
  chartGroups.forEach(group => {
    // For each step (e.g., month, day, location)
    group.steps.forEach(step => {
      // For each variable (e.g., Payable, Receivable)
      group.variables.forEach(variable => {
        // Create a row for this combination
        const sqlExpression = generateSqlExpression(group.name, variable, step, group.serverName);
        
        allRows.push({
          id: id.toString(),
          name: `${group.name} - ${step} - ${variable}`,
          chartName: group.name,
          chartGroup: group.name,
          variableName: variable === 'Value' ? step : `${variable} ${step}`,
          serverName: group.serverName,
          value: "0",
          tableName: group.tableName,
          calculation: group.calculation,
          sqlExpression: sqlExpression,
          productionSqlExpression: sqlExpression,
          lastUpdated: new Date().toISOString()
        });
        
        id++;
      });
    });
  });
  
  return allRows;
}

// Generate TypeScript code for the chart data
function generateTypeScriptCode(rows) {
  const currentDate = new Date().toISOString();
  
  let code = `
import type { SpreadsheetRow } from './types';

// This file was auto-generated by the generate-complete-chart-data.js script
// Last updated: ${currentDate}

export const initialSpreadsheetData: SpreadsheetRow[] = ${JSON.stringify(rows, null, 2)};

// Export the combined data
export const combinedData = [...initialSpreadsheetData];
`;
  
  return code;
}

// Main function
function main() {
  try {
    // Generate all chart data rows
    const chartData = generateChartData();
    
    // Generate TypeScript code
    const tsCode = generateTypeScriptCode(chartData);
    
    // Write to file
    const outputPath = path.join(__dirname, 'lib', 'db', 'complete-chart-data.ts');
    fs.writeFileSync(outputPath, tsCode);
    
    console.log(`Generated ${chartData.length} chart data rows`);
    console.log(`Expected rows: ${chartGroups.reduce((total, group) => total + (group.variables.length * group.steps.length), 0)}`);
    console.log(`Output written to: ${outputPath}`);
    
    // Print summary of rows per chart group
    console.log('\nRows per chart group:');
    const groupCounts = {};
    chartData.forEach(row => {
      groupCounts[row.chartGroup] = (groupCounts[row.chartGroup] || 0) + 1;
    });
    
    Object.keys(groupCounts).sort().forEach(group => {
      console.log(`${group.padEnd(20)}: ${groupCounts[group]} rows`);
    });
    
  } catch (error) {
    console.error('Error generating chart data:', error);
  }
}

// Run the main function
main();
