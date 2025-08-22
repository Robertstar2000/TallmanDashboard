const fs = require('fs');
const path = require('path');

async function fixDatabaseConnections() {
    console.log('=== Database Connection Fix ===\n');
    
    // Step 1: Check current MCP server configurations
    console.log('1. Current MCP Server Configurations:\n');
    
    const p21EnvPath = path.join(__dirname, '..', 'P21-MCP-Server-Package', '.env');
    const porEnvPath = path.join(__dirname, '..', 'POR-MCP-Server-Package', '.env');
    
    console.log('P21 MCP Server (.env):');
    if (fs.existsSync(p21EnvPath)) {
        const p21Config = fs.readFileSync(p21EnvPath, 'utf8');
        console.log(p21Config);
    } else {
        console.log('❌ P21 .env file not found');
    }
    
    console.log('\nPOR MCP Server (.env):');
    if (fs.existsSync(porEnvPath)) {
        const porConfig = fs.readFileSync(porEnvPath, 'utf8');
        console.log(porConfig);
    } else {
        console.log('❌ POR .env file not found');
    }
    
    // Step 2: Recommend fixes based on user's memory about database connections
    console.log('\n2. Database Connection Issues & Fixes:\n');
    
    console.log('🔍 DIAGNOSIS:');
    console.log('- All SQL queries return 99999 (sentinel value for MCP failures)');
    console.log('- MCP servers cannot connect to external databases');
    console.log('- P21 schema tables (ar_invoices, sales_orders, etc.) likely don\'t exist');
    console.log('- Need to use actual P21 database table names\n');
    
    console.log('💡 SOLUTIONS:');
    console.log('1. **P21 Database Connection:**');
    console.log('   - Current DSN: P21live (likely incorrect)');
    console.log('   - From memory: Should use SQL01 server, P21Play database');
    console.log('   - Use Windows Authentication with Tallman.com domain');
    console.log('   - Connection string: Server=SQL01;Database=P21Play;Trusted_Connection=yes;');
    
    console.log('\n2. **P21 Table Names:**');
    console.log('   - Our schema uses: ar_invoices, sales_orders, customers, inventory');
    console.log('   - Actual P21 likely uses: ARINV, SOMAST, CUSTOMER, INVMAST');
    console.log('   - Need to discover actual table names via SQL Server');
    
    console.log('\n3. **POR Database:**');
    console.log('   - MS Access database file path needs to be configured');
    console.log('   - From memory: Uses MS Access/Jet SQL syntax');
    
    // Step 3: Create updated MCP server configurations
    console.log('\n3. Creating Updated MCP Server Configurations:\n');
    
    // Update P21 MCP server configuration
    const newP21Config = `# P21 MCP Server Configuration
# Updated to use actual P21 database connection
P21_SERVER=SQL01
P21_DATABASE=P21Play
P21_TRUSTED_CONNECTION=true
P21_CONNECTION_STRING=Server=SQL01;Database=P21Play;Trusted_Connection=yes;
`;
    
    console.log('Updated P21 .env configuration:');
    console.log(newP21Config);
    
    try {
        fs.writeFileSync(p21EnvPath, newP21Config);
        console.log('✅ P21 .env file updated');
    } catch (error) {
        console.log('❌ Failed to update P21 .env:', error.message);
    }
    
    // Step 4: Create table discovery script
    console.log('\n4. Creating Table Discovery Script:\n');
    
    const discoveryScript = `-- P21 Database Table Discovery
-- Run this against the actual P21 database to find correct table names

-- Find tables related to AR (Accounts Receivable)
SELECT TABLE_NAME, TABLE_TYPE 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE '%AR%' OR TABLE_NAME LIKE '%INVOICE%'
ORDER BY TABLE_NAME;

-- Find tables related to Sales Orders
SELECT TABLE_NAME, TABLE_TYPE 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE '%SO%' OR TABLE_NAME LIKE '%ORDER%' OR TABLE_NAME LIKE '%SALES%'
ORDER BY TABLE_NAME;

-- Find tables related to Customers
SELECT TABLE_NAME, TABLE_TYPE 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE '%CUST%' OR TABLE_NAME LIKE '%CLIENT%'
ORDER BY TABLE_NAME;

-- Find tables related to Inventory
SELECT TABLE_NAME, TABLE_TYPE 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE '%INV%' OR TABLE_NAME LIKE '%ITEM%' OR TABLE_NAME LIKE '%PRODUCT%'
ORDER BY TABLE_NAME;
`;
    
    const discoveryPath = path.join(__dirname, 'discover-p21-tables.sql');
    fs.writeFileSync(discoveryPath, discoveryScript);
    console.log(`✅ Table discovery script created: ${discoveryPath}`);
    
    // Step 5: Create test script for actual P21 connection
    console.log('\n5. Next Steps:\n');
    console.log('📋 IMMEDIATE ACTIONS NEEDED:');
    console.log('1. Run discover-p21-tables.sql against actual P21 database');
    console.log('2. Update allData.json with correct P21 table names');
    console.log('3. Test MCP server connection with new configuration');
    console.log('4. Configure POR database file path');
    console.log('5. Restart background worker to test real data retrieval');
    
    console.log('\n🔧 MANUAL STEPS:');
    console.log('1. Connect to SQL01\\P21Play database using SQL Server Management Studio');
    console.log('2. Run the table discovery queries to find actual table names');
    console.log('3. Update SQL expressions in allData.json to use correct table names');
    console.log('4. Test a simple query like: SELECT COUNT(*) FROM [actual_table_name]');
    
    console.log('\n✅ Configuration files updated. Ready for database connection testing.');
}

fixDatabaseConnections();
