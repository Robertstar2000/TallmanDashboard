const MDBReader = require('mdb-reader');
const fs = require('fs');
const path = require('path');

// Output file path
const outputFilePath = path.join(__dirname, 'por-mdb-connection-results.txt');

// Function to write to the output file
function writeToFile(message) {
  fs.appendFileSync(outputFilePath, message + '\n');
  console.log(message);
}

// Clear the output file if it exists
if (fs.existsSync(outputFilePath)) {
  fs.unlinkSync(outputFilePath);
}

writeToFile('=== POR MDB Connection Test ===');
writeToFile(`Starting test at ${new Date().toISOString()}`);

// Find all MDB files in the project directory
function findMdbFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory() && !filePath.includes('node_modules')) {
          findMdbFiles(filePath, fileList);
        } else if (path.extname(file).toLowerCase() === '.mdb') {
          fileList.push(filePath);
        }
      } catch (error) {
        // Skip files that can't be accessed
      }
    });
  } catch (error) {
    // Skip directories that can't be accessed
  }
  
  return fileList;
}

// Check if a specific MDB file path was provided as a command-line argument
let mdbFilePath = null;
if (process.argv.length > 2) {
  mdbFilePath = process.argv[2];
  writeToFile(`Using MDB file path from command-line argument: ${mdbFilePath}`);
  
  if (!fs.existsSync(mdbFilePath)) {
    writeToFile(`❌ ERROR: MDB file not found at ${mdbFilePath}`);
    mdbFilePath = null;
  }
}

// If no valid file path was provided, search for MDB files
if (!mdbFilePath) {
  writeToFile('Searching for MDB files in the project directory...');
  
  const mdbFiles = findMdbFiles(__dirname);
  
  if (mdbFiles.length > 0) {
    writeToFile(`Found ${mdbFiles.length} MDB files:`);
    mdbFiles.forEach((file, index) => {
      writeToFile(`  [${index + 1}] ${file}`);
    });
    
    // Use the first MDB file found for testing
    mdbFilePath = mdbFiles[0];
    writeToFile(`\nUsing the first MDB file for testing: ${mdbFilePath}`);
  } else {
    writeToFile('No MDB files found in the project directory.');
    writeToFile('\n=== INSTRUCTIONS FOR CONNECTING TO THE REAL POR DATABASE ===');
    writeToFile('1. Obtain the POR database file (*.mdb)');
    writeToFile('2. Place it in the "data" directory of this project');
    writeToFile('3. Run this script again with the path to the MDB file:');
    writeToFile('   node test-por-mdb-connection.js ./data/por.mdb');
    writeToFile('\nAlternatively, you can place the MDB file anywhere and provide the full path:');
    writeToFile('   node test-por-mdb-connection.js "C:/path/to/your/por.mdb"');
    
    process.exit(1);
  }
}

