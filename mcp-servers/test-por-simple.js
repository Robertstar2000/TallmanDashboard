// Simple POR MCP Server Test
const odbc = require('odbc');

async function testPORConnection() {
    console.log('Testing POR connection...');
    
    try {
        const dbPath = '\\\\ts03\\POR\\POR.MDB';
        const connectionString = `DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${dbPath};`;
        
        console.log(`Connecting to: ${dbPath}`);
        const connection = await odbc.connect(connectionString);
        
        const result = await connection.query('SELECT 1 as test');
        console.log('SUCCESS: POR connection working!');
        console.log('Test result:', result);
        
        await connection.close();
        process.exit(0);
        
    } catch (error) {
        console.log('ERROR: POR connection failed');
        console.log('Error:', error.message);
        process.exit(1);
    }
}

testPORConnection();