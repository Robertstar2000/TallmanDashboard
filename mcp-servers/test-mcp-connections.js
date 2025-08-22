// Test MCP Connections using Dashboard's MCPController
import MCPController from '../backend/mcpControllerFixed.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('=== MCP Server Connection Test ===');
console.log('Environment check:');
console.log('P21_DSN:', process.env.P21_DSN || 'NOT SET');
console.log('P21_TRUSTED_CONNECTION:', process.env.P21_TRUSTED_CONNECTION || 'NOT SET');
console.log('POR_FILE_PATH:', process.env.POR_FILE_PATH || 'NOT SET');
console.log('');

async function testMCPConnections() {
    const controller = new MCPController();
    
    // Test P21 connection
    console.log('🔍 Testing P21 MCP connection...');
    try {
        const p21Result = await controller.executeQuery('P21', 'SELECT 1 as value');
        console.log('✅ P21 MCP connection successful!');
        console.log('P21 test result:', p21Result);
    } catch (error) {
        console.log('❌ P21 MCP connection failed:');
        console.log('Error:', error.message);
    }
    console.log('');
    
    // Test POR connection  
    console.log('🔍 Testing POR MCP connection...');
    try {
        const porResult = await controller.executeQuery('POR', 'SELECT 1 as value');
        console.log('✅ POR MCP connection successful!');
        console.log('POR test result:', porResult);
    } catch (error) {
        console.log('❌ POR MCP connection failed:');
        console.log('Error:', error.message);
    }
    console.log('');
    
    // Test list tables functionality
    console.log('🔍 Testing P21 list tables...');
    try {
        const p21Tables = await controller.executeListTables('P21');
        console.log('✅ P21 list tables successful!');
        console.log('P21 tables count:', Array.isArray(p21Tables) ? p21Tables.length : 'N/A');
    } catch (error) {
        console.log('❌ P21 list tables failed:');
        console.log('Error:', error.message);
    }
    console.log('');
    
    console.log('🔍 Testing POR list tables...');
    try {
        const porTables = await controller.executeListTables('POR');
        console.log('✅ POR list tables successful!');
        console.log('POR tables count:', Array.isArray(porTables) ? porTables.length : 'N/A');
    } catch (error) {
        console.log('❌ POR list tables failed:');
        console.log('Error:', error.message);
    }
    
    console.log('=== Test Complete ===');
    process.exit(0);
}

testMCPConnections().catch(error => {
    console.error('❌ Test script failed:', error.message);
    process.exit(1);
});
