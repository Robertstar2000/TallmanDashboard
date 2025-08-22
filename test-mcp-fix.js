import MCPController from './backend/mcpControllerFixed.js';

async function testMCPFix() {
    console.log('=== Testing Fixed MCP Controller ===\n');
    
    const mcpController = new MCPController();
    
    try {
        // Test P21 table list
        console.log('1. Testing P21 table list...');
        const p21Tables = await mcpController.executeListTables('P21');
        console.log(`P21 Tables result type: ${Array.isArray(p21Tables) ? 'Array' : typeof p21Tables}`);
        console.log(`P21 Tables count: ${Array.isArray(p21Tables) ? p21Tables.length : 'N/A'}`);
        if (Array.isArray(p21Tables) && p21Tables.length > 0) {
            console.log('Sample P21 tables:', p21Tables.slice(0, 5));
        }
        
        // Test P21 query
        console.log('\n2. Testing P21 query execution...');
        const p21Query = await mcpController.executeQuery('P21', 'SELECT TOP 5 * FROM INFORMATION_SCHEMA.TABLES');
        console.log(`P21 Query result type: ${Array.isArray(p21Query) ? 'Array' : typeof p21Query}`);
        console.log(`P21 Query count: ${Array.isArray(p21Query) ? p21Query.length : 'N/A'}`);
        if (Array.isArray(p21Query) && p21Query.length > 0) {
            console.log('Sample P21 query result:', p21Query[0]);
        }
        
        // Test POR table list
        console.log('\n3. Testing POR table list...');
        const porTables = await mcpController.executeListTables('POR');
        console.log(`POR Tables result type: ${Array.isArray(porTables) ? 'Array' : typeof porTables}`);
        console.log(`POR Tables count: ${Array.isArray(porTables) ? porTables.length : 'N/A'}`);
        if (Array.isArray(porTables) && porTables.length > 0) {
            console.log('Sample POR tables:', porTables.slice(0, 5));
        }
        
        // Test value extraction method
        console.log('\n4. Testing value extraction method...');
        const valueResult = await mcpController.executeQueryValue('P21', 'SELECT COUNT(*) as value FROM INFORMATION_SCHEMA.TABLES');
        console.log(`Value extraction result: ${valueResult} (type: ${typeof valueResult})`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mcpController.cleanup();
    }
}

testMCPFix();
