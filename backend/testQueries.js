import MCPController from './mcpControllerFixed.js';

async function testQueries() {
    const mcpController = new MCPController();
    
    console.log('🔍 Testing MCP Server Connections and Table Structure...\n');
    
    // Test P21 Server
    console.log('=== P21 SERVER TESTS ===');
    try {
        // Test basic connection
        console.log('1. Testing basic P21 connection...');
        const basicTest = await mcpController.executeQuery('P21', 'SELECT 1 as value');
        console.log('✅ P21 basic connection successful:', basicTest);
        
        // Test table discovery
        console.log('2. Discovering P21 tables...');
        const tables = await mcpController.executeQueryRows('P21', `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        console.log('✅ P21 tables found:', tables.slice(0, 10).map(t => t.TABLE_NAME)); // Show first 10 tables
        
        // Test common table patterns
        const commonPatterns = ['invoice', 'order', 'customer', 'item', 'ar_', 'sales'];
        for (const pattern of commonPatterns) {
            try {
                const matchingTables = await mcpController.executeQueryRows('P21', `
                    SELECT TABLE_NAME 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_NAME LIKE '%${pattern}%'
                    AND TABLE_TYPE = 'BASE TABLE'
                `);
                if (matchingTables.length > 0) {
                    console.log(`📋 Tables containing '${pattern}':`, matchingTables.map(t => t.TABLE_NAME));
                }
            } catch (err) {
                console.log(`⚠️  Could not search for pattern '${pattern}':`, err.message);
            }
        }
        
    } catch (error) {
        console.error('❌ P21 Server Error:', error.message);
    }
    
    console.log('\n=== POR SERVER TESTS ===');
    try {
        // Test basic POR connection with MS Access compatible query
        console.log('1. Testing basic POR connection...');
        const porTest = await mcpController.executeQuery('POR', 'SELECT 1 as value');
        console.log('✅ POR basic connection successful:', porTest);
        
        // Try to list POR tables (MS Access approach)
        console.log('2. Discovering POR tables...');
        const porTables = await mcpController.executeListTables('POR');
        console.log('✅ POR tables found:', porTables.slice(0, 10));
        
    } catch (error) {
        console.error('❌ POR Server Error:', error.message);
    }
    
    console.log('\n=== QUERY TESTING COMPLETE ===');
    process.exit(0);
}

testQueries().catch(console.error);
