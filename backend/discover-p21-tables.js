import MCPController from './mcpControllerSDK.js';

async function discoverP21Tables() {
    const mcp = new MCPController();
    
    try {
        console.log('🔍 Discovering actual P21 table names from external database...');
        
        // Get list of all tables in P21 database
        const tables = await mcp.executeListTables('P21');
        
        console.log('\n📋 All P21 Tables:');
        console.log('==================');
        tables.forEach((table, index) => {
            console.log(`${index + 1}. ${table}`);
        });
        
        // Look for AR/Invoice related tables
        const arTables = tables.filter(t => 
            t.toLowerCase().includes('ar') || 
            t.toLowerCase().includes('receivable') ||
            t.toLowerCase().includes('invoice') ||
            t.toLowerCase().includes('aging')
        );
        
        console.log('\n💰 AR/Invoice Related Tables:');
        console.log('=============================');
        arTables.forEach(table => console.log(`• ${table}`));
        
        // Look for Order related tables
        const orderTables = tables.filter(t => 
            t.toLowerCase().includes('order') ||
            t.toLowerCase().includes('oe_') ||
            t.toLowerCase().includes('sales')
        );
        
        console.log('\n📦 Order Related Tables:');
        console.log('========================');
        orderTables.forEach(table => console.log(`• ${table}`));
        
        // Look for Customer related tables
        const customerTables = tables.filter(t => 
            t.toLowerCase().includes('customer') ||
            t.toLowerCase().includes('cust')
        );
        
        console.log('\n👥 Customer Related Tables:');
        console.log('===========================');
        customerTables.forEach(table => console.log(`• ${table}`));
        
        // Look for Inventory related tables
        const inventoryTables = tables.filter(t => 
            t.toLowerCase().includes('inv') ||
            t.toLowerCase().includes('inventory') ||
            t.toLowerCase().includes('product')
        );
        
        console.log('\n📦 Inventory Related Tables:');
        console.log('============================');
        inventoryTables.forEach(table => console.log(`• ${table}`));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mcp.cleanup();
        process.exit(0);
    }
}

discoverP21Tables();
