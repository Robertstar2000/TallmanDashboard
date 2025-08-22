const { spawn } = require('child_process');
const path = require('path');

console.log('=== Direct POR MCP Client Test ===');

// Start POR MCP Server process
const porServerPath = path.join(__dirname, 'POR-MCP-Server-Package', 'build', 'index.js');
console.log('Starting POR MCP Server...');

const porProcess = spawn('node', [porServerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.join(__dirname, 'POR-MCP-Server-Package'),
    env: { 
        ...process.env, 
        POR_FILE_PATH: '\\\\ts03\\POR\\POR.MDB'
    }
});

let responses = [];
let requestId = 1;

porProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) {
        try {
            const response = JSON.parse(text);
            responses.push(response);
            console.log('Response received:', JSON.stringify(response, null, 2));
        } catch (e) {
            console.log('Non-JSON output:', text);
        }
    }
});

porProcess.stderr.on('data', (data) => {
    console.log('Server log:', data.toString().trim());
});

porProcess.on('error', (error) => {
    console.error('Process error:', error);
});

// Send requests after server starts
setTimeout(() => {
    console.log('\n1. Sending initialize request...');
    const initRequest = {
        jsonrpc: "2.0",
        id: requestId++,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "direct-por-client", version: "1.0.0" }
        }
    };
    porProcess.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
        console.log('\n2. Sending list_tables request...');
        const listTablesRequest = {
            jsonrpc: "2.0",
            id: requestId++,
            method: "tools/call",
            params: {
                name: "list_tables",
                arguments: {}
            }
        };
        porProcess.stdin.write(JSON.stringify(listTablesRequest) + '\n');

        setTimeout(() => {
            console.log('\n3. Sending get_version request...');
            const versionRequest = {
                jsonrpc: "2.0",
                id: requestId++,
                method: "tools/call",
                params: {
                    name: "get_version",
                    arguments: {}
                }
            };
            porProcess.stdin.write(JSON.stringify(versionRequest) + '\n');

            // Wait for all responses then summarize
            setTimeout(() => {
                console.log('\n=== FINAL RESULTS ===');
                
                // Find the list_tables response
                const tablesResponse = responses.find(r => 
                    r.result && r.result.content && 
                    r.result.content[0] && 
                    r.result.content[0].text && 
                    r.result.content[0].text.includes('[')
                );
                
                if (tablesResponse) {
                    try {
                        const tablesData = JSON.parse(tablesResponse.result.content[0].text);
                        console.log(`✅ SUCCESS: Found ${tablesData.length} POR tables:`);
                        tablesData.forEach((table, index) => {
                            console.log(`  ${index + 1}. ${table}`);
                        });
                    } catch (e) {
                        console.log('Could not parse tables response:', tablesResponse.result.content[0].text);
                    }
                } else {
                    console.log('❌ No tables response found');
                    console.log('All responses:', JSON.stringify(responses, null, 2));
                }
                
                porProcess.kill();
                process.exit(0);
            }, 3000);
        }, 2000);
    }, 2000);
}, 2000);
