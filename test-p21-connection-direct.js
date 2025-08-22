// Test P21 database connection directly using ODBC
const odbc = require('odbc');

console.log('=== TESTING P21 DATABASE CONNECTION DIRECTLY ===\n');

async function testP21Connection() {
    try {
        console.log('1. Testing P21 DSN connection...');
        console.log('DSN: P21Live');
        
        // Test connection using the DSN from .env
        const connectionString = 'DSN=P21Live';
        console.log(`Connecting with: ${connectionString}`);
        
        const connection = await odbc.connect(connectionString);
        console.log('✅ P21 connection successful!');
        
        // Test simple query
        console.log('\n2. Testing simple query...');
        const result = await connection.query('SELECT 1 as test_value');
        console.log('✅ Simple query successful:', result);
        
        // Test actual table query
        console.log('\n3. Testing table query...');
        const tableResult = await connection.query('SELECT TOP 1 * FROM dbo.ar_invoices WITH (NOLOCK)');
        console.log('✅ Table query successful, columns:', Object.keys(tableResult[0] || {}));
        
        // Test the actual problematic query from logs
        console.log('\n4. Testing problematic query from logs...');
        const problemQuery = "SELECT ISNULL(SUM(invoice_balance), 0) AS value FROM dbo.ar_invoices WITH (NOLOCK) WHERE status = 'Open' AND due_date >= GETDATE()";
        console.log(`Query: ${problemQuery}`);
        
        const problemResult = await connection.query(problemQuery);
        console.log('✅ Problematic query successful:', problemResult);
        
        await connection.close();
        console.log('\n✅ All tests passed - P21 database is accessible');
        
    } catch (error) {
        console.error('❌ P21 connection failed:', error.message);
        console.error('Full error:', error);
        
        // Provide troubleshooting steps
        console.log('\n🔧 TROUBLESHOOTING STEPS:');
        console.log('1. Check if P21Live DSN exists in ODBC Data Sources');
        console.log('2. Verify SQL Server is running and accessible');
        console.log('3. Check Windows authentication/credentials');
        console.log('4. Verify network connectivity to database server');
    }
}

testP21Connection();
