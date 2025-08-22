// Simple P21 MCP Server Test
const odbc = require('odbc');

async function testP21Connection() {
    console.log('Testing P21 connection...');
    
    try {
        const dsn = 'P21Live';
        const connectionString = `DSN=${dsn};Trusted_Connection=yes;`;
        
        console.log(`Connecting with: ${connectionString}`);
        const connection = await odbc.connect(connectionString);
        
        const result = await connection.query('SELECT 1 as test');
        console.log('SUCCESS: P21 connection working!');
        console.log('Test result:', result);
        
        await connection.close();
        process.exit(0);
        
    } catch (error) {
        console.log('ERROR: P21 connection failed');
        console.log('Error:', error.message);
        process.exit(1);
    }
}

testP21Connection();