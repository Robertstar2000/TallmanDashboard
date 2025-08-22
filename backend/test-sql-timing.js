const { MCPController } = require('./mcpControllerSDK.js');
const fs = require('fs');

async function testSQLTiming() {
    const mcpController = new MCPController();
    
    try {
        console.log('=== SQL Expression Timing Test ===\n');
        
        // Load allData.json to get SQL expressions
        const allData = JSON.parse(fs.readFileSync('../allData.json', 'utf8'));
        
        // Test specific SQL expressions that should return real data
        const testQueries = [
            {
                id: 1,
                name: 'AR_AGING Current',
                sql: allData.find(item => item.id === 1)?.productionSqlExpression,
                server: 'P21'
            },
            {
                id: 66,
                name: 'Daily Orders Today',
                sql: allData.find(item => item.id === 66)?.productionSqlExpression,
                server: 'P21'
            },
            {
                id: 42,
                name: 'New Customers Jan',
                sql: allData.find(item => item.id === 42)?.productionSqlExpression,
                server: 'P21'
            }
        ];
        
        console.log('Testing SQL expressions directly via MCP...\n');
        
        for (const query of testQueries) {
            if (!query.sql) {
                console.log(`❌ Query ID ${query.id}: SQL not found`);
                continue;
            }
            
            console.log(`\n--- Testing: ${query.name} (ID: ${query.id}) ---`);
            console.log(`SQL: ${query.sql}`);
            console.log(`Server: ${query.server}`);
            
            const startTime = Date.now();
            
            try {
                const result = await mcpController.executeQuery(query.server, query.sql);
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                console.log(`✅ Result: ${result}`);
                console.log(`⏱️  Duration: ${duration}ms`);
                
                // Check if result is the default 99999
                if (result === 99999) {
                    console.log(`⚠️  WARNING: Got default value 99999 - this indicates query failed or returned no data`);
                } else if (result === 0) {
                    console.log(`ℹ️  INFO: Got 0 - this may be correct if no matching records exist`);
                } else {
                    console.log(`✅ SUCCESS: Got real data value: ${result}`);
                }
                
            } catch (error) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                console.log(`❌ Error: ${error.message}`);
                console.log(`⏱️  Duration: ${duration}ms`);
                console.log(`🔍 Error Details: ${JSON.stringify(error, null, 2)}`);
            }
        }
        
        console.log('\n=== Testing Background Worker Simulation ===\n');
        
        // Simulate what the background worker does
        for (const query of testQueries) {
            if (!query.sql) continue;
            
            console.log(`\n--- Background Worker Test: ${query.name} ---`);
            
            try {
                // This simulates the backgroundWorker.js execution path
                const startTime = Date.now();
                
                // Get or create connection (like background worker does)
                const connection = await mcpController.getOrCreateConnection(query.server);
                console.log(`Connection established: ${connection ? 'YES' : 'NO'}`);
                
                // Execute query directly through connection
                const response = await connection.client.callTool({
                    name: query.server === 'P21' ? 'execute_p21_query' : 'execute_por_query',
                    arguments: { query: query.sql }
                });
                
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                console.log(`Raw Response: ${JSON.stringify(response, null, 2)}`);
                
                // Parse response like background worker does
                let result = 99999; // Default value
                if (response && response.content && response.content[0] && response.content[0].text) {
                    try {
                        const data = JSON.parse(response.content[0].text);
                        if (Array.isArray(data) && data.length > 0 && data[0].value !== undefined) {
                            result = data[0].value;
                        }
                    } catch (parseError) {
                        console.log(`Parse Error: ${parseError.message}`);
                    }
                }
                
                console.log(`Parsed Result: ${result}`);
                console.log(`Duration: ${duration}ms`);
                
            } catch (error) {
                console.log(`Background Worker Error: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mcpController.cleanup();
    }
}

testSQLTiming();
