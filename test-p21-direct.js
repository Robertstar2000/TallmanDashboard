// Direct P21 Connection Test
const odbc = require('odbc');

async function testP21() {
    console.log('=== P21 Direct Connection Test ===');
    console.log('DSN: P21Live');
    
    try {
        console.log('Connecting to P21...');
        const connection = await odbc.connect('DSN=P21Live');
        console.log('✅ P21 connection successful!');
        
        console.log('Testing simple query...');
        const result = await connection.query('SELECT 1 as test_value');
        console.log('✅ P21 query successful!');
        console.log('Result:', result);
        
        await connection.close();
        console.log('✅ P21 connection closed');
        
    } catch (error) {
        console.log('❌ P21 connection failed:');
        console.log('Error type:', error.constructor.name);
        console.log('Error message:', error.message);
        console.log('Error code:', error.code);
        console.log('Error stack:', error.stack);
    }
}

testP21();
