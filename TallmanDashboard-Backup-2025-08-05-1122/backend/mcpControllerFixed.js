import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPController {
    constructor() {
        this.requestId = 1;
        this.simulateMode = false; // Real data only from external servers
        
        // MCP server paths
        this.serverPaths = {
            'P21': path.join(__dirname, '..', 'P21-MCP-Server-Package', 'build', 'index.js'),
            'POR': path.join(__dirname, '..', 'POR-MCP-Server-Package', 'build', 'index.js')
        };
    }

    async executeQuery(serverName, query) {
        try {
            console.log(`🔍 Executing MCP query on ${serverName}: ${query.substring(0, 100)}...`);
            
            // Create a fresh MCP connection for each query (MCP servers are stateless)
            const connection = await this.createSingleUseConnection(serverName);
            
            return new Promise((resolve, reject) => {
                const requestId = this.requestId++;
                let responseReceived = false;
                
                const timeout = setTimeout(() => {
                    if (!responseReceived) {
                        console.error(`❌ MCP query timeout for ${serverName} after 30 seconds`);
                        connection.kill();
                        reject(new Error(`MCP query timeout for ${serverName} after 30 seconds`));
                    }
                }, 30000);

                let buffer = '';

                // Handle stdout data
                connection.stdout.on('data', (data) => {
                    const output = data.toString();
                    buffer += output;
                    
                    // Process complete JSON messages
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                const response = JSON.parse(line);
                                
                                if (response.id === requestId && !responseReceived) {
                                    responseReceived = true;
                                    clearTimeout(timeout);
                                    connection.kill();
                                    
                                    if (response.error) {
                                        console.error(`❌ MCP error for ${serverName}:`, response.error.message);
                                        reject(new Error(response.error.message || 'MCP Error'));
                                    } else {
                                        console.log(`✅ MCP query successful for ${serverName}`);
                                        try {
                                            console.log(`📋 Full MCP response structure for ${serverName}:`, JSON.stringify(response.result, null, 2));
                                            
                                            const content = response.result?.content?.[0]?.text;
                                            if (content) {
                                                console.log(`📋 MCP content for ${serverName}:`, content);
                                                const data = JSON.parse(content);
                                                console.log(`📋 Parsed data for ${serverName}:`, data);
                                                
                                                // Extract numeric value from result
                                                let value;
                                                if (Array.isArray(data) && data.length > 0) {
                                                    const firstRow = data[0];
                                                    value = Object.values(firstRow)[0];
                                                } else if (typeof data === 'object' && data !== null) {
                                                    value = Object.values(data)[0];
                                                } else {
                                                    value = data;
                                                }
                                                
                                                const numericValue = Number(value) || 0;
                                                console.log(`📊 Extracted value: ${numericValue}`);
                                                resolve(numericValue);
                                            } else {
                                                console.error(`❌ No content in MCP response for ${serverName}`);
                                                console.log(`📋 Available result keys:`, Object.keys(response.result || {}));
                                                
                                                // Check if there's a different response structure
                                                if (response.result) {
                                                    console.log(`📋 Trying alternative response structure...`);
                                                    const altValue = response.result.value || response.result.data || 1;
                                                    resolve(Number(altValue) || 1);
                                                } else {
                                                    reject(new Error(`No content in MCP response for ${serverName}`));
                                                }
                                            }
                                        } catch (parseError) {
                                            console.error(`❌ Error parsing MCP result for ${serverName}:`, parseError);
                                            console.log(`📋 Raw response for debugging:`, response);
                                            reject(new Error(`Failed to parse MCP response: ${parseError.message}`));
                                        }
                                    }
                                }
                            } catch (jsonError) {
                                // Ignore non-JSON lines (like initialization messages)
                                console.log(`📝 MCP ${serverName} log:`, line.trim());
                            }
                        }
                    }
                });

                // Handle stderr
                connection.stderr.on('data', (data) => {
                    const error = data.toString();
                    console.log(`📝 MCP ${serverName} stderr:`, error.trim());
                });

                // Handle process exit
                connection.on('exit', (code) => {
                    if (!responseReceived) {
                        clearTimeout(timeout);
                        reject(new Error(`MCP ${serverName} process exited with code ${code} before response`));
                    }
                });

                // Handle process error
                connection.on('error', (error) => {
                    if (!responseReceived) {
                        clearTimeout(timeout);
                        console.error(`💥 MCP ${serverName} process error:`, error);
                        reject(new Error(`MCP ${serverName} process error: ${error.message}`));
                    }
                });

                // Initialize connection and send query
                this.initializeAndQuery(connection, requestId, query)
                    .catch(error => {
                        if (!responseReceived) {
                            clearTimeout(timeout);
                            reject(error);
                        }
                    });
            });

        } catch (error) {
            console.error(`❌ CRITICAL MCP ERROR for ${serverName}:`, error.message);
            throw new Error(`MCP execution failed for ${serverName}: ${error.message}`);
        }
    }

    async createSingleUseConnection(serverName) {
        const serverPath = this.serverPaths[serverName];
        if (!serverPath) {
            throw new Error(`No MCP server path configured for ${serverName}`);
        }

        // Load environment variables from the package directory
        const packageDir = path.dirname(path.dirname(serverPath));
        const envPath = path.join(packageDir, '.env');
        
        let packageEnv = {};
        try {
            const fs = await import('fs');
            const envContent = fs.readFileSync(envPath, 'utf8');
            const envLines = envContent.split('\n');
            for (const line of envLines) {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    const [key, ...valueParts] = trimmedLine.split('=');
                    if (key && valueParts.length > 0) {
                        packageEnv[key.trim()] = valueParts.join('=').trim();
                    }
                }
            }
        } catch (envError) {
            console.warn(`Could not load .env file for ${serverName}:`, envError.message);
        }

        // Special handling for POR server
        if (serverName === 'POR' && !packageEnv.POR_FILE_PATH) {
            packageEnv.POR_FILE_PATH = 'C:\\TallmanDashboard\\POR.mdb';
        }

        // Spawn the MCP server process
        const childProcess = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, ...packageEnv },
            cwd: packageDir
        });

        return childProcess;
    }

    async initializeAndQuery(connection, requestId, query) {
        return new Promise((resolve, reject) => {
            let initComplete = false;
            
            // Handle initialization response
            const originalStdoutHandler = connection.stdout.listeners('data')[0];
            
            // Temporary handler for initialization
            const initHandler = (data) => {
                const output = data.toString();
                const lines = output.split('\n');
                
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const response = JSON.parse(line);
                            if (response.id === 1 && !initComplete) {
                                initComplete = true;
                                console.log(`🔧 MCP ${connection.serverName || 'server'} initialized successfully`);
                                
                                // Remove init handler and restore original
                                connection.stdout.removeListener('data', initHandler);
                                
                                // Send query request now that init is complete
                                const queryRequest = {
                                    jsonrpc: '2.0',
                                    id: requestId,
                                    method: 'tools/call',
                                    params: {
                                        name: 'execute_query',
                                        arguments: { query }
                                    }
                                };
                                
                                connection.stdin.write(JSON.stringify(queryRequest) + '\n');
                                resolve();
                                return;
                            }
                        } catch (error) {
                            // Ignore non-JSON lines
                        }
                    }
                }
            };
            
            // Set up initialization handler
            connection.stdout.on('data', initHandler);
            
            // Send initialization request
            const initRequest = {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    clientInfo: { name: 'tallman-dashboard', version: '1.0.0' }
                }
            };

            connection.stdin.write(JSON.stringify(initRequest) + '\n');
            
            // Timeout for initialization
            setTimeout(() => {
                if (!initComplete) {
                    connection.stdout.removeListener('data', initHandler);
                    reject(new Error('MCP initialization timeout'));
                }
            }, 5000);
        });
    }

    async executeListTables(serverName) {
        try {
            console.log(`🔍 Executing list_tables tool on ${serverName}...`);
            
            // Create a fresh MCP connection for each query
            const connection = await this.createSingleUseConnection(serverName);
            
            return new Promise((resolve, reject) => {
                const requestId = this.requestId++;
                let responseReceived = false;
                
                const timeout = setTimeout(() => {
                    if (!responseReceived) {
                        console.error(`❌ MCP list_tables timeout for ${serverName} after 30 seconds`);
                        connection.kill();
                        reject(new Error(`MCP list_tables timeout for ${serverName} after 30 seconds`));
                    }
                }, 30000);

                let buffer = '';

                // Handle stdout data
                connection.stdout.on('data', (data) => {
                    const output = data.toString();
                    buffer += output;
                    
                    // Process complete JSON messages
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                const response = JSON.parse(line);
                                
                                if (response.id === requestId && !responseReceived) {
                                    responseReceived = true;
                                    clearTimeout(timeout);
                                    connection.kill();
                                    
                                    if (response.error) {
                                        console.error(`❌ MCP error for ${serverName}:`, response.error.message);
                                        reject(new Error(response.error.message || 'MCP Error'));
                                    } else {
                                        console.log(`✅ MCP list_tables successful for ${serverName}`);
                                        try {
                                            const content = response.result?.content?.[0]?.text;
                                            if (content) {
                                                const data = JSON.parse(content);
                                                console.log(`📋 Tables from ${serverName}:`, data);
                                                resolve(data);
                                            } else {
                                                console.error(`❌ No content in MCP response for ${serverName}`);
                                                reject(new Error(`No content in MCP response for ${serverName}`));
                                            }
                                        } catch (parseError) {
                                            console.error(`❌ Error parsing MCP result for ${serverName}:`, parseError);
                                            reject(new Error(`Failed to parse MCP response: ${parseError.message}`));
                                        }
                                    }
                                }
                            } catch (jsonError) {
                                // Ignore non-JSON lines (like initialization messages)
                                console.log(`📝 MCP ${serverName} log:`, line.trim());
                            }
                        }
                    }
                });

                // Handle stderr
                connection.stderr.on('data', (data) => {
                    const error = data.toString();
                    console.log(`📝 MCP ${serverName} stderr:`, error.trim());
                });

                // Handle process exit
                connection.on('exit', (code) => {
                    if (!responseReceived) {
                        clearTimeout(timeout);
                        reject(new Error(`MCP ${serverName} process exited with code ${code} before response`));
                    }
                });

                // Handle process error
                connection.on('error', (error) => {
                    if (!responseReceived) {
                        clearTimeout(timeout);
                        console.error(`💥 MCP ${serverName} process error:`, error);
                        reject(new Error(`MCP ${serverName} process error: ${error.message}`));
                    }
                });

                // Initialize connection and send list_tables request
                this.initializeAndListTables(connection, requestId)
                    .catch(error => {
                        if (!responseReceived) {
                            clearTimeout(timeout);
                            reject(error);
                        }
                    });
            });

        } catch (error) {
            console.error(`❌ CRITICAL MCP ERROR for ${serverName}:`, error.message);
            throw new Error(`MCP list_tables failed for ${serverName}: ${error.message}`);
        }
    }

    async initializeAndListTables(connection, requestId) {
        return new Promise((resolve, reject) => {
            let initComplete = false;
            
            // Temporary handler for initialization
            const initHandler = (data) => {
                const output = data.toString();
                const lines = output.split('\n');
                
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const response = JSON.parse(line);
                            if (response.id === 1 && !initComplete) {
                                initComplete = true;
                                console.log(`🔧 MCP ${connection.serverName || 'server'} initialized for list_tables`);
                                
                                // Remove init handler
                                connection.stdout.removeListener('data', initHandler);
                                
                                // Send list_tables request
                                const listTablesRequest = {
                                    jsonrpc: '2.0',
                                    id: requestId,
                                    method: 'tools/call',
                                    params: {
                                        name: 'list_tables',
                                        arguments: {}
                                    }
                                };
                                
                                connection.stdin.write(JSON.stringify(listTablesRequest) + '\n');
                                resolve();
                                return;
                            }
                        } catch (error) {
                            // Ignore non-JSON lines
                        }
                    }
                }
            };
            
            // Set up initialization handler
            connection.stdout.on('data', initHandler);
            
            // Send initialization request
            const initRequest = {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    clientInfo: { name: 'tallman-dashboard', version: '1.0.0' }
                }
            };

            connection.stdin.write(JSON.stringify(initRequest) + '\n');
            
            // Timeout for initialization
            setTimeout(() => {
                if (!initComplete) {
                    connection.stdout.removeListener('data', initHandler);
                    reject(new Error('MCP initialization timeout'));
                }
            }, 5000);
        });
    }

    async testConnection(serverName) {
        try {
            console.log(`Testing MCP connection for ${serverName}...`);
            const result = await this.executeListTables(serverName);
            return result !== null && result !== undefined;
        } catch (error) {
            console.error(`MCP connection test failed for ${serverName}:`, error.message);
            return false;
        }
    }

    closeAllConnections() {
        // No persistent connections to close in this implementation
        console.log('No persistent MCP connections to close');
    }
}

export default MCPController;
