const fs = require('fs');
const path = require('path');

// Output file path
const outputFilePath = path.join(__dirname, 'updated-por-queries.txt');

// Function to write to the output file
function writeToFile(message) {
  fs.appendFileSync(outputFilePath, message + '\n');
  console.log(message);
}

// Clear the output file if it exists
if (fs.existsSync(outputFilePath)) {
  fs.unlinkSync(outputFilePath);
}

writeToFile('=== Updated POR Queries ===');
writeToFile(`Generated at ${new Date().toISOString()}\n`);

// Define the original and updated queries
const queries = [
  // POR Overview - New Rentals
  {
    name: "POR Overview - New Rentals - Current Month",
    originalQuery: "(SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= #3/1/2025# AND [Date] <= #3/31/2025#) - (SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= #2/1/2025# AND [Date] <= #2/28/2025# AND [Status] <> 'Closed')",
    updatedQuery: "SELECT (SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) AND [Date] <= DateAdd('m', 1, DateSerial(Year(Date()), Month(Date()), 1))-1) - (SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date())-1, 1) AND [Date] <= DateSerial(Year(Date()), Month(Date()), 1)-1 AND [Status] <> 'Closed') AS value",
    tableName: "PurchaseOrder",
    explanation: "Uses DateSerial and DateAdd functions to dynamically calculate the current month's date range instead of hardcoded dates. This ensures the query always returns data for the current month."
  },
  
  // POR Overview - Open Rentals
  {
    name: "POR Overview - Open Rentals - Current Month",
    originalQuery: "SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= #3/1/2025# AND [Date] <= #3/31/2025#",
    updatedQuery: "SELECT Count(*) AS value FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) AND [Date] <= DateAdd('m', 1, DateSerial(Year(Date()), Month(Date()), 1))-1 AND [Status] <> 'Closed'",
    tableName: "PurchaseOrder",
    explanation: "Uses DateSerial and DateAdd functions for dynamic date ranges and adds a filter for non-closed orders to ensure we're only counting open rentals."
  },
  
  // POR Overview - Rental Value
  {
    name: "POR Overview - Rental Value - Current Month",
    originalQuery: "SELECT Sum([ShippingCost]) FROM PurchaseOrder WHERE [Date] >= #3/1/2025# AND [Date] <= #3/31/2025#",
    updatedQuery: "SELECT Sum(IIf(IsNull([ShippingCost]), 0, [ShippingCost])) AS value FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) AND [Date] <= DateAdd('m', 1, DateSerial(Year(Date()), Month(Date()), 1))-1",
    tableName: "PurchaseOrder",
    explanation: "Uses IIf and IsNull functions to handle NULL values in ShippingCost, ensuring we always get a numeric result even if some records have NULL values."
  },
  
  // Vendor Analysis
  {
    name: "Vendor Analysis - Top 5 Vendors",
    originalQuery: "SELECT TOP 5 VendorNumber, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= #1/1/2025# GROUP BY VendorNumber ORDER BY Count DESC",
    updatedQuery: "SELECT TOP 5 VendorNumber, COUNT(*) AS value FROM PurchaseOrder WHERE Date >= DateSerial(Year(Date())-1, Month(Date()), 1) GROUP BY VendorNumber ORDER BY value DESC",
    tableName: "PurchaseOrder",
    explanation: "Uses DateSerial to look back one year from the current date, ensuring we always have data. Changed Count to value for consistency with other queries."
  },
  
  // PO Status
  {
    name: "PO Status - Status Distribution",
    originalQuery: "SELECT Status, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= #1/1/2025# GROUP BY Status",
    updatedQuery: "SELECT Status, COUNT(*) AS value FROM PurchaseOrder WHERE Date >= DateSerial(Year(Date())-1, Month(Date()), 1) GROUP BY Status",
    tableName: "PurchaseOrder",
    explanation: "Uses DateSerial to look back one year from the current date, ensuring we always have data. Changed Count to value for consistency with other queries."
  },
  
  // Store Analysis
  {
    name: "Store Analysis - PO by Store",
    originalQuery: "SELECT Store, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= #1/1/2025# GROUP BY Store",
    updatedQuery: "SELECT IIf(IsNull([Store]), 'Unknown', [Store]) AS Store, COUNT(*) AS value FROM PurchaseOrder WHERE Date >= DateSerial(Year(Date())-1, Month(Date()), 1) GROUP BY IIf(IsNull([Store]), 'Unknown', [Store])",
    tableName: "PurchaseOrder",
    explanation: "Uses IIf and IsNull to handle NULL values in the Store field, replacing them with 'Unknown'. This ensures we don't lose any data points in our analysis."
  }
];

// Write the queries to the output file
queries.forEach(query => {
  writeToFile(`=== ${query.name} ===`);
  writeToFile(`Table: ${query.tableName}`);
  writeToFile(`Original Query: ${query.originalQuery}`);
  writeToFile(`Updated Query: ${query.updatedQuery}`);
  writeToFile(`Explanation: ${query.explanation}`);
  writeToFile('');
});

writeToFile('=== Recommendations for POR Queries ===');
writeToFile('1. Use DateSerial and DateAdd functions instead of hardcoded dates to ensure queries always return current data');
writeToFile('2. Use IIf and IsNull functions to handle NULL values in fields like ShippingCost and Store');
writeToFile('3. Ensure all queries return results in a column named "value" for consistency with the dashboard');
writeToFile('4. For historical data, use DateSerial(Year(Date())-1, Month(Date()), 1) to look back one year from the current date');
writeToFile('5. Add appropriate filters (e.g., [Status] <> \'Closed\') to ensure queries return meaningful data');

console.log(`Updated POR queries have been saved to: ${outputFilePath}`);
