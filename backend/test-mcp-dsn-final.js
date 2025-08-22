const MCPController = require('./mcpControllerFixed.js').default;

async function testMCPConnections() {
    console.log('=== Testing MCP Connections with DSN Configuration ===\n');
    
    const mcpController = new MCPController();
    
    try {
        // Test P21 connection
        console.log('1. Testing P21 MCP Server Connection...');
        const p21TestQuery = 'SELECT COUNT(*) as value FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'';
        const p21Result = await mcpController.executeQuery('P21', p21TestQuery);
        
        console.log(`P21 Result: ${p21Result}`);
        if (p21Result !== 99999) {
            console.log('✅ P21 MCP Server connected successfully - returning real data!');
        } else {
            console.log('❌ P21 MCP Server failed - returning sentinel value 99999');
        }
        
        // Test a sample dashboard query
        console.log('\n2. Testing Sample Dashboard Query...');
        const dashboardQuery = 'SELECT COUNT(*) as value FROM dbo.ar_invoices WITH (NOLOCK) WHERE invoice_date >= DATEADD(day, -30, GETDATE())';
        const dashboardResult = await mcpController.executeQuery('P21', dashboardQuery);
        
        console.log(`Dashboard Query Result: ${dashboardResult}`);
        if (dashboardResult !== 99999) {
            console.log('✅ Dashboard query executed successfully!');
        } else {
            console.log('❌ Dashboard query failed - check table names and columns');
        }
        
        // Test POR connection
        console.log('\n3. Testing POR MCP Server Connection...');
        try {
            const porResult = await mcpController.executeQuery('POR', 'SELECT COUNT(*) as value FROM MSysObjects');
            console.log(`POR Result: ${porResult}`);
            if (porResult !== 99999) {
                console.log('✅ POR MCP Server connected successfully!');
            } else {
                console.log('❌ POR MCP Server failed - returning sentinel value 99999');
            }
        } catch (porError) {
            console.log('⚠️ POR test skipped:', porError.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        // Clean up
        await mcpController.cleanup();
        console.log('\n=== Test Complete ===');
    }
}

testMCPConnections().catch(console.error);
