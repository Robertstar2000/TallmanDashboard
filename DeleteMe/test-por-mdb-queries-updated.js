const MDBReader = require('mdb-reader');
const fs = require('fs');
const path = require('path');

// Output file path
const outputFilePath = path.join(__dirname, 'por-mdb-query-results.txt');

// Function to write to the output file
function writeToFile(message) {
  fs.appendFileSync(outputFilePath, message + '\n');
  console.log(message);
}

// Clear the output file if it exists
if (fs.existsSync(outputFilePath)) {
  fs.unlinkSync(outputFilePath);
}

writeToFile('=== POR MDB Queries Test ===');
writeToFile(`Starting test at ${new Date().toISOString()}`);

// Path to the MDB file - update this to the actual path
const mdbFilePath = path.join(__dirname, 'data', 'por.mdb');

// Check if the MDB file exists
if (!fs.existsSync(mdbFilePath)) {
  writeToFile(`❌ ERROR: MDB file not found at ${mdbFilePath}`);
  writeToFile('Please ensure the POR database file exists at the specified path.');
  writeToFile('Alternatively, provide the correct path to the POR database file.');
  
  // Search for MDB files in the project directory
  writeToFile('\nSearching for MDB files in the project directory...');
  
  function findMdbFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        findMdbFiles(filePath, fileList);
      } else if (path.extname(file).toLowerCase() === '.mdb') {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  }
  
  try {
    const mdbFiles = findMdbFiles(__dirname);
    if (mdbFiles.length > 0) {
      writeToFile(`Found ${mdbFiles.length} MDB files:`);
      mdbFiles.forEach(file => {
        writeToFile(`  ${file}`);
      });
      writeToFile('\nPlease update the mdbFilePath variable with the correct path.');
    } else {
      writeToFile('No MDB files found in the project directory.');
      writeToFile('Please ensure the POR database file is available in the project.');
    }
  } catch (error) {
    writeToFile(`Error searching for MDB files: ${error.message}`);
  }
  
  process.exit(1);
}

