// Debug MCP connections and SQL execution
import MCPController from './backend/mcpControllerFixed.js';
import fs from 'fs';

console.log('=== DEBUGGING MCP CONNECTIONS AND SQL EXECUTION ===\n');

const mcpController = new MCPController();

// Test basic MCP connections
async function testMCPConnections() {
    console.log('1. Testing basic MCP connections...\n');
    
    try {
        // Test P21 connection
        console.log('Testing P21 MCP server connection...');
        const p21Result = await mcpController.executeQuery('P21', 'SELECT 1 as test');
        console.log('✅ P21 connection successful:', p21Result);
    } catch (error) {
        console.log('❌ P21 connection failed:', error.message);
    }
    
    try {
        // Test POR connection
        console.log('\nTesting POR MCP server connection...');
        const porResult = await mcpController.executeQuery('POR', 'SELECT 1 as test');
        console.log('✅ POR connection successful:', porResult);
    } catch (error) {
        console.log('❌ POR connection failed:', error.message);
    }
}

// Test actual SQL queries from allData.json
async function testActualQueries() {
    console.log('\n2. Testing actual SQL queries from allData.json...\n');
    
    try {
        const allData = JSON.parse(fs.readFileSync('allData.json', 'utf8'));
        console.log(`Found ${allData.length} metrics to test`);
        
        // Test first 5 entries from each server
        const p21Entries = allData.filter(entry => entry.serverName === 'P21').slice(0, 3);
        const porEntries = allData.filter(entry => entry.serverName === 'POR').slice(0, 3);
        
        console.log('\nTesting P21 queries:');
        for (const entry of p21Entries) {
            try {
                console.log(`Testing ID ${entry.id}: ${entry.variableName}`);
                console.log(`SQL: ${entry.productionSqlExpression.substring(0, 100)}...`);
                
                const result = await mcpController.executeQuery('P21', entry.productionSqlExpression);
                console.log(`✅ Result: ${JSON.stringify(result)}`);
            } catch (error) {
                console.log(`❌ Failed: ${error.message}`);
            }
            console.log('---');
        }
        
        console.log('\nTesting POR queries:');
        for (const entry of porEntries) {
            try {
                console.log(`Testing ID ${entry.id}: ${entry.variableName}`);
                console.log(`SQL: ${entry.productionSqlExpression.substring(0, 100)}...`);
                
                const result = await mcpController.executeQuery('POR', entry.productionSqlExpression);
                console.log(`✅ Result: ${JSON.stringify(result)}`);
            } catch (error) {
                console.log(`❌ Failed: ${error.message}`);
            }
            console.log('---');
        }
        
    } catch (error) {
        console.error('Failed to load allData.json:', error.message);
    }
}

// Check if MCP servers are running
async function checkMCPServerProcesses() {
    console.log('\n3. Checking MCP server processes...\n');
    
    try {
        // This would need to be implemented to check if MCP server processes are running
        console.log('MCP server process check would go here...');
    } catch (error) {
        console.error('Process check failed:', error.message);
    }
}

// Main execution
async function main() {
    try {
        await testMCPConnections();
        await testActualQueries();
        await checkMCPServerProcesses();
        
        console.log('\n=== DEBUG COMPLETE ===');
    } catch (error) {
        console.error('Debug script failed:', error.message);
    }
}

main();
