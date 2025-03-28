import fs from 'fs';
import path from 'path';

// Define the SpreadsheetRow interface
interface SpreadsheetRow {
  id: string;
  DataPoint: string;
  chartGroup: string;
  variableName: string;
  serverName: string;
  value: string;
  tableName: string;
  calculation: string;
  productionSqlExpression: string;
  lastUpdated: string;
}

// Path to the complete-chart-data.ts file
const chartDataPath = path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts');

// Read the file
let chartDataContent = fs.readFileSync(chartDataPath, 'utf8');

// Parse the file content to extract the JSON data
const startMarker = 'export const initialSpreadsheetData: SpreadsheetRow[] = [';
const endMarker = '];';

const startIndex = chartDataContent.indexOf(startMarker) + startMarker.length;
const endIndex = chartDataContent.lastIndexOf(endMarker);

const jsonContent = chartDataContent.substring(startIndex, endIndex);

// Parse the JSON content
const rows: SpreadsheetRow[] = JSON.parse(`[${jsonContent}]`);

// Update SQL expressions for POR Overview metrics
rows.forEach((row: SpreadsheetRow) => {
  if (row.chartGroup === 'POR Overview') {
    // Extract month from the DataPoint
    const monthMatch = row.DataPoint.match(/,\s*([A-Za-z]+)$/);
    const month = monthMatch ? monthMatch[1] : null;
    
    // Get month number
    const monthMap: { [key: string]: number } = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    
    const monthNumber = month ? monthMap[month] : null;
    
    // Update based on variable name
    if (row.variableName === 'New Rentals') {
      // Update for New Rentals
      row.tableName = 'Transactions';
      row.productionSqlExpression = `SELECT Count(*) as value FROM Transactions WHERE Month(DateCreated) = ${monthNumber} AND Year(DateCreated) = Year(Date())`;
    } 
    else if (row.variableName === 'Open Rentals') {
      // Update for Open Rentals
      row.tableName = 'Transactions';
      row.productionSqlExpression = `SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out')`;
      
      // Add month filter if needed
      if (monthNumber) {
        row.productionSqlExpression = `SELECT Count(*) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = ${monthNumber}`;
      }
    } 
    else if (row.variableName === 'Rental Value') {
      // Update for Rental Value
      row.tableName = 'Transactions';
      row.productionSqlExpression = `SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out')`;
      
      // Add month filter if needed
      if (monthNumber) {
        row.productionSqlExpression = `SELECT Sum(TotalAmount) as value FROM Transactions WHERE TransactionStatus IN ('Open', 'Active', 'Out') AND Month(DateCreated) = ${monthNumber}`;
      }
    }
    
    // Update lastUpdated
    row.lastUpdated = new Date().toISOString();
  }
});

// Rebuild the file content
const updatedJsonContent = rows.map(row => `  ${JSON.stringify(row, null, 2)}`).join(',\n  \n');
const updatedContent = `${chartDataContent.substring(0, startIndex)}\n  ${updatedJsonContent}\n${chartDataContent.substring(endIndex)}`;

// Write the updated content back to the file
fs.writeFileSync(chartDataPath, updatedContent, 'utf8');

console.log('POR SQL expressions updated successfully!');