try {
  writeToFile(`Opening MDB file: ${mdbFilePath}`);
  const reader = new MDBReader(fs.readFileSync(mdbFilePath));
  
  // Get all table names
  const tableNames = reader.getTableNames();
  writeToFile(`Tables found in the database (${tableNames.length}):`);
  tableNames.forEach(tableName => {
    writeToFile(`  ${tableName}`);
  });
  
  // Check if PurchaseOrder table exists
  if (!tableNames.includes('PurchaseOrder')) {
    writeToFile('\n❌ ERROR: PurchaseOrder table not found in the database.');
    writeToFile('Available tables:');
    tableNames.forEach(tableName => {
      writeToFile(`  ${tableName}`);
    });
    
    // Try to find a similar table
    const possibleTables = tableNames.filter(name => 
      name.toLowerCase().includes('purchase') || 
      name.toLowerCase().includes('order') || 
      name.toLowerCase().includes('po')
    );
    
    if (possibleTables.length > 0) {
      writeToFile('\nPossible alternative tables found:');
      possibleTables.forEach(tableName => {
        writeToFile(`  ${tableName}`);
      });
      
      // Check the first possible table
      const alternativeTable = possibleTables[0];
      writeToFile(`\nExamining alternative table: ${alternativeTable}`);
      
      const table = reader.getTable(alternativeTable);
      const columns = table.getColumnNames();
      writeToFile(`Columns in ${alternativeTable} (${columns.length}):`);
      columns.forEach(column => {
        writeToFile(`  ${column}`);
      });
      
      // Get sample data
      const records = table.getData();
      writeToFile(`\nSample data from ${alternativeTable} (first 5 records):`);
      records.slice(0, 5).forEach(record => {
        writeToFile(`  ${JSON.stringify(record)}`);
      });
    } else {
      writeToFile('\nNo similar tables found. Please check the database structure.');
    }
    
    process.exit(1);
  }
  
  // Get the PurchaseOrder table
  const purchaseOrderTable = reader.getTable('PurchaseOrder');
  
  // Get column names
  const columns = purchaseOrderTable.getColumnNames();
  writeToFile(`\nColumns in PurchaseOrder table (${columns.length}):`);
  columns.forEach(column => {
    writeToFile(`  ${column}`);
  });
  
  // Check for required columns
  const requiredColumns = ['Date', 'Status', 'VendorNumber', 'ShippingCost', 'Store'];
  const missingColumns = requiredColumns.filter(col => !columns.includes(col));
  
  if (missingColumns.length > 0) {
    writeToFile(`\n⚠️ WARNING: Some required columns are missing: ${missingColumns.join(', ')}`);
    
    // Find similar columns
    missingColumns.forEach(missingCol => {
      const similarColumns = columns.filter(col => 
        col.toLowerCase().includes(missingCol.toLowerCase()) ||
        missingCol.toLowerCase().includes(col.toLowerCase())
      );
      
      if (similarColumns.length > 0) {
        writeToFile(`  Similar columns for ${missingCol}: ${similarColumns.join(', ')}`);
      }
    });
  } else {
    writeToFile('\n✅ All required columns are present in the PurchaseOrder table.');
  }
  
  // Get sample data
  const records = purchaseOrderTable.getData();
  writeToFile(`\nSample data from PurchaseOrder table (first 5 records):`);
  records.slice(0, 5).forEach(record => {
    writeToFile(`  ${JSON.stringify(record)}`);
  });
  
  // Analyze date distribution
  writeToFile('\nAnalyzing date distribution...');
  
  // Group records by year-month
  const dateDistribution = {};
  records.forEach(record => {
    if (record.Date) {
      const date = new Date(record.Date);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dateDistribution[yearMonth]) {
        dateDistribution[yearMonth] = 0;
      }
      
      dateDistribution[yearMonth]++;
    }
  });
  
  // Sort by year-month
  const sortedMonths = Object.keys(dateDistribution).sort();
  
  writeToFile('Records by month:');
  sortedMonths.forEach(month => {
    writeToFile(`  ${month}: ${dateDistribution[month]} records`);
  });
  
  // Analyze status distribution
  writeToFile('\nAnalyzing status distribution...');
  
  const statusDistribution = {};
  records.forEach(record => {
    const status = record.Status || 'Unknown';
    
    if (!statusDistribution[status]) {
      statusDistribution[status] = 0;
    }
    
    statusDistribution[status]++;
  });
  
  writeToFile('Records by status:');
  Object.keys(statusDistribution).forEach(status => {
    writeToFile(`  ${status}: ${statusDistribution[status]} records`);
  });
  
  // Test our updated queries
  writeToFile('\n=== Testing Updated POR Queries ===');
  
  // Since we can't directly execute SQL with mdb-reader, we'll simulate the queries
  // by filtering the data in JavaScript
  
  // Helper function to get the current date
  function getCurrentDate() {
    return new Date();
  }
  
  // Helper function to get the first day of a month
  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1);
  }
  
  // Helper function to get the last day of a month
  function getLastDayOfMonth(year, month) {
    return new Date(year, month + 1, 0);
  }
  
  // Test Query 1: New Rentals - Current Month
  writeToFile('\n=== Testing query: POR Overview - New Rentals - Current Month ===');
  writeToFile('SQL: SELECT (SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) AND [Date] <= DateAdd(\'m\', 1, DateSerial(Year(Date()), Month(Date()), 1))-1) - (SELECT Count(*) FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date())-1, 1) AND [Date] <= DateSerial(Year(Date()), Month(Date()), 1)-1 AND [Status] <> \'Closed\') AS value');
  
  try {
    const now = getCurrentDate();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Current month date range
    const currentMonthStart = getFirstDayOfMonth(currentYear, currentMonth);
    const currentMonthEnd = getLastDayOfMonth(currentYear, currentMonth);
    
    // Previous month date range
    const prevMonthStart = getFirstDayOfMonth(currentYear, currentMonth - 1);
    const prevMonthEnd = getLastDayOfMonth(currentYear, currentMonth - 1);
    
    // Count records for current month
    const currentMonthCount = records.filter(record => {
      if (!record.Date) return false;
      const date = new Date(record.Date);
      return date >= currentMonthStart && date <= currentMonthEnd;
    }).length;
    
    // Count open records for previous month
    const prevMonthOpenCount = records.filter(record => {
      if (!record.Date) return false;
      const date = new Date(record.Date);
      return date >= prevMonthStart && date <= prevMonthEnd && record.Status !== 'Closed';
    }).length;
    
    const newRentalsValue = currentMonthCount - prevMonthOpenCount;
    
    writeToFile(`Current month records: ${currentMonthCount}`);
    writeToFile(`Previous month open records: ${prevMonthOpenCount}`);
    writeToFile(`New rentals value: ${newRentalsValue}`);
    
    if (newRentalsValue !== 0) {
      writeToFile(`✅ RETURNED NON-ZERO VALUE: ${newRentalsValue}`);
    } else {
      writeToFile('⚠️ WARNING: Returned zero value');
    }
  } catch (error) {
    writeToFile(`❌ Error executing query: ${error.message}`);
  }
  
  // Test Query 2: Open Rentals - Current Month
  writeToFile('\n=== Testing query: POR Overview - Open Rentals - Current Month ===');
  writeToFile('SQL: SELECT Count(*) AS value FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) AND [Date] <= DateAdd(\'m\', 1, DateSerial(Year(Date()), Month(Date()), 1))-1 AND [Status] <> \'Closed\'');
  
  try {
    const now = getCurrentDate();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Current month date range
    const currentMonthStart = getFirstDayOfMonth(currentYear, currentMonth);
    const currentMonthEnd = getLastDayOfMonth(currentYear, currentMonth);
    
    // Count open records for current month
    const currentMonthOpenCount = records.filter(record => {
      if (!record.Date) return false;
      const date = new Date(record.Date);
      return date >= currentMonthStart && date <= currentMonthEnd && record.Status !== 'Closed';
    }).length;
    
    writeToFile(`Current month open records: ${currentMonthOpenCount}`);
    
    if (currentMonthOpenCount !== 0) {
      writeToFile(`✅ RETURNED NON-ZERO VALUE: ${currentMonthOpenCount}`);
    } else {
      writeToFile('⚠️ WARNING: Returned zero value');
    }
  } catch (error) {
    writeToFile(`❌ Error executing query: ${error.message}`);
  }
  
  // Test Query 3: Rental Value - Current Month
  writeToFile('\n=== Testing query: POR Overview - Rental Value - Current Month ===');
  writeToFile('SQL: SELECT Sum(IIf(IsNull([ShippingCost]), 0, [ShippingCost])) AS value FROM PurchaseOrder WHERE [Date] >= DateSerial(Year(Date()), Month(Date()), 1) AND [Date] <= DateAdd(\'m\', 1, DateSerial(Year(Date()), Month(Date()), 1))-1');
  
  try {
    const now = getCurrentDate();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Current month date range
    const currentMonthStart = getFirstDayOfMonth(currentYear, currentMonth);
    const currentMonthEnd = getLastDayOfMonth(currentYear, currentMonth);
    
    // Sum shipping costs for current month
    const currentMonthShippingCost = records
      .filter(record => {
        if (!record.Date) return false;
        const date = new Date(record.Date);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .reduce((sum, record) => {
        return sum + (record.ShippingCost || 0);
      }, 0);
    
    writeToFile(`Current month shipping cost sum: ${currentMonthShippingCost}`);
    
    if (currentMonthShippingCost !== 0) {
      writeToFile(`✅ RETURNED NON-ZERO VALUE: ${currentMonthShippingCost}`);
    } else {
      writeToFile('⚠️ WARNING: Returned zero value');
    }
  } catch (error) {
    writeToFile(`❌ Error executing query: ${error.message}`);
  }
  
  // Test Query 4: Vendor Analysis - Top 5 Vendors
  writeToFile('\n=== Testing query: Vendor Analysis - Top 5 Vendors ===');
  writeToFile('SQL: SELECT TOP 5 IIf(IsNull([VendorNumber]), \'Unknown\', [VendorNumber]) AS VendorNumber, COUNT(*) AS value FROM PurchaseOrder WHERE Date >= DateSerial(Year(Date())-1, Month(Date()), 1) GROUP BY IIf(IsNull([VendorNumber]), \'Unknown\', [VendorNumber]) ORDER BY value DESC');
  
  try {
    const now = getCurrentDate();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    // Group by vendor
    const vendorCounts = {};
    records
      .filter(record => {
        if (!record.Date) return false;
        const date = new Date(record.Date);
        return date >= oneYearAgo;
      })
      .forEach(record => {
        const vendor = record.VendorNumber || 'Unknown';
        if (!vendorCounts[vendor]) {
          vendorCounts[vendor] = 0;
        }
        vendorCounts[vendor]++;
      });
    
    // Sort by count and get top 5
    const topVendors = Object.entries(vendorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([vendor, count]) => ({ VendorNumber: vendor, value: count }));
    
    writeToFile(`Top vendors (${topVendors.length}):`);
    topVendors.forEach(vendor => {
      writeToFile(`  ${vendor.VendorNumber}: ${vendor.value} records`);
    });
    
    if (topVendors.length > 0 && topVendors[0].value !== 0) {
      writeToFile(`✅ RETURNED NON-ZERO VALUE: ${topVendors[0].value}`);
    } else {
      writeToFile('⚠️ WARNING: Returned zero value or no results');
    }
  } catch (error) {
    writeToFile(`❌ Error executing query: ${error.message}`);
  }
  
  writeToFile('\n✅ Tests completed successfully');
  writeToFile(`Results have been saved to: ${outputFilePath}`);
  
} catch (error) {
  writeToFile(`\n❌ ERROR: ${error.message}`);
  writeToFile('Please check that the MDB file is valid and accessible.');
}
