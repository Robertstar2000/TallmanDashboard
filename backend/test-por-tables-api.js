const fetch = require('node-fetch');

async function testPORTables() {
    console.log('=== Testing POR Tables via API ===\n');
    
    try {
        // Test list tables
        console.log('1. Requesting POR table list...');
        const response = await fetch('http://localhost:3001/api/mcp/execute-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'list tables',
                server: 'POR'
            })
        });
        
        if (response.ok) {
            const tables = await response.json();
            console.log('✅ POR Tables found:');
            console.log(JSON.stringify(tables, null, 2));
            
            // Look for rental-related tables
            if (Array.isArray(tables)) {
                const rentalTables = tables.filter(table => 
                    table.toLowerCase().includes('rental') || 
                    table.toLowerCase().includes('contract') ||
                    table.toLowerCase().includes('lease') ||
                    table.toLowerCase().includes('agreement')
                );
                
                if (rentalTables.length > 0) {
                    console.log('\n📋 Rental-related tables:');
                    rentalTables.forEach(table => console.log(`- ${table}`));
                } else {
                    console.log('\n⚠️ No obvious rental tables found');
                    console.log('First 10 tables:');
                    tables.slice(0, 10).forEach(table => console.log(`- ${table}`));
                }
            }
        } else {
            console.error('❌ Failed to get tables:', response.status, response.statusText);
        }
        
        // Test P21 tables as well
        console.log('\n2. Testing P21 table discovery...');
        const p21Response = await fetch('http://localhost:3001/api/mcp/execute-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'list tables',
                server: 'P21'
            })
        });
        
        if (p21Response.ok) {
            const p21Tables = await p21Response.json();
            console.log('✅ P21 Tables sample:');
            if (Array.isArray(p21Tables)) {
                console.log(`Found ${p21Tables.length} tables`);
                console.log('Sample tables:', p21Tables.slice(0, 5));
                
                // Look for invoice/order tables
                const relevantTables = p21Tables.filter(table => 
                    table.toLowerCase().includes('invoice') || 
                    table.toLowerCase().includes('order') ||
                    table.toLowerCase().includes('customer') ||
                    table.toLowerCase().includes('ar_')
                );
                
                if (relevantTables.length > 0) {
                    console.log('📋 Relevant P21 tables:');
                    relevantTables.forEach(table => console.log(`- ${table}`));
                }
            }
        } else {
            console.error('❌ Failed to get P21 tables:', p21Response.status);
        }
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

testPORTables();
