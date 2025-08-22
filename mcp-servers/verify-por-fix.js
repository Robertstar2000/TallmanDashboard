// Verify POR MCP Fix
const { spawn } = require('child_process');

console.log('=== Verifying POR MCP Fix ===');

async function verifyFix() {
    return new Promise((resolve, reject) => {
        console.log('Starting POR MCP server...');
        
        const server = spawn('node', ['por-server.js'], {
            stdio: ['pipe', 'pipe', 'inherit'],
            env: { 
                ...process.env, 
                POR_DB_PATH: '\\\\ts03\\POR\\POR.MDB'
            }
        });

        let timeout = setTimeout(() => {
            console.log('❌ Test timeout');
            server.kill();
            reject(new Error('Timeout'));
        }, 10000);

        let buffer = '';
        server.stdout.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop();
            
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const response = JSON.parse(line);
                        
                        if (response.id === 1) {
                            console.log('✓ MCP Server initialized');
                            
                            // Send the same query the application uses
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
                            
                            console.log('Sending test query: SELECT 42 as value');
                            server.stdin.write(JSON.stringify(testRequest) + '\n');
                        }
                        
                        if (response.id === 2) {
                            clearTimeout(timeout);
                            
                            if (response.result && response.result.content) {
                                const result = JSON.parse(response.result.content[0].text);
                                if (result.success && result.data && result.data.length > 0) {
                                    console.log('✅ SUCCESS: POR test passes!');
                                    console.log('✅ Query result:', result.data[0]);
                                    console.log('✅ The application POR test should now work');
                                    resolve(true);
                                } else {
                                    console.log('❌ Query failed:', result);
                                    reject(new Error('Query failed'));
                                }
                            } else if (response.error) {
                                console.log('❌ MCP error:', response.error);
                                reject(new Error(response.error.message));
                            }
                            
                            server.kill();
                        }
                    } catch (e) {
                        // Ignore non-JSON
                    }
                }
            }
        });

        // Initialize
        const initRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'verify-test', version: '1.0.0' }
            }
        };

        server.stdin.write(JSON.stringify(initRequest) + '\n');
    });
}

verifyFix()
    .then(() => {
        console.log('\n🎉 POR MCP fix verified successfully!');
        console.log('📋 The application should now show POR test as passing.');
        process.exit(0);
    })
    .catch(error => {
        console.log('\n💥 POR MCP fix verification failed:', error.message);
        process.exit(1);
    });