// Debug MCP timeout issues and server spawning
const { spawn } = require('child_process');
const path = require('path');

console.log('=== DEBUGGING MCP TIMEOUT ISSUES ===\n');

// Test MCP server spawning manually
async function testMCPServerSpawn() {
    console.log('1. Testing MCP server spawn and initialization...\n');
    
    const serverPath = path.join(__dirname, 'P21-MCP-Server-Package', 'build', 'index.js');
    console.log(`Spawning: node ${serverPath}`);
    
    const mcpProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
            ...process.env, 
            P21_DSN: 'P21Live',
            P21_TRUSTED_CONNECTION: 'true'
        }
    });
    
    let hasOutput = false;
    let initComplete = false;
    
    console.log('Waiting for MCP server initialization...');
    
    mcpProcess.stdout.on('data', (data) => {
        hasOutput = true;
        const output = data.toString();
        console.log('📤 MCP stdout:', output.trim());
        
        // Check for initialization completion
        if (output.includes('Server initialized') || output.includes('ready')) {
            initComplete = true;
            console.log('✅ MCP server initialized successfully');
        }
    });
    
    mcpProcess.stderr.on('data', (data) => {
        hasOutput = true;
        const error = data.toString();
        console.log('❌ MCP stderr:', error.trim());
    });
    
    mcpProcess.on('error', (error) => {
        console.log('💥 MCP spawn error:', error.message);
    });
    
    mcpProcess.on('exit', (code, signal) => {
        console.log(`🔚 MCP process exited: code=${code}, signal=${signal}`);
    });
    
    // Wait for initialization or timeout
    setTimeout(() => {
        if (!hasOutput) {
            console.log('⚠️  No output from MCP server after 5 seconds');
            console.log('This suggests the MCP server is not starting properly');
        }
        
        if (!initComplete) {
            console.log('⚠️  MCP server did not complete initialization');
        }
        
        // Send test initialization message
        console.log('\n2. Sending initialization message...');
        const initMessage = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: {
                    name: "test-client",
                    version: "1.0.0"
                }
            }
        };
        
        mcpProcess.stdin.write(JSON.stringify(initMessage) + '\n');
        
        // Send test query after a delay
        setTimeout(() => {
            console.log('\n3. Sending test query...');
            const queryMessage = {
                jsonrpc: "2.0",
                id: 2,
                method: "tools/call",
                params: {
                    name: "execute_query",
                    arguments: {
                        query: "SELECT 1 as test"
                    }
                }
            };
            
            mcpProcess.stdin.write(JSON.stringify(queryMessage) + '\n');
        }, 2000);
        
        // Kill process after test
        setTimeout(() => {
            console.log('\n4. Terminating test process...');
            mcpProcess.kill();
        }, 8000);
        
    }, 5000);
}

testMCPServerSpawn();
