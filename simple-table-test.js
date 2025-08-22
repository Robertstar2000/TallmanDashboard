const { spawn } = require('child_process');
const path = require('path');

console.log('=== MCP Table List Test ===\n');

// Test P21 MCP Server
console.log('Testing P21 MCP Server...');
const p21ServerPath = path.join(__dirname, 'P21-MCP-Server-Package', 'build', 'index.js');

const p21Process = spawn('node', [p21ServerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.join(__dirname, 'P21-MCP-Server-Package')
});

let p21Output = '';
let p21Error = '';

p21Process.stdout.on('data', (data) => {
    p21Output += data.toString();
});

p21Process.stderr.on('data', (data) => {
    p21Error += data.toString();
});

// Send initialize request
setTimeout(() => {
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
    
    p21Process.stdin.write(JSON.stringify(initRequest) + '\n');
    
    // Send list tables request
    setTimeout(() => {
        const listRequest = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
                name: "get_p21_tables",
                arguments: {}
            }
        };
        
        p21Process.stdin.write(JSON.stringify(listRequest) + '\n');
        
        // Close after getting response
        setTimeout(() => {
            p21Process.kill();
            
            console.log('\n--- P21 Results ---');
            if (p21Output) {
                console.log('Output:', p21Output);
            }
            if (p21Error) {
                console.log('Error:', p21Error);
            }
            
            // Now test POR
            testPOR();
        }, 3000);
    }, 1000);
}, 1000);

function testPOR() {
    console.log('\nTesting POR MCP Server...');
    const porServerPath = path.join(__dirname, 'POR-MCP-Server-Package', 'build', 'index.js');
    
    const porProcess = spawn('node', [porServerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, 'POR-MCP-Server-Package')
    });
    
    let porOutput = '';
    let porError = '';
    
    porProcess.stdout.on('data', (data) => {
        porOutput += data.toString();
    });
    
    porProcess.stderr.on('data', (data) => {
        porError += data.toString();
    });
    
    // Send initialize request
    setTimeout(() => {
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
            const listRequest = {
                jsonrpc: "2.0",
                id: 2,
                method: "tools/call",
                params: {
                    name: "get_por_tables",
                    arguments: {}
                }
            };
            
            porProcess.stdin.write(JSON.stringify(listRequest) + '\n');
            
            // Close after getting response
            setTimeout(() => {
                porProcess.kill();
                
                console.log('\n--- POR Results ---');
                if (porOutput) {
                    console.log('Output:', porOutput);
                }
                if (porError) {
                    console.log('Error:', porError);
                }
                
                console.log('\n=== Test Complete ===');
            }, 3000);
        }, 1000);
    }, 1000);
}
