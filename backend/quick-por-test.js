// Quick POR Connection Test
import MCPController from './mcpControllerFixed.js';

console.log('=== Quick POR Connection Test ===');

async function testPORConnection() {
    try {
        const mcpController = new MCPController();
        
        console.log('Testing POR connection with simple query...');
            const result = await mcpController.executeQuery('POR', 'SELECT 42 as value');

        if (Number.isFinite(result)) {
            console.log('✅ SUCCESS: POR connection working!');
            console.log('✅ Result:', result);
            console.log('✅ The system health report should now show POR as Connected');
        } else {
            console.log('❌ FAILED: POR connection failed');
            console.log('❌ Result:', result);
        }
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        console.log('💡 Make sure:');
        console.log('   1. MCP server dependencies are installed (cd mcp-servers && npm install)');
        console.log('   2. POR server path is correct in mcpControllerFixed.js');
        console.log('   3. Environment variable POR_DB_PATH is set');
    }
}

testPORConnection();