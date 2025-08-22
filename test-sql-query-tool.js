// Test script to verify SQL Query Tool with real MCP servers
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testSQLQueryTool() {
    console.log('🧪 Testing SQL Query Tool with Real MCP Servers');
    console.log('================================================');
    
    try {
        // Test 1: List tables from P21
        console.log('\n📋 Test 1: Fetching P21 table list...');
        const p21TablesResponse = await fetch(`${BASE_URL}/api/mcp/execute-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: 'list tables',
                server: 'P21'
            })
        });
        
        if (p21TablesResponse.ok) {
            const p21Tables = await p21TablesResponse.json();
            console.log(`✅ P21 Tables Retrieved: ${Array.isArray(p21Tables) ? p21Tables.length : 'non-array'} tables`);
            if (Array.isArray(p21Tables)) {
                console.log('First 10 P21 tables:', p21Tables.slice(0, 10));
            } else {
                console.log('P21 response:', p21Tables);
            }
        } else {
            const error = await p21TablesResponse.text();
            console.log('❌ P21 table list failed:', error);
        }
        
        // Test 2: List tables from POR
        console.log('\n📋 Test 2: Fetching POR table list...');
        const porTablesResponse = await fetch(`${BASE_URL}/api/mcp/execute-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: 'list tables',
                server: 'POR'
            })
        });
        
        if (porTablesResponse.ok) {
            const porTables = await porTablesResponse.json();
            console.log(`✅ POR Tables Retrieved: ${Array.isArray(porTables) ? porTables.length : 'non-array'} tables`);
            if (Array.isArray(porTables)) {
                console.log('First 10 POR tables:', porTables.slice(0, 10));
            } else {
                console.log('POR response:', porTables);
            }
        } else {
            const error = await porTablesResponse.text();
            console.log('❌ POR table list failed:', error);
        }
        
        // Test 3: Execute a simple SQL query on P21
        console.log('\n🔍 Test 3: Testing P21 SQL query execution...');
        const p21QueryResponse = await fetch(`${BASE_URL}/api/mcp/execute-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: 'SELECT @@VERSION',
                server: 'P21'
            })
        });
        
        if (p21QueryResponse.ok) {
            const p21QueryResult = await p21QueryResponse.json();
            console.log('✅ P21 SQL Query Result:', p21QueryResult);
        } else {
            const error = await p21QueryResponse.text();
            console.log('❌ P21 SQL query failed:', error);
        }
        
        // Test 4: Execute a simple SQL query on POR
        console.log('\n🔍 Test 4: Testing POR SQL query execution...');
        const porQueryResponse = await fetch(`${BASE_URL}/api/mcp/execute-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: 'SELECT * FROM MSysObjects WHERE Type=1 LIMIT 3',
                server: 'POR'
            })
        });
        
        if (porQueryResponse.ok) {
            const porQueryResult = await porQueryResponse.json();
            console.log('✅ POR SQL Query Result:', porQueryResult);
        } else {
            const error = await porQueryResponse.text();
            console.log('❌ POR SQL query failed:', error);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
    
    console.log('\n🏁 SQL Query Tool testing complete!');
}

testSQLQueryTool();
