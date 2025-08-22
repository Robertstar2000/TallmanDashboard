const { MCPController } = require('./mcpControllerSDK.js');
const fs = require('fs');

async function compareSQLResults() {
    console.log('=== Comparing Admin SQL Test vs Background Worker Results ===\n');
    
    const mcpController = new MCPController();
    
    try {
        // Load a simple test query from allData.json
        const allData = JSON.parse(fs.readFileSync('../allData.json', 'utf8'));
        
        // Test with AR Aging Current query (ID 1)
        const testMetric = allData.find(item => item.id === 1);
        if (!testMetric) {
            console.log('❌ Test metric not found');
            return;
        }
        
        console.log(`Testing metric: ${testMetric.variableName}`);
        console.log(`Server: ${testMetric.serverName}`);
        console.log(`SQL: ${testMetric.productionSqlExpression}\n`);
        
        // Test 1: Direct MCP Controller execution (like Admin SQL Test)
        console.log('--- Test 1: Direct MCP Controller (Admin SQL Test style) ---');
        try {
            const startTime1 = Date.now();
            const result1 = await mcpController.executeQuery(testMetric.serverName, testMetric.productionSqlExpression);
            const duration1 = Date.now() - startTime1;
            
            console.log(`Result: ${result1}`);
            console.log(`Type: ${typeof result1}`);
            console.log(`Duration: ${duration1}ms`);
            console.log(`Status: ${result1 === 99999 ? 'FAILED (99999)' : result1 === 0 ? 'SUCCESS (0)' : 'SUCCESS (real data)'}`);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log('\n--- Test 2: Background Worker Style Execution ---');
        try {
            const startTime2 = Date.now();
            
            // Simulate background worker logic exactly
            const connection = await mcpController.getOrCreateConnection(testMetric.serverName);
            console.log(`Connection established: ${connection ? 'YES' : 'NO'}`);
            
            // Call MCP tool directly like background worker does
            const response = await connection.client.callTool({
                name: 'execute_query',
                arguments: { query: testMetric.productionSqlExpression }
            });
            
            console.log(`Raw MCP Response:`, JSON.stringify(response, null, 2));
            
            // Parse response like background worker does
            let result2 = 99999; // Default sentinel value
            const content = response?.content?.[0]?.text;
            
            if (content) {
                try {
                    const data = JSON.parse(content);
                    console.log(`Parsed data:`, data);
                    
                    if (Array.isArray(data) && data.length > 0) {
                        const firstRow = data[0];
                        console.log(`First row:`, firstRow);
                        
                        // Check for value field like MCP controller does
                        const valueField = firstRow.value || firstRow.VALUE || firstRow.count || firstRow.COUNT;
                        if (typeof valueField === 'number') {
                            result2 = valueField;
                        } else {
                            console.log(`⚠️ Value field not numeric:`, valueField);
                        }
                    } else {
                        console.log(`⚠️ Data is not array or empty:`, data);
                    }
                } catch (parseError) {
                    console.log(`❌ Parse error: ${parseError.message}`);
                }
            } else {
                console.log(`❌ No content in response`);
            }
            
            const duration2 = Date.now() - startTime2;
            
            console.log(`Final Result: ${result2}`);
            console.log(`Type: ${typeof result2}`);
            console.log(`Duration: ${duration2}ms`);
            console.log(`Status: ${result2 === 99999 ? 'FAILED (99999)' : result2 === 0 ? 'SUCCESS (0)' : 'SUCCESS (real data)'}`);
            
        } catch (error) {
            console.log(`❌ Background worker style error: ${error.message}`);
            console.log(`Error stack: ${error.stack}`);
        }
        
        // Test 3: Check MCP server status
        console.log('\n--- Test 3: MCP Server Status Check ---');
        try {
            const connectionTest = await mcpController.executeQuery('P21', 'SELECT 1 as value;');
            console.log(`P21 connection test result: ${connectionTest}`);
            
            if (connectionTest === 99999) {
                console.log('❌ P21 MCP server is not responding correctly');
                
                // Try to get more details about the connection
                const connection = await mcpController.getOrCreateConnection('P21');
                console.log(`Connection object exists: ${!!connection}`);
                console.log(`Client exists: ${!!connection?.client}`);
                console.log(`Process exists: ${!!connection?.process}`);
                console.log(`Process killed: ${connection?.process?.killed}`);
            } else {
                console.log('✅ P21 MCP server is responding');
            }
        } catch (error) {
            console.log(`❌ MCP server status check failed: ${error.message}`);
        }
        
        // Test 4: Check if the issue is with the specific SQL query
        console.log('\n--- Test 4: SQL Query Validation ---');
        console.log(`Testing if the issue is with the SQL query itself...`);
        
        // Try a simpler version of the query
        const simpleQuery = 'SELECT COUNT(*) as value FROM dbo.ar_invoices WITH (NOLOCK);';
        console.log(`Simple query: ${simpleQuery}`);
        
        try {
            const simpleResult = await mcpController.executeQuery('P21', simpleQuery);
            console.log(`Simple query result: ${simpleResult}`);
            
            if (simpleResult !== 99999) {
                console.log('✅ Simple query works - issue may be with complex WHERE clause');
            } else {
                console.log('❌ Even simple query fails - issue is with table/connection');
            }
        } catch (error) {
            console.log(`❌ Simple query failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('Comparison test failed:', error);
    } finally {
        await mcpController.cleanup();
    }
}

compareSQLResults();
