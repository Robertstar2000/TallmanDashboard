// Direct MCP test to show actual table lists from P21 and POR databases
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DirectMCPTest {
    async testP21Tables() {
        console.log('🔍 P21 MCP Server - Direct Table List Test');
        console.log('==========================================');
        
        return new Promise((resolve) => {
            const serverPath = path.join(__dirname, 'P21-MCP-Server-Package', 'build', 'index.js');
            const serverDir = path.join(__dirname, 'P21-MCP-Server-Package');
            
            console.log(`Starting P21 MCP server: ${serverPath}`);
            
            const mcpProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: serverDir
            });

            let responseBuffer = '';
            let initialized = false;

            mcpProcess.stdout.on('data', (data) => {
                responseBuffer += data.toString();
                
                // Look for complete JSON-RPC messages
                const lines = responseBuffer.split('\n');
                for (const line of lines) {
                    if (line.trim().startsWith('{')) {
                        try {
                            const message = JSON.parse(line.trim());
                            console.log('📨 P21 Response:', JSON.stringify(message, null, 2));
                            
                            if (message.method === 'notifications/initialized') {
                                initialized = true;
                                this.requestTableList(mcpProcess, 'P21');
                            }
                            
                            if (message.result && Array.isArray(message.result)) {
                                console.log('✅ P21 TABLES FOUND:');
                                message.result.forEach((table, index) => {
                                    console.log(`   ${index + 1}. ${table}`);
                                });
                                mcpProcess.kill();
                                resolve();
                            }
                        } catch (e) {
                            // Not JSON, continue
                        }
                    }
                }
            });

            mcpProcess.stderr.on('data', (data) => {
                console.log('🔍 P21 Log:', data.toString().trim());
            });

            mcpProcess.on('exit', () => {
                if (!initialized) {
                    console.log('❌ P21 server failed to initialize');
                }
                resolve();
            });

            // Initialize the MCP server
            setTimeout(() => {
                this.sendInitialize(mcpProcess);
            }, 2000);

            // Timeout after 30 seconds
            setTimeout(() => {
                console.log('⏰ P21 test timeout');
                mcpProcess.kill();
                resolve();
            }, 30000);
        });
    }

    async testPORTables() {
        console.log('\n🔍 POR MCP Server - Direct Table List Test');
        console.log('==========================================');
        
        return new Promise((resolve) => {
            const serverPath = path.join(__dirname, 'POR-MCP-Server-Package', 'build', 'index.js');
            const serverDir = path.join(__dirname, 'POR-MCP-Server-Package');
            
            console.log(`Starting POR MCP server: ${serverPath}`);
            
            const mcpProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: serverDir
            });

            let responseBuffer = '';
            let initialized = false;

            mcpProcess.stdout.on('data', (data) => {
                responseBuffer += data.toString();
                
                // Look for complete JSON-RPC messages
                const lines = responseBuffer.split('\n');
                for (const line of lines) {
                    if (line.trim().startsWith('{')) {
                        try {
                            const message = JSON.parse(line.trim());
                            console.log('📨 POR Response:', JSON.stringify(message, null, 2));
                            
                            if (message.method === 'notifications/initialized') {
                                initialized = true;
                                this.requestTableList(mcpProcess, 'POR');
                            }
                            
                            if (message.result && Array.isArray(message.result)) {
                                console.log('✅ POR TABLES FOUND:');
                                message.result.forEach((table, index) => {
                                    console.log(`   ${index + 1}. ${table}`);
                                });
                                mcpProcess.kill();
                                resolve();
                            }
                        } catch (e) {
                            // Not JSON, continue
                        }
                    }
                }
            });

            mcpProcess.stderr.on('data', (data) => {
                console.log('🔍 POR Log:', data.toString().trim());
            });

            mcpProcess.on('exit', () => {
                if (!initialized) {
                    console.log('❌ POR server failed to initialize');
                }
                resolve();
            });

            // Initialize the MCP server
            setTimeout(() => {
                this.sendInitialize(mcpProcess);
            }, 2000);

            // Timeout after 30 seconds
            setTimeout(() => {
                console.log('⏰ POR test timeout');
                mcpProcess.kill();
                resolve();
            }, 30000);
        });
    }

    sendInitialize(process) {
        const message = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'direct-test-client',
                    version: '1.0.0'
                }
            }
        };
        this.sendMessage(process, message);
    }

    requestTableList(process, serverType) {
        const message = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'list_tables',
                arguments: {}
            }
        };
        console.log(`📤 Requesting ${serverType} table list...`);
        this.sendMessage(process, message);
    }

    sendMessage(process, message) {
        const body = JSON.stringify(message);
        const header = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`;
        process.stdin.write(header + body);
    }
}

// Run the direct MCP tests
async function runDirectTests() {
    console.log('🚀 Direct MCP Table List Retrieval Test');
    console.log('=======================================\n');
    
    const tester = new DirectMCPTest();
    
    // Test P21 first
    await tester.testP21Tables();
    
    // Test POR second
    await tester.testPORTables();
    
    console.log('\n🏁 Direct MCP testing complete!');
    console.log('This shows the actual tables your MCP servers can retrieve from external databases.');
}

runDirectTests().catch(console.error);
