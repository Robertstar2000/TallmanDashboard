// Manual MCP Server Test - Direct table list retrieval
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple MCP client to test table retrieval
class MCPTestClient {
    constructor() {
        this.nextId = 1;
        this.pending = new Map();
    }

    async testP21Tables() {
        console.log('🧪 Testing P21 MCP Server - Table List Retrieval');
        console.log('=================================================');
        
        try {
            const p21ServerPath = path.join(__dirname, 'P21-MCP-Server-Package', 'build', 'index.js');
            console.log(`Starting P21 MCP server: ${p21ServerPath}`);
            
            const process = spawn('node', [p21ServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.join(__dirname, 'P21-MCP-Server-Package')
            });

            let buffer = Buffer.alloc(0);
            let initialized = false;

            process.stdout.on('data', (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);
                
                while (true) {
                    const sepIndex = buffer.indexOf('\r\n\r\n');
                    if (sepIndex === -1) break;

                    const headerStr = buffer.slice(0, sepIndex).toString('utf8');
                    const contentLengthMatch = headerStr.match(/Content-Length:\s*(\d+)/i);
                    
                    if (!contentLengthMatch) break;
                    
                    const contentLength = parseInt(contentLengthMatch[1]);
                    const totalLength = sepIndex + 4 + contentLength;
                    
                    if (buffer.length < totalLength) break;

                    const bodyStr = buffer.slice(sepIndex + 4, totalLength).toString('utf8');
                    buffer = buffer.slice(totalLength);

                    try {
                        const message = JSON.parse(bodyStr);
                        console.log('📨 Received:', JSON.stringify(message, null, 2));
                        
                        if (message.method === 'notifications/initialized') {
                            initialized = true;
                            this.sendListTablesRequest(process);
                        }
                    } catch (e) {
                        console.error('❌ Parse error:', e.message);
                    }
                }
            });

            process.stderr.on('data', (data) => {
                console.log('🔍 P21 Server Log:', data.toString());
            });

            // Send initialize request
            setTimeout(() => {
                this.sendInitialize(process);
            }, 1000);

            // Timeout after 30 seconds
            setTimeout(() => {
                console.log('⏰ Test timeout - stopping P21 server');
                process.kill();
            }, 30000);

        } catch (error) {
            console.error('❌ P21 test failed:', error.message);
        }
    }

    async testPORTables() {
        console.log('\n🧪 Testing POR MCP Server - Table List Retrieval');
        console.log('=================================================');
        
        try {
            const porServerPath = path.join(__dirname, 'POR-MCP-Server-Package', 'build', 'index.js');
            console.log(`Starting POR MCP server: ${porServerPath}`);
            
            const process = spawn('node', [porServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.join(__dirname, 'POR-MCP-Server-Package')
            });

            let buffer = Buffer.alloc(0);
            let initialized = false;

            process.stdout.on('data', (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);
                
                while (true) {
                    const sepIndex = buffer.indexOf('\r\n\r\n');
                    if (sepIndex === -1) break;

                    const headerStr = buffer.slice(0, sepIndex).toString('utf8');
                    const contentLengthMatch = headerStr.match(/Content-Length:\s*(\d+)/i);
                    
                    if (!contentLengthMatch) break;
                    
                    const contentLength = parseInt(contentLengthMatch[1]);
                    const totalLength = sepIndex + 4 + contentLength;
                    
                    if (buffer.length < totalLength) break;

                    const bodyStr = buffer.slice(sepIndex + 4, totalLength).toString('utf8');
                    buffer = buffer.slice(totalLength);

                    try {
                        const message = JSON.parse(bodyStr);
                        console.log('📨 Received:', JSON.stringify(message, null, 2));
                        
                        if (message.method === 'notifications/initialized') {
                            initialized = true;
                            this.sendListTablesRequestPOR(process);
                        }
                    } catch (e) {
                        console.error('❌ Parse error:', e.message);
                    }
                }
            });

            process.stderr.on('data', (data) => {
                console.log('🔍 POR Server Log:', data.toString());
            });

            // Send initialize request
            setTimeout(() => {
                this.sendInitialize(process);
            }, 1000);

            // Timeout after 30 seconds
            setTimeout(() => {
                console.log('⏰ Test timeout - stopping POR server');
                process.kill();
            }, 30000);

        } catch (error) {
            console.error('❌ POR test failed:', error.message);
        }
    }

    sendInitialize(process) {
        const message = {
            jsonrpc: '2.0',
            id: this.nextId++,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'test-client',
                    version: '1.0.0'
                }
            }
        };
        this.sendMessage(process, message);
    }

    sendListTablesRequest(process) {
        const message = {
            jsonrpc: '2.0',
            id: this.nextId++,
            method: 'tools/call',
            params: {
                name: 'list_tables',
                arguments: {}
            }
        };
        console.log('📤 Requesting P21 table list...');
        this.sendMessage(process, message);
    }

    sendListTablesRequestPOR(process) {
        const message = {
            jsonrpc: '2.0',
            id: this.nextId++,
            method: 'tools/call',
            params: {
                name: 'list_tables',
                arguments: {}
            }
        };
        console.log('📤 Requesting POR table list...');
        this.sendMessage(process, message);
    }

    sendMessage(process, message) {
        const body = JSON.stringify(message);
        const header = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`;
        process.stdin.write(header + body);
    }
}

// Run the tests
async function runTests() {
    const client = new MCPTestClient();
    
    console.log('🚀 Starting MCP Manual Table Retrieval Tests');
    console.log('============================================\n');
    
    // Test P21 first
    await client.testP21Tables();
    
    // Wait a bit then test POR
    setTimeout(async () => {
        await client.testPORTables();
    }, 35000);
}

runTests();
