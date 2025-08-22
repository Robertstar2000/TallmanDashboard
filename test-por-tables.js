const MDBReader = require('mdb-reader');
const fs = require('fs');

const POR_FILE_PATH = '\\\\ts03\\POR\\POR.MDB';

console.log('Testing POR database access...');
console.log('File path:', POR_FILE_PATH);

try {
    // Check if file exists and is accessible
    if (!fs.existsSync(POR_FILE_PATH)) {
        console.error('❌ POR file does not exist or is not accessible');
        process.exit(1);
    }
    
    const stats = fs.statSync(POR_FILE_PATH);
    console.log('✅ File exists, size:', stats.size, 'bytes');
    
    // Try to read the file
    console.log('Reading MDB file...');
    const buffer = fs.readFileSync(POR_FILE_PATH);
    console.log('✅ File read successfully, buffer size:', buffer.length);
    
    // Create MDB reader
    const reader = new MDBReader(buffer);
    console.log('✅ MDBReader created successfully');
    
    // Get table names
    const tableNames = reader.getTableNames();
    console.log('📋 Tables found:');
    tableNames.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
    });
    
    // Test a few tables for column structure
    if (tableNames.length > 0) {
        console.log('\n🔍 Testing first table structure:');
        try {
            const firstTable = reader.getTable(tableNames[0]);
            const columns = firstTable.getColumns();
            console.log(`Table "${tableNames[0]}" columns:`);
            columns.forEach(col => {
                console.log(`  - ${col.name} (${col.type})`);
            });
            
            // Get sample data
            const data = firstTable.getData({ limit: 3 });
            console.log(`Sample data (${data.length} rows):`);
            if (data.length > 0) {
                console.log(JSON.stringify(data[0], null, 2));
            }
        } catch (error) {
            console.error('❌ Error reading first table:', error.message);
        }
    }
    
} catch (error) {
    console.error('❌ Error accessing POR database:', error.message);
    console.error('Full error:', error);
}
