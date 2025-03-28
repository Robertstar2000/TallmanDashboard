/**
 * Script to update the Accounts SQL expressions in the single-source-data.ts file
 * with the correct SQL expressions that query the ap_open_items table
 */

const fs = require('fs');
const path = require('path');

// Path to the single-source-data.ts file
const singleSourceFilePath = path.join(__dirname, '..', 'lib', 'db', 'single-source-data.ts');

// Read the single-source-data.ts file
console.log(`Reading single-source-data.ts file from: ${singleSourceFilePath}`);
const fileContent = fs.readFileSync(singleSourceFilePath, 'utf8');

// Parse the dashboardData array from the file
const dashboardDataMatch = fileContent.match(/export const dashboardData: SpreadsheetRow\[\] = (\[[\s\S]*?\]);/);
if (!dashboardDataMatch) {
  console.error('Could not find dashboardData array in the file');
  process.exit(1);
}

let dashboardData;
try {
  // Use Function constructor to safely evaluate the array
  dashboardData = new Function(`return ${dashboardDataMatch[1]}`)();
} catch (error) {
  console.error('Error parsing dashboardData array:', error);
  process.exit(1);
}

console.log(`Found ${dashboardData.length} items in dashboardData array`);

// Define the correct SQL expressions for Accounts data
const accountsPayableSql = (month) => `SELECT SUM(balance) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month}`;
const accountsReceivableSql = (month) => `SELECT SUM(balance) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month}`;
const accountsOverdueSql = (month) => `SELECT SUM(balance) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month} AND DATEDIFF(day, due_date, GETDATE()) > 30`;

// Map month names to numbers
const monthMap = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
};

// Update the SQL expressions for Accounts data
let updatedCount = 0;

dashboardData.forEach(item => {
  if (item.chartGroup === 'Accounts') {
    // Extract month from DataPoint (e.g., "Accounts Payable Jan" -> "Jan")
    const monthName = item.DataPoint.split(' ').pop();
    const monthNumber = monthMap[monthName];
    
    if (!monthNumber) {
      console.log(`Skipping item ${item.id} (${item.DataPoint}) - invalid month: ${monthName}`);
      return;
    }
    
    console.log(`Processing item ${item.id} (${item.DataPoint}) - month: ${monthName} (${monthNumber})`);
    
    // Determine which SQL expression to use based on the DataPoint
    if (item.DataPoint.includes('Payable')) {
      item.productionSqlExpression = accountsPayableSql(monthNumber);
      item.tableName = 'dbo.ap_open_items';
      updatedCount++;
    } else if (item.DataPoint.includes('Receivable')) {
      item.productionSqlExpression = accountsReceivableSql(monthNumber);
      item.tableName = 'dbo.ar_open_items';
      updatedCount++;
    } else if (item.DataPoint.includes('Overdue')) {
      item.productionSqlExpression = accountsOverdueSql(monthNumber);
      item.tableName = 'dbo.ar_open_items';
      updatedCount++;
    }
    
    // Update the lastUpdated timestamp
    item.lastUpdated = new Date().toISOString();
  }
});

console.log(`Updated ${updatedCount} Accounts SQL expressions`);

// Replace the dashboardData array in the file
const updatedFileContent = fileContent.replace(
  /export const dashboardData: SpreadsheetRow\[\] = \[[\s\S]*?\];/,
  `export const dashboardData: SpreadsheetRow[] = ${JSON.stringify(dashboardData, null, 2)};`
);

// Write the updated file
fs.writeFileSync(singleSourceFilePath, updatedFileContent);
console.log(`Updated single-source-data.ts file with correct Accounts SQL expressions`);
