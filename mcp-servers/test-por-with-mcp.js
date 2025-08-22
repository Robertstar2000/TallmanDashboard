// Test POR MCP Server with Simple Expression
const { spawn } = require('child_process');

async function testPORMCP() {
    console.log('Testing POR MCP Server with simple expression...');
    
    return new Promise((resolve, reject) => {
        // Start the POR MCP server
        const porServer = spawn('node', ['por-server.js'], {
            stdio: ['pipe', 'pipe', 'inherit'],
            env: { 
                ...process.env, 
                POR_DB_PATH: '\\\\ts03\\POR\\POR.MDB'
            }
        });

        let timeout = setTimeout(() => {
            console.log('Test timeout');
            porServer.kill();
            reject(new Error('Test timeout'));
        }, 10000);

        // Handle server output
        let buffer = '';
        porServer.stdout.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer
            
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const response = JSON.parse(line);
                        if (response.id === 1) {
                            console.log('✓ POR MCP Server initialized');
                            
                            // Send simple test query - just get a constant value
                            const testRequest = {
                                jsonrpc: '2.0',
                                id: 2,
                                method: 'tools/call',
                                params: {
                                    name: 'execute_por_query',
                                    arguments: {
                                        query: 'SELECT 42 as value'
                                    }
                                }
                            };
                            
                            console.log('Sending simple test query: SELECT 42 as value');
                            porServer.stdin.write(JSON.stringify(testRequest) + '\n');
                        }
                        
                        if (response.id === 2) {
                            clearTimeout(timeout);
                            
                            console.log('Response received:', JSON.stringify(response, null, 2));
                            
                            if (response.result && response.result.content) {
                                const result = JSON.parse(response.result.content[0].text);
                                if (result.success && result.data && result.data.length > 0) {
                                    console.log('✓ SUCCESS: POR test passed!');
                                    console.log('✓ Query returned:', result.data[0]);
                                    resolve(true);
                                } else {
                                    console.log('✗ FAILED: Query did not return expected data');
                                    reject(new Error('Query failed'));
                                }
                            } else if (response.error) {
                                console.log('✗ FAILED: MCP error:', response.error);
                                reject(new Error(response.error.message || 'MCP error'));
                            } else {
                                console.log('✗ FAILED: Unexpected response format');
                                reject(new Error('Unexpected response'));
                            }
                            
                            porServer.kill();
                        }
                    } catch (e) {
                        // Ignore non-JSON lines
                    }
                }
            }
        });

        // Initialize the MCP server
        const initRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'test-client', version: '1.0.0' }
            }
        };

        console.log('Initializing POR MCP server...');
        porServer.stdin.write(JSON.stringify(initRequest) + '\n');
    });
}

testPORMCP()
    .then(() => {
        console.log('POR MCP test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.log('POR MCP test failed:', error.message);
        process.exit(1);
    });