// Direct POR Connection Test
const MDBReader = require('mdb-reader');

async function testPOR() {
    console.log('=== POR Direct Connection Test ===');
    console.log('Path: \\\\ts03\\POR\\POR.MDB');
    
    try {
        console.log('Opening POR database...');
        const reader = new MDBReader('\\\\ts03\\POR\\POR.MDB');
        console.log('✅ POR database opened successfully!');
        
        console.log('Getting table list...');
        const tables = reader.getTableNames();
        console.log('✅ POR tables found:', tables.length);
        console.log('First 10 tables:', tables.slice(0, 10));
        
        if (tables.length > 0) {
            console.log('Testing data read from first table...');
            const firstTable = tables[0];
            const data = reader.getTable(firstTable).getData();
            console.log(`✅ Read ${data.length} rows from table: ${firstTable}`);
        }
        
        reader.close();
        console.log('✅ POR database closed');
        
    } catch (error) {
        console.log('❌ POR connection failed:');
        console.log('Error type:', error.constructor.name);
        console.log('Error message:', error.message);
        console.log('Error code:', error.code);
        console.log('Error stack:', error.stack);
    }
}

testPOR();
