#!/usr/bin/env node

const fetch = require('node-fetch');

async function testStatusEndpoint() {
    console.log('=== Testing Backend /api/connections/status Endpoint ===\n');
    
    // Set environment variable for POR
    process.env.POR_DB_PATH = '\\\\ts03\\POR\\POR.MDB';
    
    try {
        console.log('1. Testing backend status endpoint...');
        
        // Assuming backend is running on port 3001
        const response = await fetch('http://localhost:3001/api/connections/status');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Status Endpoint Response:', JSON.stringify(data, null, 2));
        
        // Check POR specifically
        const porStatus = data.find(conn => conn.name === 'POR');
        if (porStatus) {
            console.log('\n🔍 POR Status Details:');
            console.log(`  Status: ${porStatus.status}`);
            console.log(`  Details: ${porStatus.details}`);
            console.log(`  Version: ${porStatus.version}`);
            console.log(`  Response Time: ${porStatus.responseTime}`);
            
            if (porStatus.status === 'Connected') {
                console.log('✅ POR shows as Connected in backend!');
            } else {
                console.log('❌ POR shows as Disconnected in backend');
                console.log('   This means the MCP connection is failing in the backend');
            }
        } else {
            console.log('❌ POR not found in status response');
        }
        
    } catch (error) {
        console.error('❌ Failed to test status endpoint:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Backend server not running. Start it with:');
            console.log('   cd backend');
            console.log('   node server.js');
        }
    }
}

testStatusEndpoint().catch(console.error);