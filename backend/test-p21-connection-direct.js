const { MCPController } = require('./mcpControllerSDK.js');

async function testP21ConnectionDirect() {
    console.log('=== Testing P21 Connection with Updated Configuration ===\n');
    
    const mcpController = new MCPController();
    
    try {
        // Test 1: Basic connection test
        console.log('1. Testing basic P21 connection...\n');
        
        try {
            const result = await mcpController.executeQuery('P21', 'SELECT 1 as value;');
            console.log(`Basic connection test result: ${result}`);
            
            if (result === 99999) {
                console.log('❌ P21 connection still failing');
                
                // Get raw MCP response for debugging
                const connection = await mcpController.getOrCreateConnection('P21');
                try {
                    const rawResponse = await connection.client.callTool({
                        name: 'execute_query',
                        arguments: { query: 'SELECT 1 as value;' }
                    });
                    console.log('Raw MCP Response:', JSON.stringify(rawResponse, null, 2));
                } catch (rawError) {
                    console.log('Raw MCP Error:', rawError.message);
                }
            } else {
                console.log('✅ P21 connection successful!');
            }
        } catch (error) {
            console.log(`❌ Connection test failed: ${error.message}`);
        }
        
        // Test 2: Discover actual P21 table names
        console.log('\n2. Discovering actual P21 table names...\n');
        
        const tableDiscoveryQueries = [
            'SELECT COUNT(*) as value FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\';',
            'SELECT TOP 5 TABLE_NAME as value FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE \'%AR%\' ORDER BY TABLE_NAME;',
            'SELECT TOP 5 TABLE_NAME as value FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE \'%ORDER%\' OR TABLE_NAME LIKE \'%SO%\' ORDER BY TABLE_NAME;',
            'SELECT TOP 5 TABLE_NAME as value FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE \'%CUST%\' ORDER BY TABLE_NAME;'
        ];
        
        for (const query of tableDiscoveryQueries) {
            try {
                console.log(`Query: ${query}`);
                const result = await mcpController.executeQuery('P21', query);
                console.log(`Result: ${result}\n`);
            } catch (error) {
                console.log(`Error: ${error.message}\n`);
            }
        }
        
        // Test 3: Test common P21 table names
        console.log('3. Testing common P21 table names...\n');
        
        const commonP21Tables = [
            'ARINV',    // AR Invoices
            'SOMAST',   // Sales Order Master
            'CUSTOMER', // Customer Master
            'INVMAST',  // Inventory Master
            'INMAST',   // Item Master
            'ARMAST'    // AR Master
        ];
        
        for (const tableName of commonP21Tables) {
            try {
                const query = `SELECT COUNT(*) as value FROM ${tableName} WITH (NOLOCK);`;
                console.log(`Testing table: ${tableName}`);
                const result = await mcpController.executeQuery('P21', query);
                
                if (result !== 99999) {
                    console.log(`✅ Table ${tableName} exists with ${result} records`);
                } else {
                    console.log(`❌ Table ${tableName} not accessible`);
                }
            } catch (error) {
                console.log(`❌ Table ${tableName} error: ${error.message}`);
            }
            console.log('');
        }
        
        // Test 4: Test actual dashboard query with correct table names
        console.log('4. Testing dashboard query with potential correct table names...\n');
        
        const testQueries = [
            'SELECT COUNT(*) as value FROM ARINV WITH (NOLOCK) WHERE invoice_balance > 0;',
            'SELECT COUNT(*) as value FROM SOMAST WITH (NOLOCK) WHERE order_date >= DATEADD(day, -1, GETDATE());',
            'SELECT COUNT(*) as value FROM CUSTOMER WITH (NOLOCK);'
        ];
        
        for (const query of testQueries) {
            try {
                console.log(`Query: ${query}`);
                const result = await mcpController.executeQuery('P21', query);
                console.log(`Result: ${result}`);
                
                if (result !== 99999) {
                    console.log('✅ Query successful - this table structure works!');
                } else {
                    console.log('❌ Query failed - table or column names incorrect');
                }
            } catch (error) {
                console.log(`❌ Query error: ${error.message}`);
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('P21 connection test failed:', error);
    } finally {
        await mcpController.cleanup();
    }
}

testP21ConnectionDirect();
