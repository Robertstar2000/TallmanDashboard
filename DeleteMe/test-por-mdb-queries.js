const MDBReader = require('mdb-reader');
const fs = require('fs');
const path = require('path');

// Output file path
const outputFilePath = path.join(__dirname, 'por-mdb-query-results.txt');

// Path to the Access database file
// Note: You'll need to update this path to point to your actual .mdb file
const mdbFilePath = path.join(__dirname, 'por_database.mdb');

// Function to write to the output file
function writeToFile(message) {
  fs.appendFileSync(outputFilePath, message + '\n');
  console.log(message);
}

// Clear the output file if it exists
if (fs.existsSync(outputFilePath)) {
  fs.unlinkSync(outputFilePath);
}

writeToFile('=== POR MDB Query Test ===');
writeToFile(`Starting test at ${new Date().toISOString()}`);

// Check if the MDB file exists
if (!fs.existsSync(mdbFilePath)) {
  writeToFile(`❌ ERROR: MDB file not found at ${mdbFilePath}`);
  writeToFile('Please update the mdbFilePath variable to point to your actual .mdb file');
  process.exit(1);
}

try {
  // Open the MDB file
  writeToFile(`Opening MDB file: ${mdbFilePath}`);
  const reader = new MDBReader(fs.readFileSync(mdbFilePath));
  
  // Get the table names
  const tableNames = reader.getTableNames();
  writeToFile(`Tables found in the database: ${tableNames.join(', ')}`);
  
  // Check if PurchaseOrder table exists
  if (!tableNames.includes('PurchaseOrder')) {
    writeToFile('❌ WARNING: PurchaseOrder table not found in the database');
    writeToFile(`Available tables: ${tableNames.join(', ')}`);
    
    // Try to find a table that might contain purchase order data
    const potentialTables = tableNames.filter(name => 
      name.toLowerCase().includes('purchase') || 
      name.toLowerCase().includes('order') || 
      name.toLowerCase().includes('po')
    );
    
    if (potentialTables.length > 0) {
      writeToFile(`Potential tables that might contain purchase order data: ${potentialTables.join(', ')}`);
    }
  } else {
    // Get the PurchaseOrder table
    const purchaseOrderTable = reader.getTable('PurchaseOrder');
    const columnNames = purchaseOrderTable.getColumnNames();
    writeToFile(`Columns in PurchaseOrder table: ${columnNames.join(', ')}`);
    
    // Get the first few records to understand the data structure
    const records = purchaseOrderTable.getData(5);
    writeToFile('Sample records from PurchaseOrder table:');
    records.forEach((record, index) => {
      writeToFile(`Record ${index + 1}: ${JSON.stringify(record)}`);
    });
    
    // Check for key columns needed for our queries
    const requiredColumns = ['Date', 'Status', 'ShippingCost', 'VendorNumber', 'Store'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      writeToFile(`❌ WARNING: The following required columns are missing: ${missingColumns.join(', ')}`);
      writeToFile('This will affect our ability to run the queries as designed');
      
      // Try to find alternative column names
      missingColumns.forEach(missingCol => {
        const alternatives = columnNames.filter(col => 
          col.toLowerCase().includes(missingCol.toLowerCase()) || 
          (missingCol === 'Date' && (col.toLowerCase().includes('date') || col.toLowerCase().includes('time'))) ||
          (missingCol === 'Status' && (col.toLowerCase().includes('status') || col.toLowerCase().includes('state'))) ||
          (missingCol === 'ShippingCost' && (col.toLowerCase().includes('shipping') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('price'))) ||
          (missingCol === 'VendorNumber' && (col.toLowerCase().includes('vendor') || col.toLowerCase().includes('supplier'))) ||
          (missingCol === 'Store' && (col.toLowerCase().includes('store') || col.toLowerCase().includes('location')))
        );
        
        if (alternatives.length > 0) {
          writeToFile(`Potential alternatives for ${missingCol}: ${alternatives.join(', ')}`);
        }
      });
    } else {
      writeToFile('✅ All required columns are present in the PurchaseOrder table');
    }
    
    // Generate updated queries based on the actual table structure
    writeToFile('\n=== Updated POR Queries ===');
    
    // Check if Date column exists and get its format
    if (columnNames.includes('Date')) {
      // Count records by month to see data distribution
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Simple count of records
      const totalRecords = purchaseOrderTable.getRowCount();
      writeToFile(`Total records in PurchaseOrder table: ${totalRecords}`);
      
      // Generate updated queries
      writeToFile('\n=== Recommended Query Updates ===');
      
      // POR Overview - New Rentals
      writeToFile('\n1. POR Overview - New Rentals - Current Month:');
      writeToFile('Original: (SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= #3/1/2025# AND [Date] <= #3/31/2025#) - (SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= #2/1/2025# AND [Date] <= #2/28/2025# AND [Status] <> \'Closed\')');
      writeToFile('Updated: SELECT (SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) AND [Date] <= DateAdd(\'m\', 1, DateSerial(Year(Date()), Month(Date()), 1))-1) - (SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date())-1, 1) AND [Date] <= DateSerial(Year(Date()), Month(Date()), 1)-1 AND [Status] <> \'Closed\') AS value');
      
      // POR Overview - Open Rentals
      writeToFile('\n2. POR Overview - Open Rentals - Current Month:');
      writeToFile('Original: SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= #3/1/2025# AND [Date] <= #3/31/2025#');
      writeToFile('Updated: SELECT Count(*) AS value FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) AND [Date] <= DateAdd(\'m\', 1, DateSerial(Year(Date()), Month(Date()), 1))-1 AND [Status] <> \'Closed\'');
      
      // POR Overview - Rental Value
      writeToFile('\n3. POR Overview - Rental Value - Current Month:');
      writeToFile('Original: SELECT Sum([ShippingCost]) FROM PurchaseOrder WHERE [Date] >= #3/1/2025# AND [Date] <= #3/31/2025#');
      writeToFile('Updated: SELECT Sum(IIf(IsNull([ShippingCost]), 0, [ShippingCost])) AS value FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) AND [Date] <= DateAdd(\'m\', 1, DateSerial(Year(Date()), Month(Date()), 1))-1');
      
      // Vendor Analysis
      writeToFile('\n4. Vendor Analysis - Top 5 Vendors:');
      writeToFile('Original: SELECT TOP 5 VendorNumber, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= #1/1/2025# GROUP BY VendorNumber ORDER BY Count DESC');
      writeToFile('Updated: SELECT TOP 5 VendorNumber, COUNT(*) AS value FROM PurchaseOrder WHERE Date >= DateSerial(Year(Date())-1, Month(Date()), 1) GROUP BY VendorNumber ORDER BY value DESC');
      
      // PO Status
      writeToFile('\n5. PO Status - Status Distribution:');
      writeToFile('Original: SELECT Status, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= #1/1/2025# GROUP BY Status');
      writeToFile('Updated: SELECT Status, COUNT(*) AS value FROM PurchaseOrder WHERE Date >= DateSerial(Year(Date())-1, Month(Date()), 1) GROUP BY Status');
      
      // Store Analysis
      writeToFile('\n6. Store Analysis - PO by Store:');
      writeToFile('Original: SELECT Store, COUNT(*) AS Count FROM PurchaseOrder WHERE Date >= #1/1/2025# GROUP BY Store');
      writeToFile('Updated: SELECT IIf(IsNull([Store]), \'Unknown\', [Store]) AS Store, COUNT(*) AS value FROM PurchaseOrder WHERE Date >= DateSerial(Year(Date())-1, Month(Date()), 1) GROUP BY IIf(IsNull([Store]), \'Unknown\', [Store])');
    } else {
      writeToFile('❌ Date column not found, cannot generate date-based queries');
    }
  }
  
  writeToFile(`\n=== Test completed at ${new Date().toISOString()} ===`);
  writeToFile(`Results have been saved to: ${outputFilePath}`);
} catch (error) {
  writeToFile(`\n❌ ERROR: ${error.message}`);
  writeToFile(`Stack trace: ${error.stack}`);
}
