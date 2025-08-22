// Direct test of MCP list_tables functionality
const fetch = require('node-fetch');

async function testMCPListTables() {
    console.log('=== Testing MCP List Tables Direct ===');
    
    const baseUrl = 'http://localhost:3001';
    
    // Test P21 list_tables
    console.log('\n1. Testing P21 list_tables...');
    try {
        const response = await fetch(`${baseUrl}/api/mcp/execute-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: 'list tables', 
                server: 'P21' 
            })
        });
        
        if (!response.ok) {
            console.error('P21 HTTP Error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
        } else {
            const result = await response.json();
            console.log('P21 Result type:', typeof result);
            console.log('P21 Is array:', Array.isArray(result));
            if (Array.isArray(result)) {
                console.log('P21 Table count:', result.length);
                if (result.length > 0) {
                    console.log('P21 Sample tables:', result.slice(0, 5));
                } else {
                    console.log('P21 Empty array returned');
                }
            } else {
                console.log('P21 Non-array result:', result);
            }
        }
    } catch (error) {
        console.error('P21 Request failed:', error.message);
    }
    
    // Test POR list_tables
    console.log('\n2. Testing POR list_tables...');
    try {
        const response = await fetch(`${baseUrl}/api/mcp/execute-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: 'list tables', 
                server: 'POR' 
            })
        });
        
        if (!response.ok) {
            console.error('POR HTTP Error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
        } else {
            const result = await response.json();
            console.log('POR Result type:', typeof result);
            console.log('POR Is array:', Array.isArray(result));
            if (Array.isArray(result)) {
                console.log('POR Table count:', result.length);
                if (result.length > 0) {
                    console.log('POR Sample tables:', result.slice(0, 5));
                } else {
                    console.log('POR Empty array returned');
                }
            } else {
                console.log('POR Non-array result:', result);
                if (result === 99999) {
                    console.log('POR returned sentinel value 99999 - indicates MCP connection failure');
                }
            }
        }
    } catch (error) {
        console.error('POR Request failed:', error.message);
    }
    
    console.log('\n=== Test Complete ===');
}

testMCPListTables();
