import MCPController from './mcpControllerSDK.js';

async function getP21Tables() {
    const mcp = new MCPController();
    
    try {
        console.log('🔍 Getting P21 table list...');
        const tables = await mcp.executeListTables('P21');
        
        console.log('\n📋 P21 Tables Found:');
        console.log('===================');
        tables.forEach((table, index) => {
            console.log(`${index + 1}. ${table}`);
        });
        
        // Look for AR-related tables
        const arTables = tables.filter(t => 
            t.toLowerCase().includes('ar_') || 
            t.toLowerCase().includes('receivable') ||
            t.toLowerCase().includes('invoice')
        );
        
        console.log('\n💰 AR/Invoice Related Tables:');
        console.log('=============================');
        arTables.forEach(table => console.log(`• ${table}`));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mcp.cleanup();
        process.exit(0);
    }
}

getP21Tables();
