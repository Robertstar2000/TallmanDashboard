// Test backend API endpoints and force refresh
import fetch from 'node-fetch';

async function testAPI() {
    console.log('🔍 Testing backend API endpoints...');
    
    const endpoints = [
        { url: 'http://localhost:3001/api/status', method: 'GET' },
        { url: 'http://localhost:3001/api/background-worker/status', method: 'GET' },
        { url: 'http://localhost:3001/api/background-worker/refresh', method: 'POST' },
        { url: 'http://localhost:3001/api/background-worker/force-refresh', method: 'POST' },
        { url: 'http://localhost:3001/api/dashboard-data', method: 'GET' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n🔗 Testing ${endpoint.method} ${endpoint.url}`);
            const response = await fetch(endpoint.url, { 
                method: endpoint.method,
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.text();
                console.log(`   Response: ${data.substring(0, 300)}...`);
                
                // If this is a refresh endpoint and it worked, great!
                if (endpoint.url.includes('refresh')) {
                    console.log('✅ Force refresh triggered successfully!');
                }
            } else {
                console.log(`   ❌ Failed: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
    }
    
    // Test worker status
    console.log('\n🔍 Testing /api/dashboard/worker/status...');
    try {
        const statusResponse = await fetch('http://localhost:3001/api/dashboard/worker/status');
        if (statusResponse.ok) {
            const status = await statusResponse.json();
            console.log('✅ Worker status endpoint working');
            console.log('Worker status:', JSON.stringify(status, null, 2));
        } else {
            console.log(`❌ Worker status failed: ${statusResponse.status}`);
        }
    } catch (error) {
        console.log(`❌ Worker status ERROR: ${error.message}`);
    }
}

testAPI();
