const fetch = require('node-fetch');

async function testP21Tables() {
    console.log('=== Testing P21 Database Tables ===\n');
    
    try {
        // Test a simple query first
        console.log('1. Testing P21 connection...');
        const testResponse = await fetch('http://localhost:3001/api/mcp/execute-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'SELECT 1 as value',
                server: 'P21'
            })
        });
        
        if (testResponse.ok) {
            const testResult = await testResponse.json();
            console.log('✅ P21 connection test:', testResult);
        }
        
        // Get table list
        console.log('\n2. Getting P21 table list...');
        const tablesResponse = await fetch('http://localhost:3001/api/mcp/execute-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'list tables',
                server: 'P21'
            })
        });
        
        if (tablesResponse.ok) {
            const tables = await tablesResponse.json();
            console.log(`✅ Found ${tables.length} P21 tables`);
            
            // Look for AR/AP related tables
            const arTables = tables.filter(table => 
                table.toLowerCase().includes('ar_') || 
                table.toLowerCase().includes('receivab') ||
                table.toLowerCase().includes('invoice')
            );
            
            const apTables = tables.filter(table => 
                table.toLowerCase().includes('ap_') || 
                table.toLowerCase().includes('payab') ||
                table.toLowerCase().includes('vendor')
            );
            
            const orderTables = tables.filter(table => 
                table.toLowerCase().includes('order') || 
                table.toLowerCase().includes('oe_') ||
                table.toLowerCase().includes('sales')
            );
            
            console.log('\n📋 AR/Invoice related tables:');
            arTables.forEach(table => console.log(`- ${table}`));
            
            console.log('\n📋 AP/Payable related tables:');
            apTables.forEach(table => console.log(`- ${table}`));
            
            console.log('\n📋 Order related tables:');
            orderTables.forEach(table => console.log(`- ${table}`));
            
            // Test one of the current failing queries
            console.log('\n3. Testing current failing query...');
            const failingQuery = 'SELECT ISNULL(SUM(invoice_balance), 0) AS value FROM dbo.ar_invoices WITH (NOLOCK) WHERE status = \'Open\' AND due_date >= GETDATE()';
            
            const failResponse = await fetch('http://localhost:3001/api/mcp/execute-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: failingQuery,
                    server: 'P21'
                })
            });
            
            if (failResponse.ok) {
                const failResult = await failResponse.json();
                console.log('Current query result:', failResult);
            } else {
                console.log('❌ Current query failed:', failResponse.status);
                const errorText = await failResponse.text();
                console.log('Error:', errorText);
            }
            
        } else {
            console.error('❌ Failed to get P21 tables:', tablesResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testP21Tables();
