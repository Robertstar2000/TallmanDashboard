const { MCPController } = require('./mcpControllerSDK.js');
const fs = require('fs');

async function debugSQLExecution() {
    console.log('=== SQL Execution Debug Test ===\n');
    
    const mcpController = new MCPController();
    
    try {
        // Test simple queries first
        console.log('1. Testing basic connection queries...\n');
        
        const basicTests = [
            { server: 'P21', query: 'SELECT 1 as value;', name: 'P21 Basic Test' },
            { server: 'POR', query: 'SELECT 1 as value;', name: 'POR Basic Test' }
        ];
        
        for (const test of basicTests) {
            console.log(`--- ${test.name} ---`);
            console.log(`Query: ${test.query}`);
            
            try {
                const startTime = Date.now();
                const result = await mcpController.executeQuery(test.server, test.query);
                const duration = Date.now() - startTime;
                
                console.log(`Result: ${result} (${typeof result})`);
                console.log(`Duration: ${duration}ms`);
                console.log(`Status: ${result === 99999 ? '❌ FAILED (99999)' : result === 1 ? '✅ SUCCESS' : '⚠️ UNEXPECTED'}`);
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
            }
            console.log('');
        }
        
        // Test actual dashboard queries
        console.log('2. Testing actual dashboard SQL expressions...\n');
        
        const allData = JSON.parse(fs.readFileSync('../allData.json', 'utf8'));
        
        const realQueries = [
            { 
                id: 1, 
                server: 'P21', 
                query: allData.find(item => item.id === 1)?.productionSqlExpression,
                name: 'AR Aging Current'
            },
            { 
                id: 66, 
                server: 'P21', 
                query: allData.find(item => item.id === 66)?.productionSqlExpression,
                name: 'Daily Orders Today'
            }
        ];
        
        for (const test of realQueries) {
            if (!test.query) {
                console.log(`❌ Query ID ${test.id} not found`);
                continue;
            }
            
            console.log(`--- ${test.name} (ID: ${test.id}) ---`);
            console.log(`Server: ${test.server}`);
            console.log(`Query: ${test.query}`);
            
            try {
                const startTime = Date.now();
                
                // Get connection details
                const connection = await mcpController.getOrCreateConnection(test.server);
                console.log(`Connection ready: ${connection ? 'YES' : 'NO'}`);
                
                // Execute via MCP controller
                const result = await mcpController.executeQuery(test.server, test.query);
                const duration = Date.now() - startTime;
                
                console.log(`Result: ${result} (${typeof result})`);
                console.log(`Duration: ${duration}ms`);
                
                if (result === 99999) {
                    console.log('❌ FAILED - Got sentinel value 99999');
                    
                    // Try direct MCP call to see raw response
                    try {
                        console.log('Attempting direct MCP call...');
                        const rawResponse = await connection.client.callTool({
                            name: 'execute_query',
                            arguments: { query: test.query }
                        });
                        console.log('Raw MCP Response:', JSON.stringify(rawResponse, null, 2));
                    } catch (rawError) {
                        console.log('Direct MCP call failed:', rawError.message);
                    }
                } else if (result === 0) {
                    console.log('ℹ️ Got 0 - may be correct if no matching records');
                } else {
                    console.log('✅ SUCCESS - Got real data');
                }
                
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
                console.log(`Error stack: ${error.stack}`);
            }
            console.log('');
        }
        
        // Test MCP server tool listing
        console.log('3. Testing MCP server capabilities...\n');
        
        for (const serverName of ['P21', 'POR']) {
            console.log(`--- ${serverName} Server Tools ---`);
            try {
                const connection = await mcpController.getOrCreateConnection(serverName);
                const tools = await connection.client.listTools();
                console.log(`Available tools: ${JSON.stringify(tools, null, 2)}`);
            } catch (error) {
                console.log(`❌ Failed to list tools: ${error.message}`);
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('Debug test failed:', error);
    } finally {
        await mcpController.cleanup();
    }
}

debugSQLExecution();
