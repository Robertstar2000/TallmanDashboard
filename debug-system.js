// Comprehensive System Debug
import fetch from 'node-fetch';

async function debugSystem() {
    console.log('=== TallmanDashboard System Debug ===\n');
    
    // 1. Check what's running on each port
    console.log('1. CHECKING PORTS...');
    const ports = [3001, 5173, 5500];
    for (const port of ports) {
        try {
            const response = await fetch(`http://localhost:${port}`, { timeout: 2000 });
            const text = await response.text();
            const isAPI = text.includes('{"') || text.includes('[{');
            const isHTML = text.includes('<html') || text.includes('<!DOCTYPE');
            console.log(`✅ Port ${port}: ${response.status} - ${isAPI ? 'API Response' : isHTML ? 'HTML/Frontend' : 'Unknown'}`);
        } catch (error) {
            console.log(`❌ Port ${port}: Not accessible (${error.message})`);
        }
    }
    
    // 2. Check backend API endpoints
    console.log('\n2. CHECKING BACKEND API...');
    try {
        // Dashboard data
        const dataResp = await fetch('http://localhost:3001/api/dashboard/data');
        if (dataResp.ok) {
            const data = await dataResp.json();
            console.log(`✅ Dashboard data: ${data.length} metrics loaded`);
            
            // Analyze values
            const values = data.map(d => d.value);
            const count99999 = values.filter(v => v === 99999).length;
            const count0 = values.filter(v => v === 0).length; 
            const countReal = values.filter(v => v !== 99999 && v !== 0 && v > 0).length;
            console.log(`   Values: ${count99999} are 99999, ${count0} are 0, ${countReal} are real data`);
            
            // Show first few metrics details
            console.log('   Sample metrics:');
            data.slice(0, 3).forEach(m => {
                console.log(`   - ${m.variableName}: ${m.value} (${m.status}) via ${m.serverName}`);
            });
        } else {
            console.log(`❌ Dashboard data: ${dataResp.status} ${dataResp.statusText}`);
        }
        
        // Worker status  
        const workerResp = await fetch('http://localhost:3001/api/dashboard/worker/status');
        if (workerResp.ok) {
            const status = await workerResp.json();
            console.log(`✅ Worker status: ${status.running ? 'RUNNING' : 'STOPPED'} - ${status.message}`);
            console.log(`   Mode: ${status.mode}, Current: ${status.currentIndex}/${status.totalMetrics}`);
        }
        
        // MCP connections
        const mcpResp = await fetch('http://localhost:3001/api/test/mcp-connections');
        if (mcpResp.ok) {
            const mcpStatus = await mcpResp.json();
            console.log(`✅ MCP Status: P21=${mcpStatus.P21}, POR=${mcpStatus.POR}`);
        }
        
    } catch (error) {
        console.log(`❌ Backend API Error: ${error.message}`);
    }
    
    // 3. Check allData.json source
    console.log('\n3. CHECKING DATA SOURCE...');
    try {
        const fs = await import('fs');
        const allDataPath = 'C:\\Users\\BobM\\Desktop\\TallmanDashboard\\allData.json';
        const allDataContent = fs.readFileSync(allDataPath, 'utf8');
        const allData = JSON.parse(allDataContent);
        
        const sourceValues = allData.map(d => d.value);
        const source99999 = sourceValues.filter(v => v === 99999).length;
        const source0 = sourceValues.filter(v => v === 0).length;
        const sourceReal = sourceValues.filter(v => v !== 99999 && v !== 0 && v > 0).length;
        
        console.log(`✅ allData.json: ${allData.length} metrics`);
        console.log(`   Source values: ${source99999} are 99999, ${source0} are 0, ${sourceReal} are real`);
        
        // Check if any have recent updates
        const recentUpdates = allData.filter(m => {
            if (!m.lastUpdated) return false;
            const updated = new Date(m.lastUpdated);
            const now = new Date();
            const diffMinutes = (now - updated) / (1000 * 60);
            return diffMinutes < 30; // Updated in last 30 minutes
        });
        console.log(`   Recently updated: ${recentUpdates.length} metrics`);
        
    } catch (error) {
        console.log(`❌ allData.json Error: ${error.message}`);
    }
    
    console.log('\n=== DEBUG COMPLETE ===');
}

debugSystem().catch(console.error);
