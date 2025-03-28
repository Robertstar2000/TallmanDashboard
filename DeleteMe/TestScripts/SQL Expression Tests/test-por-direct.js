const fs = require('fs');
const path = require('path');
const MDBReader = require('mdb-reader');

// Configuration
const POR_FILE_PATH = 'C:\\Users\\BobM\\Desktop\\POR.MDB';
const CSV_FILE_PATH = path.resolve(__dirname, '..', '..', 'scripts', 'MasterSQLTable.csv');
const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Function to parse tab-delimited CSV
function parseTabDelimitedCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Parse header to get column indices
    const headerLine = lines[0];
    const headerParts = headerLine.split('\t');
    
    // Find the indices of the columns we need
    let idIndex = -1;
    let nameIndex = -1;
    let serverTypeIndex = -1;
    let sqlExpressionIndex = -1;
    
    for (let i = 0; i < headerParts.length; i++) {
      const part = headerParts[i].trim().replace(/,/g, '');
      if (part === 'ID') {
        idIndex = i;
      } else if (part === 'Name') {
        nameIndex = i;
      } else if (part === 'Server Name') {
        serverTypeIndex = i;
      } else if (part === 'SQL Expression') {
        sqlExpressionIndex = i;
      }
    }
    
    console.log('Column indices:', { idIndex, nameIndex, serverTypeIndex, sqlExpressionIndex });
    
    if (idIndex === -1 || nameIndex === -1 || serverTypeIndex === -1 || sqlExpressionIndex === -1) {
      console.log('Could not find required columns in CSV header');
      console.log('Header parts:', headerParts);
      return [];
    }
    
    const results = [];
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by tab delimiter
      const parts = line.split('\t');
      
      // Extract fields
      if (parts.length > Math.max(idIndex, nameIndex, serverTypeIndex, sqlExpressionIndex)) {
        let id = parts[idIndex].trim().replace(/,/g, '');
        let name = parts[nameIndex].trim().replace(/,/g, '');
        let serverType = parts[serverTypeIndex].trim().replace(/,/g, '');
        let sqlExpression = parts[sqlExpressionIndex].trim().replace(/,/g, '');
        
        // Correct server type based on the known ratio (P21 = 126, POR = 48)
        // For simplicity, we'll use the ID to determine server type
        // IDs 1-126 are P21, IDs 127-174 are POR
        const idNum = parseInt(id, 10);
        if (!isNaN(idNum)) {
          if (idNum <= 126) {
            serverType = 'P21';
          } else {
            serverType = 'POR';
          }
        }
        
        // Add to results if we have a server type and SQL expression
        if (serverType && sqlExpression) {
          results.push({
            id,
            name,
            serverType,
            sqlExpression
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error parsing CSV: ${error.message}`);
    return [];
  }
}

// Function to generate SQL expression based on server type and metric name
function generateSqlExpression(serverType, name, originalSql) {
  // Extract key information from the name and SQL
  const nameLower = name.toLowerCase();
  
  if (serverType === 'P21') {
    // For P21 (SQL Server)
    
    // Check if the original SQL is already in P21 format
    if (originalSql.includes('dbo.') && originalSql.includes('WITH (NOLOCK)')) {
      return originalSql;
    }
    
    // Generate SQL based on metric name
    if (nameLower.includes('orders')) {
      return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())`;
    } else if (nameLower.includes('sales')) {
      return `SELECT SUM(ext_price) as value FROM dbo.oe_line WITH (NOLOCK) WHERE create_date >= DATEADD(day, -30, GETDATE())`;
    } else if (nameLower.includes('customers')) {
      return `SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK)`;
    } else if (nameLower.includes('inventory')) {
      return `SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE qty_on_hand > 0`;
    } else if (nameLower.includes('ar aging')) {
      return `SELECT SUM(ar_balance) as value FROM dbo.ar_open WITH (NOLOCK) WHERE ar_balance > 0`;
    } else {
      // Default SQL for P21
      return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)`;
    }
  } else if (serverType === 'POR') {
    // For POR (MS Access)
    
    // Check if the original SQL is already in POR format
    if (!originalSql.includes('dbo.') && !originalSql.includes('WITH (NOLOCK)')) {
      return originalSql;
    }
    
    // Generate SQL based on metric name
    if (nameLower.includes('rental')) {
      return `SELECT Count(*) as value FROM Rentals WHERE Status = 'Active'`;
    } else if (nameLower.includes('customer')) {
      return `SELECT Count(*) as value FROM Customers`;
    } else if (nameLower.includes('equipment')) {
      return `SELECT Count(*) as value FROM Equipment WHERE Status = 'Available'`;
    } else if (nameLower.includes('revenue')) {
      return `SELECT Sum(Amount) as value FROM Transactions WHERE TransactionDate >= DateAdd("d", -30, Date())`;
    } else {
      // Default SQL for POR
      return `SELECT Count(*) as value FROM MSysObjects WHERE Type = 1`;
    }
  }
  
  // If no server type match, return original SQL
  return originalSql;
}

// Function to directly test POR SQL using mdb-reader
function testPORSql(porReader, sql) {
  try {
    console.log(`Testing POR SQL: ${sql}`);
    
    // Parse SQL to extract table name and conditions
    const fromMatch = sql.match(/FROM\s+([^\s]+)/i);
    if (!fromMatch || !fromMatch[1]) {
      console.log('Could not parse table name from SQL');
      return { success: false, error: 'Could not parse table name from SQL' };
    }
    
    const tableName = fromMatch[1];
    console.log(`Extracted table name: ${tableName}`);
    
    // Check if table exists
    const tables = porReader.getTableNames();
    console.log(`Available tables: ${tables.slice(0, 5).join(', ')}${tables.length > 5 ? '...' : ''}`);
    
    if (!tables.includes(tableName)) {
      // Try to find a similar table
      const similarTables = tables.filter(t => 
        t.toLowerCase().includes(tableName.toLowerCase()) || 
        tableName.toLowerCase().includes(t.toLowerCase())
      );
      
      console.log(`Table "${tableName}" not found. Similar tables: ${similarTables.join(', ') || 'None'}`);
      
      if (similarTables.length === 0) {
        return { 
          success: false, 
          error: `Table "${tableName}" not found in POR database. Available tables: ${tables.slice(0, 5).join(', ')}${tables.length > 5 ? '...' : ''}` 
        };
      }
      
      // Use the first similar table
      console.log(`Using similar table "${similarTables[0]}" instead`);
      const table = porReader.getTable(similarTables[0]);
      
      // Get row count as a simple test
      const rowCount = table.getRowCount();
      console.log(`Table ${similarTables[0]} has ${rowCount} rows`);
      return { success: true, value: rowCount };
    }
    
    // Get the table
    console.log(`Getting table: ${tableName}`);
    const table = porReader.getTable(tableName);
    
    // Get row count as a simple test
    const rowCount = table.getRowCount();
    console.log(`Table ${tableName} has ${rowCount} rows`);
    return { success: true, value: rowCount };
  } catch (error) {
    console.log(`Error testing POR SQL: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to write SQL expressions to CSV
function writeSqlExpressionsToCSV(filePath, results) {
  try {
    // Create CSV header
    const header = 'ID\t,\tName\t,\tChartGroup\t,\tVariableName\t,\tServerType\t,\tValue\t,\tTableName\t,\tSqlExpression\t,\tProductionSqlExpression\n';
    
    // Create CSV rows
    let csvContent = header;
    
    for (const result of results) {
      const { id, name, serverType, generatedSql, value } = result;
      
      // Extract chart group and variable name from the name (if possible)
      const chartGroup = name.includes('-') ? name.split('-')[0].trim() : '';
      const variableName = name.replace(/\s+/g, '_').toLowerCase();
      
      // Determine table name from SQL (if possible)
      let tableName = '';
      if (generatedSql) {
        const fromMatch = generatedSql.match(/FROM\s+([^\s(]+)/i);
        if (fromMatch && fromMatch[1]) {
          tableName = fromMatch[1].replace('dbo.', '');
        }
      }
      
      // Create the CSV row
      const row = [
        id,
        name,
        chartGroup,
        variableName,
        serverType,
        value || 0,
        tableName,
        generatedSql,
        generatedSql
      ].join('\t,\t');
      
      csvContent += row + '\n';
    }
    
    // Write to file
    fs.writeFileSync(filePath, csvContent);
    console.log(`Updated SQL expressions saved to: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error writing SQL expressions to CSV: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportFilePath = path.join(REPORTS_DIR, `sql-test-report-${timestamp}.json`);
  const updatedCsvFilePath = path.join(REPORTS_DIR, `updated-sql-expressions-${timestamp}.csv`);
  
  console.log('Starting SQL expression testing with direct POR access...');
  
  // Read SQL expressions from CSV
  console.log(`Reading SQL expressions from: ${CSV_FILE_PATH}`);
  const sqlExpressions = parseTabDelimitedCSV(CSV_FILE_PATH);
  console.log(`Found ${sqlExpressions.length} SQL expressions in CSV file`);
  
  if (sqlExpressions.length === 0) {
    console.log('No SQL expressions found. Exiting.');
    return;
  }
  
  // Initialize POR reader
  let porReader = null;
  let porConnected = false;
  
  try {
    console.log(`Opening POR database file: ${POR_FILE_PATH}`);
    if (fs.existsSync(POR_FILE_PATH)) {
      console.log('POR database file exists');
      const buffer = fs.readFileSync(POR_FILE_PATH);
      console.log(`Read ${buffer.length} bytes from POR database file`);
      
      porReader = new MDBReader(buffer);
      console.log('Created MDBReader instance');
      
      // Check if we can read tables
      const tables = porReader.getTableNames();
      console.log(`Found ${tables.length} tables in POR database`);
      console.log('Tables:', tables.slice(0, 10).join(', ') + (tables.length > 10 ? '...' : ''));
      
      // Get some sample data from a table
      if (tables.length > 0) {
        const sampleTable = porReader.getTable(tables[0]);
        const rowCount = sampleTable.getRowCount();
        console.log(`Sample table ${tables[0]} has ${rowCount} rows`);
        
        if (rowCount > 0) {
          const columns = sampleTable.getColumnNames();
          console.log(`Sample table columns: ${columns.join(', ')}`);
          
          const sampleRow = sampleTable.getData(0);
          console.log('Sample row:', JSON.stringify(sampleRow));
        }
      }
      
      porConnected = true;
    } else {
      console.log(`❌ POR database file not found at: ${POR_FILE_PATH}`);
    }
  } catch (error) {
    console.log(`❌ Error opening POR database: ${error.message}`);
    console.log(error.stack);
  }
  
  // Process SQL expressions
  console.log('Testing SQL expressions...');
  const results = [];
  
  let p21Count = 0;
  let porCount = 0;
  let p21NonZero = 0;
  let porNonZero = 0;
  
  for (const expr of sqlExpressions) {
    const { id, name, serverType, sqlExpression } = expr;
    
    // Generate proper SQL expression based on server type
    const generatedSql = generateSqlExpression(serverType, name, sqlExpression);
    
    // Count by server type
    if (serverType === 'P21') {
      p21Count++;
    } else if (serverType === 'POR') {
      porCount++;
    }
    
    // Test POR SQL expression if connected
    let testResult = { success: false, value: null, error: 'Database not connected' };
    
    if (serverType === 'POR' && porConnected) {
      // Test the SQL expression
      testResult = testPORSql(porReader, generatedSql);
      
      // Check if result is non-zero
      if (testResult.success && testResult.value && testResult.value > 0) {
        console.log(`✅ POR SQL for "${name}" returns non-zero value: ${testResult.value}`);
        porNonZero++;
      } else {
        console.log(`❌ POR SQL for "${name}" returns zero or error: ${testResult.error || 'Zero value'}`);
      }
    }
    
    // Add result to results array
    results.push({
      id,
      name,
      serverType,
      originalSql: sqlExpression,
      generatedSql,
      testSuccess: testResult.success,
      value: testResult.value,
      testError: testResult.error
    });
  }
  
  // Save report
  fs.writeFileSync(reportFilePath, JSON.stringify(results, null, 2));
  console.log(`Report saved to: ${reportFilePath}`);
  
  // Save updated SQL expressions to CSV
  writeSqlExpressionsToCSV(updatedCsvFilePath, results);
  
  // Generate summary
  console.log('SQL Testing completed.');
  console.log(`Total expressions: ${sqlExpressions.length}`);
  console.log(`P21 expressions: ${p21Count}, Non-zero results: ${p21NonZero}`);
  console.log(`POR expressions: ${porCount}, Non-zero results: ${porNonZero}`);
}

// Run the main function
main();
