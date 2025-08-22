// Test the SQL Query Tool endpoint directly
const fetch = require('node-fetch');

async function testSQLQueryEndpoint() {
    console.log('=== Testing SQL Query Tool Endpoint ===');
    
    const baseUrl = 'http://localhost:3001';
    
    // Test 1: List tables from P21
    console.log('\n1. Testing P21 table list...');
    try {
        const response = await fetch(`${baseUrl}/api/mcp/execute-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: 'list tables', 
                server: 'P21' 
            })
        });
        
        const result = await response.json();
        console.log('P21 Response status:', response.status);
        console.log('P21 Result:', Array.isArray(result) ? `Array with ${result.length} items` : typeof result);
        if (Array.isArray(result) && result.length > 0) {
            console.log('Sample P21 tables:', result.slice(0, 5));
        }
    } catch (error) {
        console.error('P21 test failed:', error.message);
    }
    
    // Test 2: List tables from POR
    console.log('\n2. Testing POR table list...');
    try {
        const response = await fetch(`${baseUrl}/api/mcp/execute-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: 'list tables', 
                server: 'POR' 
            })
        });
        
        const result = await response.json();
        console.log('POR Response status:', response.status);
        console.log('POR Result:', Array.isArray(result) ? `Array with ${result.length} items` : typeof result);
        if (Array.isArray(result) && result.length > 0) {
            console.log('Sample POR tables:', result.slice(0, 5));
        }
    } catch (error) {
        console.error('POR test failed:', error.message);
    }
    
    // Test 3: Simple P21 query
    console.log('\n3. Testing simple P21 query...');
    try {
        const response = await fetch(`${baseUrl}/api/mcp/execute-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: 'SELECT COUNT(*) as value FROM customer', 
                server: 'P21' 
            })
        });
        
        const result = await response.json();
        console.log('P21 Query Response status:', response.status);
        console.log('P21 Query Result:', result);
    } catch (error) {
        console.error('P21 query test failed:', error.message);
    }
    
    console.log('\n=== Test Complete ===');
}

testSQLQueryEndpoint();
