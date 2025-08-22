const MDBReader = require('mdb-reader');
const fs = require('fs');

console.log('=== Testing POR Database Direct Access ===');

const porPath = '\\\\ts03\\POR\\POR.MDB';

try {
    console.log(`Testing file access: ${porPath}`);
    
    // Check if file exists
    if (!fs.existsSync(porPath)) {
        console.error('❌ POR.MDB file not found or not accessible');
        process.exit(1);
    }
    
    console.log('✅ POR.MDB file exists and is accessible');
    
    // Read the file
    console.log('Reading MDB file...');
    const buffer = fs.readFileSync(porPath);
    console.log(`✅ File loaded: ${buffer.length} bytes`);
    
    // Initialize MDB Reader
    console.log('Initializing MDB Reader...');
    const reader = new MDBReader(buffer);
    console.log('✅ MDB Reader initialized');
    
    // Get table names
    console.log('Getting table names...');
    const tableNames = reader.getTableNames();
    console.log(`✅ Found ${tableNames.length} tables:`);
    
    tableNames.forEach((tableName, index) => {
        console.log(`  ${index + 1}. ${tableName}`);
    });
    
    // Test a simple query on the first table
    if (tableNames.length > 0) {
        console.log(`\nTesting data access on table: ${tableNames[0]}`);
        try {
            const table = reader.getTable(tableNames[0]);
            const data = table.getData({ limit: 3 });
            console.log(`✅ Retrieved ${data.length} sample records from ${tableNames[0]}`);
            if (data.length > 0) {
                console.log('Sample data:', JSON.stringify(data[0], null, 2));
            }
        } catch (err) {
            console.log(`⚠️  Could not read data from ${tableNames[0]}: ${err.message}`);
        }
    }
    
    console.log('\n=== POR Database Test Complete ===');
    console.log('✅ POR MCP Server should work correctly with mdb-reader');
    
} catch (error) {
    console.error('❌ POR Database Test Failed:', error.message);
    console.error('Full error:', error);
}
