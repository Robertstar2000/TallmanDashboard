#!/usr/bin/env node

const MCPController = require('./backend/mcpControllerFixed.js');

async function testPORStatus() {
    console.log('=== Testing POR Status via Backend ===');
    
    // Set environment variable
    process.env.POR_DB_PATH = '\\\\ts03\\POR\\POR.MDB';
    
    const mcpController = new MCPController();
    
    try {
        console.log('1. Testing direct POR MCP connection...');
        const result = await mcpController.executeQuery('POR', 'SELECT 42 as value');
        console.log('✅ POR MCP Result:', JSON.stringify(result, null, 2));
        
        console.log('\n2. Testing POR connection status check...');
        
        // Simulate the exact same logic as server.js
        const testQuery = 'SELECT 42 as value';
        await mcpController.executeQuery('POR', testQuery);
        console.log('✅ POR status check successful');
        
        const statusResult = {
            status: 'Connected',
            config: {
                name: 'POR',
                server: 'POR-MCP-Server', 
                database: 'POR',
                type: 'MS Access via MCP'
            },
            version: 'MS Access via MCP',
            responseTime: 100
        };
        
        console.log('📊 Expected Status Result:', JSON.stringify(statusResult, null, 2));
        
    } catch (error) {
        console.error('❌ POR Test Failed:', error.message);
        console.error('Full Error:', error);
    }
}

testPORStatus().catch(console.error);