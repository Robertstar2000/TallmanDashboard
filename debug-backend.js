// Debug Backend Status
import fetch from 'node-fetch';

async function debugBackend() {
    console.log('=== Backend Debug ===');
    
    try {
        // Test API endpoints
        console.log('1. Testing /api/dashboard/data...');
        const dataResp = await fetch('http://localhost:3001/api/dashboard/data');
        if (dataResp.ok) {
            const data = await dataResp.json();
            console.log(`✅ Got ${data.length} metrics`);
            console.log('Sample metric:', {
                id: data[0].id,
                name: data[0].variableName,
                value: data[0].value,
                status: data[0].status,
                server: data[0].serverName
            });
            
            // Count values
            const values = data.map(d => d.value);
            const count99999 = values.filter(v => v === 99999).length;
            const count0 = values.filter(v => v === 0).length;
            const countOther = values.filter(v => v !== 99999 && v !== 0).length;
            console.log(`Values: ${count99999} are 99999, ${count0} are 0, ${countOther} are other`);
        }
        
        console.log('\n2. Testing /api/dashboard/worker/status...');
        const statusResp = await fetch('http://localhost:3001/api/dashboard/worker/status');
        if (statusResp.ok) {
            const status = await statusResp.json();
            console.log('✅ Worker status:', status.message);
            console.log('Running:', status.running);
            console.log('Mode:', status.mode);
        }
        
        console.log('\n3. Testing /api/test/mcp-connections...');
        const mcpResp = await fetch('http://localhost:3001/api/test/mcp-connections');
        if (mcpResp.ok) {
            const mcpStatus = await mcpResp.json();
            console.log('✅ MCP Status:', mcpStatus);
        }
        
        console.log('\n4. Testing /api/admin/mcp-status...');
        const adminResp = await fetch('http://localhost:3001/api/admin/mcp-status');
        if (adminResp.ok) {
            const adminStatus = await adminResp.json();
            console.log('✅ Admin MCP Status:', adminStatus);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

debugBackend();
