// Minimal MCP Server Test - No Hanging
console.log('Starting minimal MCP test...');

async function testBasics() {
    try {
        // Test 1: Check if odbc module can be required
        console.log('1. Testing ODBC module...');
        const odbc = require('odbc');
        console.log('   ✓ ODBC module loaded');

        // Test 2: Test P21 DSN connection with timeout
        console.log('2. Testing P21 DSN connection...');
        const p21Promise = odbc.connect('DSN=P21Live;Trusted_Connection=yes;');
        const p21Timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('P21 connection timeout')), 5000)
        );
        
        try {
            const p21Conn = await Promise.race([p21Promise, p21Timeout]);
            console.log('   ✓ P21 connection successful');
            await p21Conn.close();
        } catch (error) {
            console.log('   ✗ P21 connection failed:', error.message);
        }

        // Test 3: Test POR connection with timeout
        console.log('3. Testing POR connection...');
        const porConnString = 'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=\\\\ts03\\POR\\POR.MDB;';
        const porPromise = odbc.connect(porConnString);
        const porTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('POR connection timeout')), 5000)
        );
        
        try {
            const porConn = await Promise.race([porPromise, porTimeout]);
            console.log('   ✓ POR connection successful');
            await porConn.close();
        } catch (error) {
            console.log('   ✗ POR connection failed:', error.message);
        }

        console.log('\nTest completed successfully!');
        
    } catch (error) {
        console.log('Fatal error:', error.message);
    }
    
    // Force exit to prevent hanging
    process.exit(0);
}

// Set overall timeout
setTimeout(() => {
    console.log('Test timed out after 15 seconds');
    process.exit(1);
}, 15000);

testBasics();