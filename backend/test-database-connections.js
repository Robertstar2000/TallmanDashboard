const { MCPController } = require('./mcpControllerSDK.js');
const fs = require('fs');

async function testDatabaseConnections() {
    console.log('=== Database Connection Test ===\n');
    
    const mcpController = new MCPController();
    
    try {
        // Test 1: Basic MCP server startup
        console.log('1. Testing MCP server startup...\n');
        
        const servers = ['P21', 'POR'];
        for (const serverName of servers) {
            console.log(`--- ${serverName} Server ---`);
            try {
                const connection = await mcpController.getOrCreateConnection(serverName);
                console.log(`✅ ${serverName} MCP server started successfully`);
                console.log(`Process ID: ${connection.process?.pid || 'N/A'}`);
                console.log(`Client connected: ${!!connection.client}`);
            } catch (error) {
                console.log(`❌ ${serverName} MCP server failed to start: ${error.message}`);
            }
            console.log('');
        }
        
        // Test 2: Basic connectivity test
        console.log('2. Testing basic connectivity...\n');
        
        const basicTests = [
            { server: 'P21', query: 'SELECT 1 as value;' },
            { server: 'POR', query: 'SELECT 1 as value;' }
        ];
        
        for (const test of basicTests) {
            console.log(`--- ${test.server} Basic Test ---`);
            try {
                const result = await mcpController.executeQuery(test.server, test.query);
                console.log(`Query: ${test.query}`);
                console.log(`Result: ${result}`);
                
                if (result === 99999) {
                    console.log('❌ Connection failed - got sentinel value 99999');
                    
                    // Try to get more details from the MCP server
                    const connection = await mcpController.getOrCreateConnection(test.server);
                    try {
                        const rawResponse = await connection.client.callTool({
                            name: 'execute_query',
                            arguments: { query: test.query }
                        });
                        console.log('Raw MCP Response:', JSON.stringify(rawResponse, null, 2));
                    } catch (rawError) {
                        console.log('Raw MCP call error:', rawError.message);
                    }
                } else {
                    console.log('✅ Connection successful');
                }
            } catch (error) {
                console.log(`❌ Test failed: ${error.message}`);
            }
            console.log('');
        }
        
        // Test 3: Check if tables exist
        console.log('3. Testing table existence...\n');
        
        const tableTests = [
            { server: 'P21', query: 'SELECT COUNT(*) as value FROM dbo.ar_invoices WITH (NOLOCK);', table: 'ar_invoices' },
            { server: 'P21', query: 'SELECT COUNT(*) as value FROM dbo.sales_orders WITH (NOLOCK);', table: 'sales_orders' },
            { server: 'P21', query: 'SELECT COUNT(*) as value FROM dbo.customers WITH (NOLOCK);', table: 'customers' }
        ];
        
        for (const test of tableTests) {
            console.log(`--- ${test.server} Table: ${test.table} ---`);
            try {
                const result = await mcpController.executeQuery(test.server, test.query);
                console.log(`Query: ${test.query}`);
                console.log(`Result: ${result}`);
                
                if (result === 99999) {
                    console.log(`❌ Table ${test.table} not accessible or doesn't exist`);
                } else {
                    console.log(`✅ Table ${test.table} exists with ${result} records`);
                }
            } catch (error) {
                console.log(`❌ Table test failed: ${error.message}`);
            }
            console.log('');
        }
        
        // Test 4: Test actual dashboard query
        console.log('4. Testing actual dashboard query...\n');
        
        const allData = JSON.parse(fs.readFileSync('../allData.json', 'utf8'));
        const testQuery = allData.find(item => item.id === 1); // AR Aging Current
        
        if (testQuery) {
            console.log(`--- Dashboard Query Test ---`);
            console.log(`Metric: ${testQuery.variableName}`);
            console.log(`Query: ${testQuery.productionSqlExpression}`);
            
            try {
                const result = await mcpController.executeQuery(testQuery.serverName, testQuery.productionSqlExpression);
                console.log(`Result: ${result}`);
                
                if (result === 99999) {
                    console.log('❌ Dashboard query failed - this is why all metrics show 99999');
                    
                    // Test a simpler version
                    const simpleQuery = 'SELECT COUNT(*) as value FROM dbo.ar_invoices WITH (NOLOCK);';
                    console.log(`\nTrying simpler query: ${simpleQuery}`);
                    const simpleResult = await mcpController.executeQuery(testQuery.serverName, simpleQuery);
                    console.log(`Simple result: ${simpleResult}`);
                    
                    if (simpleResult !== 99999) {
                        console.log('⚠️ Simple query works - issue is with WHERE clause or date functions');
                    } else {
                        console.log('❌ Even simple query fails - database connection issue');
                    }
                } else {
                    console.log('✅ Dashboard query successful');
                }
            } catch (error) {
                console.log(`❌ Dashboard query failed: ${error.message}`);
            }
        }
        
        console.log('\n=== DIAGNOSIS ===');
        console.log('If all queries return 99999, the issue is:');
        console.log('1. MCP servers cannot connect to external databases');
        console.log('2. Database tables do not exist');
        console.log('3. SQL syntax is incompatible with the database');
        console.log('4. Database credentials/DSN configuration is incorrect');
        
    } catch (error) {
        console.error('Connection test failed:', error);
    } finally {
        await mcpController.cleanup();
    }
}

testDatabaseConnections();
