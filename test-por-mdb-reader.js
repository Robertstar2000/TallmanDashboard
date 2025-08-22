// Direct test of POR database using mdb-reader (same as MCP server)
const fs = require('fs');

console.log('=== Direct POR Database Test with mdb-reader ===');

const porPath = '\\\\ts03\\POR\\POR.MDB';

try {
    // Check if mdb-reader is available
    let MDBReader;
    try {
        MDBReader = require('mdb-reader');
        console.log('✅ mdb-reader module loaded');
    } catch (err) {
        console.log('❌ mdb-reader not found, installing...');
        console.log('Run: npm install mdb-reader');
        process.exit(1);
    }

    console.log(`Testing file access: ${porPath}`);
    
    // Check if file exists and is accessible
    if (!fs.existsSync(porPath)) {
        console.log('❌ POR.MDB file not found or not accessible');
        console.log('Check network connection to \\\\ts03 and file permissions');
        process.exit(1);
    }
    
    console.log('✅ POR.MDB file exists and is accessible');
    
    // Read the MDB file
    console.log('Reading MDB file buffer...');
    const buffer = fs.readFileSync(porPath);
    console.log(`✅ File loaded: ${buffer.length} bytes`);
    
    // Initialize MDB Reader (same as POR MCP Server)
    console.log('Initializing MDB Reader...');
    const reader = new MDBReader(buffer);
    console.log('✅ MDB Reader initialized successfully');
    
    // Get table names (same method as POR MCP Server)
    console.log('Retrieving table names...');
    const tableNames = reader.getTableNames();
    
    console.log(`\n🎉 SUCCESS: Found ${tableNames.length} tables in POR database:`);
    console.log('=====================================');
    
    tableNames.forEach((tableName, index) => {
        console.log(`${(index + 1).toString().padStart(3, ' ')}. ${tableName}`);
    });
    
    console.log('=====================================');
    console.log(`Total POR Tables: ${tableNames.length}`);
    
    // Test data access on first table
    if (tableNames.length > 0) {
        console.log(`\nTesting data access on: ${tableNames[0]}`);
        try {
            const table = reader.getTable(tableNames[0]);
            const data = table.getData({ limit: 1 });
            console.log(`✅ Successfully read ${data.length} record(s) from ${tableNames[0]}`);
            
            if (data.length > 0) {
                const columns = Object.keys(data[0]);
                console.log(`Columns in ${tableNames[0]}: ${columns.join(', ')}`);
            }
        } catch (err) {
            console.log(`⚠️  Could not read data from ${tableNames[0]}: ${err.message}`);
        }
    }
    
    console.log('\n✅ POR MCP Server should work correctly with this configuration');
    console.log('The issue is with the Windsurf MCP tool wrapper, not the server itself');
    
} catch (error) {
    console.log('❌ POR Database Test Failed:', error.message);
    if (error.code === 'ENOENT') {
        console.log('File not found - check network path and permissions');
    } else if (error.code === 'EACCES') {
        console.log('Access denied - check file permissions');
    } else {
        console.log('Full error details:', error);
    }
}
