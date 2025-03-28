const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const POR_FILE_PATH = 'C:\\Users\\BobM\\Desktop\\POR.MDB';
const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Function to run mdbtools commands
function runMdbCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`Warning: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

// Main function
async function main() {
  console.log('Starting POR database schema check...');
  
  try {
    // Check if file exists
    console.log(`Checking if POR database file exists: ${POR_FILE_PATH}`);
    if (!fs.existsSync(POR_FILE_PATH)) {
      console.log(`❌ POR database file not found at: ${POR_FILE_PATH}`);
      return;
    }
    
    console.log('POR database file exists');
    
    // Use ADOX to get database schema
    const schemaScript = `
    const fs = require('fs');
    const path = require('path');
    
    // Configuration
    const POR_FILE_PATH = '${POR_FILE_PATH.replace(/\\/g, '\\\\')}';
    const OUTPUT_FILE = path.join('${REPORTS_DIR.replace(/\\/g, '\\\\')}', 'por-schema.json');
    
    try {
      // Create ADOX Catalog
      const ADOX = new ActiveXObject('ADOX.Catalog');
      
      // Connect to the database
      ADOX.ActiveConnection = 'Provider=Microsoft.Jet.OLEDB.4.0;Data Source=' + POR_FILE_PATH;
      
      // Get tables
      const tables = [];
      for (let i = 0; i < ADOX.Tables.Count; i++) {
        const table = ADOX.Tables(i);
        
        // Skip system tables
        if (table.Type === 'TABLE' && !table.Name.startsWith('MSys')) {
          const columns = [];
          
          // Get columns
          for (let j = 0; j < table.Columns.Count; j++) {
            const column = table.Columns(j);
            columns.push({
              name: column.Name,
              type: column.Type,
              size: column.DefinedSize
            });
          }
          
          tables.push({
            name: table.Name,
            columns: columns
          });
        }
      }
      
      // Write schema to file
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tables, null, 2));
      console.log('Schema saved to: ' + OUTPUT_FILE);
    } catch (error) {
      console.error('Error:', error.message);
    }
    `;
    
    // Write the script to a temporary file
    const scriptPath = path.join(__dirname, 'temp-schema-script.js');
    fs.writeFileSync(scriptPath, schemaScript);
    
    // Run the script with cscript
    console.log('Running schema extraction script...');
    try {
      await runMdbCommand(`cscript //nologo "${scriptPath}"`);
      console.log('Schema extraction completed');
    } catch (error) {
      console.log(`Error running schema script: ${error.message}`);
    }
    
    // Clean up temporary script
    fs.unlinkSync(scriptPath);
    
    // Check if schema file was created
    const schemaFilePath = path.join(REPORTS_DIR, 'por-schema.json');
    if (fs.existsSync(schemaFilePath)) {
      console.log(`Schema file created at: ${schemaFilePath}`);
      
      // Read and parse schema
      const schemaData = JSON.parse(fs.readFileSync(schemaFilePath, 'utf8'));
      
      console.log(`Found ${schemaData.length} tables in POR database`);
      
      // Display table information
      schemaData.forEach(table => {
        console.log(`\nTable: ${table.name}`);
        console.log('Columns:');
        table.columns.forEach(column => {
          console.log(`  - ${column.name} (${column.type}, ${column.size})`);
        });
      });
      
      // Generate sample SQL expressions for POR database
      console.log('\nGenerating sample SQL expressions for POR database...');
      
      const sqlExpressions = [];
      
      // Add SQL expressions for each month
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      // Find tables that might contain rental or transaction data
      const rentalTables = schemaData.filter(table => 
        table.name.toLowerCase().includes('rental') || 
        table.name.toLowerCase().includes('contract') ||
        table.name.toLowerCase().includes('transaction')
      );
      
      if (rentalTables.length > 0) {
        console.log(`Found ${rentalTables.length} potential rental/transaction tables`);
        
        // Generate SQL for each month
        months.forEach((month, index) => {
          const monthNumber = index + 1;
          
          // Find date columns in rental tables
          let sqlExpression = '';
          let tableName = '';
          
          for (const table of rentalTables) {
            const dateColumns = table.columns.filter(column => 
              column.name.toLowerCase().includes('date') || 
              column.name.toLowerCase().includes('time')
            );
            
            if (dateColumns.length > 0) {
              tableName = table.name;
              const dateColumn = dateColumns[0].name;
              
              // Check if there's a status column
              const statusColumn = table.columns.find(column => 
                column.name.toLowerCase().includes('status')
              );
              
              if (statusColumn) {
                sqlExpression = `SELECT Count(*) as value FROM ${tableName} WHERE Month(${dateColumn}) = ${monthNumber} AND Year(${dateColumn}) = Year(Date())`;
              } else {
                sqlExpression = `SELECT Count(*) as value FROM ${tableName} WHERE Month(${dateColumn}) = ${monthNumber} AND Year(${dateColumn}) = Year(Date())`;
              }
              
              break;
            }
          }
          
          // If no suitable table found, use a default expression
          if (!sqlExpression) {
            if (rentalTables.length > 0) {
              tableName = rentalTables[0].name;
              sqlExpression = `SELECT Count(*) as value FROM ${tableName}`;
            } else {
              sqlExpression = `SELECT 0 as value`;
            }
          }
          
          sqlExpressions.push({
            name: `Historical Data - ${month} - POR`,
            variableName: `POR ${month}`,
            sqlExpression,
            tableName
          });
        });
      } else {
        console.log('No rental or transaction tables found');
        
        // Use generic SQL expressions
        months.forEach(month => {
          sqlExpressions.push({
            name: `Historical Data - ${month} - POR`,
            variableName: `POR ${month}`,
            sqlExpression: `SELECT 0 as value`,
            tableName: ''
          });
        });
      }
      
      // Write SQL expressions to file
      const sqlFilePath = path.join(REPORTS_DIR, 'por-sql-expressions.json');
      fs.writeFileSync(sqlFilePath, JSON.stringify(sqlExpressions, null, 2));
      console.log(`SQL expressions saved to: ${sqlFilePath}`);
      
      // Display SQL expressions
      console.log('\nGenerated SQL expressions:');
      sqlExpressions.forEach(expr => {
        console.log(`\n${expr.name} (${expr.variableName}):`);
        console.log(`Table: ${expr.tableName || 'N/A'}`);
        console.log(`SQL: ${expr.sqlExpression}`);
      });
    } else {
      console.log('Schema file was not created');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(error.stack);
  }
}

// Run the main function
main();
