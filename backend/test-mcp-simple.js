const { spawn } = require('child_process');
const path = require('path');

async function testP21MCPServer() {
    console.log('=== Testing P21 MCP Server with DSN ===\n');
    
    const p21ServerPath = path.join(__dirname, '..', 'P21-MCP-Server-Package');
    
    console.log('Starting P21 MCP server...');
    
    // Start the P21 MCP server using tsx to handle TypeScript
    const serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
        cwd: p21ServerPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
    });
    
    let serverReady = false;
    let connectionAttempted = false;
    
    // Monitor server stderr for startup messages
    serverProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        console.log(`[P21 Server] ${message}`);
        
        if (message.includes('P21 MCP server running on stdio')) {
            serverReady = true;
            console.log('✅ P21 MCP server started successfully');
        }
        
        if (message.includes('P21 MCP Server starting with DSN')) {
            console.log('✅ P21 server using DSN configuration');
        }
        
        if (message.includes('Connecting to P21 with: DSN=')) {
            connectionAttempted = true;
            console.log('✅ P21 server attempting database connection');
        }
    });
    
    serverProcess.stdout.on('data', (data) => {
        console.log(`[P21 Stdout] ${data.toString().trim()}`);
    });
    
    serverProcess.on('error', (error) => {
        console.error('❌ Server process error:', error.message);
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (serverReady) {
        console.log('\n--- Testing MCP Communication ---');
        
        // Test list_tables tool
        const listTablesRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: 'list_tables',
                arguments: {}
            }
        };
        
        try {
            serverProcess.stdin.write(JSON.stringify(listTablesRequest) + '\n');
            console.log('Sent list_tables request...');
            
            // Wait for response
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Test simple query
            const queryRequest = {
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/call',
                params: {
                    name: 'execute_query',
                    arguments: {
                        query: 'SELECT COUNT(*) as value FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\''
                    }
                }
            };
            
            serverProcess.stdin.write(JSON.stringify(queryRequest) + '\n');
            console.log('Sent test query...');
            
            // Wait for response
            await new Promise(resolve => setTimeout(resolve, 5000));
            
        } catch (error) {
            console.error('❌ Error sending requests:', error.message);
        }
    } else {
        console.log('❌ P21 server did not start properly');
    }
    
    // Clean up
    console.log('\n--- Cleaning up ---');
    serverProcess.kill();
    
    console.log('\n=== Test Summary ===');
    console.log(`Server Ready: ${serverReady ? '✅' : '❌'}`);
    console.log(`Connection Attempted: ${connectionAttempted ? '✅' : '❌'}`);
}

testP21MCPServer().catch(console.error);
