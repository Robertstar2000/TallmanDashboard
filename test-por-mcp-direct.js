const { spawn } = require('child_process');
const path = require('path');

console.log('=== Testing POR MCP Server Direct ===');

// Start POR MCP Server
const porServerPath = path.join(__dirname, 'POR-MCP-Server-Package', 'src', 'index.ts');

console.log('Starting POR MCP Server...');
const porProcess = spawn('node', ['--loader', 'ts-node/esm', porServerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.join(__dirname, 'POR-MCP-Server-Package'),
    env: { ...process.env, POR_FILE_PATH: '\\\\ts03\\POR\\POR.MDB' }
});

let output = '';
let errorOutput = '';

porProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log('STDOUT:', text);
});

porProcess.stderr.on('data', (data) => {
    const text = data.toString();
    errorOutput += text;
    console.log('STDERR:', text);
});

// Send initialize request
setTimeout(() => {
    console.log('Sending initialize request...');
    const initRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" }
        }
    };
    
    porProcess.stdin.write(JSON.stringify(initRequest) + '\n');
    
    // Send list tables request
    setTimeout(() => {
        console.log('Sending list_tables request...');
        const listRequest = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
                name: "list_tables",
                arguments: {}
            }
        };
        
        porProcess.stdin.write(JSON.stringify(listRequest) + '\n');
        
        // Wait for response then close
        setTimeout(() => {
            console.log('\n=== Final Results ===');
            console.log('Output:', output);
            console.log('Error Output:', errorOutput);
            porProcess.kill();
            process.exit(0);
        }, 5000);
    }, 2000);
}, 2000);
