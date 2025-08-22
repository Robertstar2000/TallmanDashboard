// Quick test script to verify backend authentication
const fetch = require('node-fetch');

async function testAuth() {
    const baseUrl = 'http://localhost:3001';
    
    console.log('Testing backend server...');
    
    // Test 1: Server status
    try {
        const testResponse = await fetch(`${baseUrl}/api/test`);
        if (testResponse.ok) {
            const data = await testResponse.json();
            console.log('✅ Backend server is running:', data);
        } else {
            console.log('❌ Backend server test failed:', testResponse.status);
            return;
        }
    } catch (error) {
        console.log('❌ Cannot connect to backend server:', error.message);
        return;
    }
    
    // Test 2: BobM authentication
    console.log('\nTesting BobM authentication...');
    try {
        const authResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'BobM',
                password: 'Rm2214ri#'
            })
        });
        
        const authData = await authResponse.json();
        
        if (authResponse.ok) {
            console.log('✅ BobM authentication successful:', authData);
        } else {
            console.log('❌ BobM authentication failed:', authData);
        }
    } catch (error) {
        console.log('❌ Authentication test error:', error.message);
    }
    
    // Test 3: Local fallback authentication
    console.log('\nTesting local fallback authentication...');
    try {
        const localResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const localData = await localResponse.json();
        
        if (localResponse.ok) {
            console.log('✅ Local authentication successful:', localData);
        } else {
            console.log('❌ Local authentication failed:', localData);
        }
    } catch (error) {
        console.log('❌ Local authentication test error:', error.message);
    }
}

testAuth();
