const { MCPController } = require('./mcpControllerSDK.js');

async function discoverP21Schema() {
    const mcpController = new MCPController();
    
    try {
        console.log('🔍 Discovering P21 database schema...\n');
        
        // Get list of tables
        console.log('📋 Getting table list...');
        const tablesResult = await mcpController.executeQuery('P21', 'SELECT name FROM sys.tables ORDER BY name');
        console.log('Tables result:', tablesResult);
        
        // Try to get table names using a different approach
        const tableListQuery = `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            AND TABLE_NAME IN ('ar_open_items', 'oe_hdr', 'customer_mst', 'inv_mast', 'invoice_hdr', 'order_hdr', 'location_mst')
            ORDER BY TABLE_NAME
        `;
        
        console.log('\n📋 Checking for key P21 tables...');
        const keyTables = await mcpController.executeQuery('P21', tableListQuery);
        console.log('Key tables found:', keyTables);
        
        // Get column information for key tables
        const tablesToCheck = ['ar_open_items', 'oe_hdr', 'customer_mst', 'inv_mast'];
        
        for (const tableName of tablesToCheck) {
            console.log(`\n🔍 Describing table: ${tableName}`);
            
            try {
                const columnsQuery = `
                    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '${tableName}' 
                    ORDER BY ORDINAL_POSITION
                `;
                
                const columns = await mcpController.executeQuery('P21', columnsQuery);
                console.log(`Columns for ${tableName}:`, columns);
                
                // Also try a simple SELECT to see what columns exist
                const sampleQuery = `SELECT TOP 1 * FROM dbo.${tableName} WITH (NOLOCK)`;
                console.log(`\n📊 Sample data from ${tableName}:`);
                const sampleData = await mcpController.executeQuery('P21', sampleQuery);
                console.log('Sample result:', sampleData);
                
            } catch (error) {
                console.log(`❌ Error accessing ${tableName}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('Schema discovery failed:', error);
    } finally {
        await mcpController.cleanup();
    }
}

discoverP21Schema();
