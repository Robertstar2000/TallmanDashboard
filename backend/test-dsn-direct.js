const odbc = require('odbc');

async function testDSNConnection() {
    console.log('Testing P21 DSN Connection Directly...\n');
    
    try {
        console.log('Attempting to connect to DSN: P21live');
        const connection = await odbc.connect('DSN=P21live');
        console.log('✅ Successfully connected to P21 database via DSN');
        
        // Test a simple query
        console.log('\nTesting simple query...');
        const result = await connection.query('SELECT COUNT(*) as table_count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
        console.log('Query result:', result);
        
        if (result && result.length > 0) {
            console.log(`✅ Found ${result[0].table_count} tables in P21 database`);
        }
        
        // Test dashboard-style query
        console.log('\nTesting dashboard query...');
        try {
            const dashResult = await connection.query('SELECT COUNT(*) as value FROM dbo.ar_invoices WITH (NOLOCK) WHERE invoice_date >= DATEADD(day, -30, GETDATE())');
            console.log('Dashboard query result:', dashResult);
            if (dashResult && dashResult.length > 0) {
                console.log(`✅ Dashboard query returned: ${dashResult[0].value}`);
            }
        } catch (dashError) {
            console.log('⚠️ Dashboard query failed (table may not exist):', dashError.message);
            
            // Try alternative table names
            console.log('Trying alternative table names...');
            try {
                const altResult = await connection.query('SELECT TOP 5 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\' ORDER BY TABLE_NAME');
                console.log('Available tables:', altResult.map(r => r.TABLE_NAME));
            } catch (altError) {
                console.log('Could not list tables:', altError.message);
            }
        }
        
        await connection.close();
        console.log('\n✅ DSN connection test completed successfully');
        
    } catch (error) {
        console.error('❌ DSN connection failed:', error.message);
        console.log('\nTroubleshooting steps:');
        console.log('1. Verify ODBC DSN "P21live" exists in Windows ODBC Data Sources');
        console.log('2. Check DSN configuration points to correct SQL Server and database');
        console.log('3. Ensure Windows authentication or correct credentials are configured');
        console.log('4. Verify SQL Server is accessible from this machine');
    }
}

testDSNConnection();
