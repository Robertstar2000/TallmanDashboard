const fetch = require('node-fetch');

async function discoverPORTables() {
    console.log('=== Discovering POR Database Tables via API ===\n');
    
    try {
        // Test POR connection first
        console.log('1. Testing POR connection...');
        const testResponse = await fetch('http://localhost:3001/api/mcp/execute-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'SELECT 42 as value',
                server: 'POR'
            })
        });
        
        if (testResponse.ok) {
            const testResult = await testResponse.json();
            console.log('✅ POR connection test:', testResult);
        } else {
            console.log('❌ POR connection failed:', testResponse.status);
            return;
        }
        
        // Get POR table list
        console.log('\n2. Getting POR table list...');
        const tablesResponse = await fetch('http://localhost:3001/api/mcp/execute-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'list tables',
                server: 'POR'
            })
        });
        
        if (tablesResponse.ok) {
            const tables = await tablesResponse.json();
            console.log(`✅ Found ${tables.length} POR tables`);
            
            // Show all tables
            console.log('\n📋 All POR Tables:');
            tables.forEach((table, index) => {
                console.log(`${index + 1}. ${table}`);
            });
            
            // Look for rental-related tables
            const rentalTables = tables.filter(table => 
                table.toLowerCase().includes('rental') || 
                table.toLowerCase().includes('contract') ||
                table.toLowerCase().includes('lease') ||
                table.toLowerCase().includes('agreement') ||
                table.toLowerCase().includes('customer') ||
                table.toLowerCase().includes('equip')
            );
            
            if (rentalTables.length > 0) {
                console.log('\n🎯 Potential rental-related tables:');
                rentalTables.forEach(table => console.log(`- ${table}`));
            }
            
            // Test a sample query on the first few tables to understand structure
            console.log('\n3. Testing sample queries on first few tables...');
            for (let i = 0; i < Math.min(3, tables.length); i++) {
                const table = tables[i];
                console.log(`\nTesting table: ${table}`);
                
                try {
                    const sampleResponse = await fetch('http://localhost:3001/api/mcp/execute-query', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            query: `SELECT TOP 1 * FROM [${table}]`,
                            server: 'POR'
                        })
                    });
                    
                    if (sampleResponse.ok) {
                        const sampleResult = await sampleResponse.json();
                        if (Array.isArray(sampleResult) && sampleResult.length > 0) {
                            const columns = Object.keys(sampleResult[0]);
                            console.log(`  Columns: ${columns.join(', ')}`);
                        }
                    }
                } catch (error) {
                    console.log(`  Error querying ${table}: ${error.message}`);
                }
            }
            
            return tables;
            
        } else {
            console.error('❌ Failed to get POR tables:', tablesResponse.status);
            const errorText = await tablesResponse.text();
            console.log('Error details:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Discovery failed:', error.message);
    }
}

discoverPORTables().then(tables => {
    if (tables && tables.length > 0) {
        console.log(`\n✅ Discovery complete. Found ${tables.length} tables in POR database.`);
    }
}).catch(console.error);