try {
  writeToFile(`\nOpening MDB file: ${mdbFilePath}`);
  const reader = new MDBReader(fs.readFileSync(mdbFilePath));
  
  // Get database metadata
  writeToFile('\n=== DATABASE METADATA ===');
  writeToFile(`File size: ${fs.statSync(mdbFilePath).size} bytes`);
  writeToFile(`Last modified: ${fs.statSync(mdbFilePath).mtime}`);
  
  // Get all table names
  const tableNames = reader.getTableNames();
  writeToFile(`\nTables found in the database (${tableNames.length}):`);
  tableNames.forEach(tableName => {
    writeToFile(`  ${tableName}`);
  });
  
  // Check if any tables exist
  if (tableNames.length === 0) {
    writeToFile('\n❌ ERROR: No tables found in the database.');
    writeToFile('This may not be a valid Access database or it may be empty.');
    process.exit(1);
  }
  
  // Look for PurchaseOrder table or similar
  const purchaseOrderTable = tableNames.find(name => name === 'PurchaseOrder');
  const similarTables = tableNames.filter(name => 
    name.toLowerCase().includes('purchase') || 
    name.toLowerCase().includes('order') || 
    name.toLowerCase().includes('po')
  );
  
  // Determine which table to analyze
  let tableToAnalyze = purchaseOrderTable;
  
  if (!tableToAnalyze && similarTables.length > 0) {
    tableToAnalyze = similarTables[0];
    writeToFile(`\nPurchaseOrder table not found, using similar table: ${tableToAnalyze}`);
  } else if (!tableToAnalyze) {
    // If no similar tables found, use the first table
    tableToAnalyze = tableNames[0];
    writeToFile(`\nNo PurchaseOrder or similar tables found, using first table: ${tableToAnalyze}`);
  }
  
  // Analyze the selected table
  writeToFile(`\n=== ANALYZING TABLE: ${tableToAnalyze} ===`);
  
  const table = reader.getTable(tableToAnalyze);
  
  // Get column information
  const columns = table.getColumnNames();
  writeToFile(`Columns in ${tableToAnalyze} table (${columns.length}):`);
  columns.forEach(column => {
    writeToFile(`  ${column}`);
  });
  
  // Get sample data
  const records = table.getData();
  writeToFile(`\nTotal records in ${tableToAnalyze} table: ${records.length}`);
  
  if (records.length > 0) {
    writeToFile(`\nSample data from ${tableToAnalyze} table (first 5 records):`);
    records.slice(0, 5).forEach((record, index) => {
      writeToFile(`\nRecord #${index + 1}:`);
      Object.entries(record).forEach(([key, value]) => {
        writeToFile(`  ${key}: ${value}`);
      });
    });
  } else {
    writeToFile(`\nNo records found in ${tableToAnalyze} table.`);
  }
  
  // Check for date fields
  const dateFields = columns.filter(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('time')
  );
  
  if (dateFields.length > 0) {
    writeToFile(`\nPotential date fields found: ${dateFields.join(', ')}`);
    
    // Analyze date distribution for the first date field
    const dateField = dateFields[0];
    writeToFile(`\nAnalyzing date distribution for field: ${dateField}`);
    
    // Group records by year-month
    const dateDistribution = {};
    records.forEach(record => {
      if (record[dateField]) {
        let dateValue = record[dateField];
        
        // Try to convert to Date if it's not already
        if (!(dateValue instanceof Date)) {
          try {
            dateValue = new Date(dateValue);
          } catch (error) {
            // Skip if not a valid date
            return;
          }
        }
        
        if (isNaN(dateValue.getTime())) {
          // Skip invalid dates
          return;
        }
        
        const yearMonth = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}`;
        
        if (!dateDistribution[yearMonth]) {
          dateDistribution[yearMonth] = 0;
        }
        
        dateDistribution[yearMonth]++;
      }
    });
    
    // Sort by year-month
    const sortedMonths = Object.keys(dateDistribution).sort();
    
    if (sortedMonths.length > 0) {
      writeToFile('Records by month:');
      sortedMonths.forEach(month => {
        writeToFile(`  ${month}: ${dateDistribution[month]} records`);
      });
    } else {
      writeToFile('No valid dates found in the date field.');
    }
  } else {
    writeToFile('\nNo date fields found in the table.');
  }
  
  // Check for status fields
  const statusFields = columns.filter(col => 
    col.toLowerCase().includes('status') || 
    col.toLowerCase().includes('state')
  );
  
  if (statusFields.length > 0) {
    writeToFile(`\nPotential status fields found: ${statusFields.join(', ')}`);
    
    // Analyze status distribution for the first status field
    const statusField = statusFields[0];
    writeToFile(`\nAnalyzing status distribution for field: ${statusField}`);
    
    // Group records by status
    const statusDistribution = {};
    records.forEach(record => {
      const status = record[statusField] || 'Unknown';
      
      if (!statusDistribution[status]) {
        statusDistribution[status] = 0;
      }
      
      statusDistribution[status]++;
    });
    
    if (Object.keys(statusDistribution).length > 0) {
      writeToFile('Records by status:');
      Object.keys(statusDistribution).forEach(status => {
        writeToFile(`  ${status}: ${statusDistribution[status]} records`);
      });
    } else {
      writeToFile('No status values found in the status field.');
    }
  } else {
    writeToFile('\nNo status fields found in the table.');
  }
  
  // Generate MS Access query examples based on the table structure
  writeToFile('\n=== MS ACCESS QUERY EXAMPLES ===');
  
  // Find key fields for queries
  const dateField = dateFields.length > 0 ? dateFields[0] : null;
  const statusField = statusFields.length > 0 ? statusFields[0] : null;
  const vendorField = columns.find(col => 
    col.toLowerCase().includes('vendor') || 
    col.toLowerCase().includes('supplier')
  );
  const costField = columns.find(col => 
    col.toLowerCase().includes('cost') || 
    col.toLowerCase().includes('price') || 
    col.toLowerCase().includes('amount') || 
    col.toLowerCase().includes('value')
  );
  
  writeToFile('\nBased on the table structure, here are example MS Access queries:');
  
  if (dateField) {
    writeToFile('\n1. Count records for the current month:');
    writeToFile(`SELECT Count(*) AS value FROM ${tableToAnalyze} WHERE [${dateField}] >= DateSerial(Year(Date()), Month(Date()), 1) AND [${dateField}] <= DateAdd('m', 1, DateSerial(Year(Date()), Month(Date()), 1))-1`);
    
    if (statusField) {
      writeToFile('\n2. Count open records (excluding closed status):');
      writeToFile(`SELECT Count(*) AS value FROM ${tableToAnalyze} WHERE [${dateField}] >= DateSerial(Year(Date()), Month(Date()), 1) AND [${dateField}] <= DateAdd('m', 1, DateSerial(Year(Date()), Month(Date()), 1))-1 AND [${statusField}] <> 'Closed'`);
    }
    
    if (vendorField) {
      writeToFile('\n3. Top 5 vendors by record count:');
      writeToFile(`SELECT TOP 5 IIf(IsNull([${vendorField}]), 'Unknown', [${vendorField}]) AS Vendor, COUNT(*) AS value FROM ${tableToAnalyze} WHERE [${dateField}] >= DateSerial(Year(Date())-1, Month(Date()), 1) GROUP BY IIf(IsNull([${vendorField}]), 'Unknown', [${vendorField}]) ORDER BY value DESC`);
    }
    
    if (costField) {
      writeToFile('\n4. Sum of costs for the current month:');
      writeToFile(`SELECT Sum(IIf(IsNull([${costField}]), 0, [${costField}])) AS value FROM ${tableToAnalyze} WHERE [${dateField}] >= DateSerial(Year(Date()), Month(Date()), 1) AND [${dateField}] <= DateAdd('m', 1, DateSerial(Year(Date()), Month(Date()), 1))-1`);
    }
    
    if (statusField) {
      writeToFile('\n5. Status distribution:');
      writeToFile(`SELECT IIf(IsNull([${statusField}]), 'Unknown', [${statusField}]) AS Status, COUNT(*) AS value FROM ${tableToAnalyze} WHERE [${dateField}] >= DateSerial(Year(Date())-1, Month(Date()), 1) GROUP BY IIf(IsNull([${statusField}]), 'Unknown', [${statusField}])`);
    }
  } else {
    writeToFile('\nNo date field found, so time-based queries cannot be generated.');
  }
  
  writeToFile('\n=== INSTRUCTIONS FOR USING THE REAL POR DATABASE ===');
  writeToFile('1. Update the mdbFilePath variable in your code to point to the real POR database');
  writeToFile('2. Verify the table and column names match those in the real database');
  writeToFile('3. Adjust the SQL queries to use the correct table and column names');
  writeToFile('4. Test the queries with the real database to ensure they return the expected results');
  
  writeToFile('\n✅ Tests completed successfully');
  writeToFile(`Results have been saved to: ${outputFilePath}`);
  
} catch (error) {
  writeToFile(`\n❌ ERROR: ${error.message}`);
  writeToFile('Please check that the MDB file is valid and accessible.');
}
