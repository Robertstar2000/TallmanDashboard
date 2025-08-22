import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple RPC client for MCP communication
class StdioRpcClient {
    constructor(childProc) {
        this.process = childProc;
        this.nextId = 1;
        this.pending = new Map(); // id -> { resolve, reject, timeout }
        this.buffer = Buffer.alloc(0);

        this.onData = this.onData.bind(this);
        this.process.stdout.on('data', this.onData);

        this.process.on('exit', (code, signal) => {
            const err = new Error(`RPC process exited: code=${code}, signal=${signal}`);
            for (const [id, p] of this.pending.entries()) {
                clearTimeout(p.timeout);
                p.reject(err);
            }
            this.pending.clear();
        });
    }

    onData(chunk) {
        this.buffer = Buffer.concat([this.buffer, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);

        // Parse one or more frames: headers (CRLF) + body of length Content-Length
        while (true) {
            // Support both CRLFCRLF and LFLF separators
            let sepIndex = this.buffer.indexOf('\r\n\r\n');
            let sepLen = 4;
            if (sepIndex === -1) {
                sepIndex = this.buffer.indexOf('\n\n');
                sepLen = sepIndex === -1 ? -1 : 2;
            }
            if (sepIndex === -1) break;

            const headerStr = this.buffer.slice(0, sepIndex).toString('utf8');
            const headerLines = headerStr.split(/\r?\n/);
            let contentLength = 0;
            for (const line of headerLines) {
                const m = /^Content-Length:\s*(\d+)$/i.exec(line.trim());
                if (m) {
                    contentLength = parseInt(m[1], 10);
                    break;
                }
            }
            const frameTotal = sepIndex + sepLen + contentLength;
            if (this.buffer.length < frameTotal) {
                // Wait for more data
                break;
            }

            const jsonPayload = this.buffer.slice(sepIndex + sepLen, frameTotal).toString('utf8');
            // Advance buffer
            this.buffer = this.buffer.slice(frameTotal);

            let message;
            try {
                message = JSON.parse(jsonPayload);
            } catch (e) {
                // Invalid JSON payload; continue parsing next frames
                continue;
            }

            // Only resolve/reject when this is a response with an id
            if (message && Object.prototype.hasOwnProperty.call(message, 'id')) {
                const pending = this.pending.get(message.id);
                if (pending) {
                    this.pending.delete(message.id);
                    clearTimeout(pending.timeout);
                    if (message.error) {
                        pending.reject(new Error(message.error.message || 'Unknown RPC error'));
                    } else {
                        pending.resolve(message);
                    }
                }
            }
        }
    }

    send(method, params) {
        const id = this.nextId++;
        const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params });
        // Standard MCP framing: Content-Length header with CRLF separators, no Content-Type
        const header = `Content-Length: ${Buffer.byteLength(payload, 'utf8')}\r\n\r\n`;
        this.process.stdin.write(header + payload);
        return id;
    }

    request(method, params, timeoutMs = 30000) {
        return new Promise((resolve, reject) => {
            const id = this.send(method, params);
            const timeout = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`RPC timeout for method ${method}`));
            }, timeoutMs);
            this.pending.set(id, { resolve, reject, timeout });
        });
    }
}

// Simple MCP controller without external SDK dependencies
class MCPController {
    constructor() {
        this.requestId = 1;
        this.simulateMode = false; // Real data only from external servers
        
        // MCP server paths - use built packages
        this.serverPaths = {
            'P21': path.join(__dirname, '..', 'P21-MCP-Server-Package', 'build', 'index.js'),
            'POR': path.join(__dirname, '..', 'POR-MCP-Server-Package', 'build', 'index.js')
        };
        
        // Active connections cache
        this.connections = new Map();
    }

    async getOrCreateConnection(serverName) {
        if (this.connections.has(serverName)) {
            return this.connections.get(serverName);
        }

        const serverPath = this.serverPaths[serverName];
        if (!serverPath) {
            throw new Error(`No MCP server path configured for ${serverName}`);
        }

        // Load environment variables
        const packageDir = path.dirname(path.dirname(serverPath));
        let packageEnv = {};
        
        try {
            const fs = await import('fs');
            const envPath = path.join(packageDir, '.env');
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

        // Allow root env vars to override package .env values
        if (process.env.P21_DSN) {
            packageEnv.P21_DSN = process.env.P21_DSN;
        }
        if (process.env.POR_FILE_PATH) {
            packageEnv.POR_FILE_PATH = process.env.POR_FILE_PATH;
        }

        // Log effective configuration for visibility
        if (serverName === 'P21') {
            console.log(`[MCP ${serverName}] Effective P21_DSN=${packageEnv.P21_DSN || '(unset)'}`);
        }
        if (serverName === 'POR') {
            console.log(`[MCP ${serverName}] Effective POR_FILE_PATH=${packageEnv.POR_FILE_PATH || '(unset)'}`);
        }
        console.log(`🚀 Spawning MCP server for ${serverName} at ${serverPath}`);
        
        // Spawn the MCP server process using the exact Node executable path (Windows-safe)
        const childProcess = spawn(process.execPath, [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, ...packageEnv },
            cwd: packageDir
        });

        // Add error handling
        childProcess.on('error', (error) => {
            console.error(`❌ MCP server ${serverName} process error:`, error.message);
            this.connections.delete(serverName);
        });

        childProcess.on('exit', (code, signal) => {
            console.log(`🔚 MCP server ${serverName} exited: code=${code}, signal=${signal}`);
            this.connections.delete(serverName);
        });

        // Surface server stderr for diagnostics
        childProcess.stderr.on('data', (data) => {
            const msg = data?.toString?.() || String(data);
            if (msg && msg.trim()) {
                console.error(`[${serverName} STDERR] ${msg.trim()}`);
            }
        });

        // Initialize the connection with proper MCP handshake
        const rpc = new StdioRpcClient(childProcess);
        const connection = {
            process: childProcess,
            rpc,
            initialized: false,
            ready: false
        };

        // Perform MCP initialization
        await this.initializeConnection(connection, serverName);
        
        this.connections.set(serverName, connection);
        return connection;
    }

    async initializeConnection(connection, serverName) {
        try {
            const params = {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                clientInfo: { name: 'tallman-dashboard', version: '1.0.0' }
            };
            await connection.rpc.request('initialize', params, 20000);
            connection.initialized = true;
            connection.ready = true;
            console.log(`✅ MCP server ${serverName} initialized successfully`);
            return connection;
        } catch (err) {
            throw new Error(`MCP initialization failed for ${serverName}: ${err?.message || err}`);
        }
    }

    async executeQuery(serverName, query) {
        try {
            console.log(`🔍 Executing MCP query on ${serverName}: ${query.substring(0, 100)}...`);
            const connection = await this.getOrCreateConnection(serverName);
            const response = await connection.rpc.request('tools/call', {
                name: 'execute_query',
                arguments: { query }
            }, 120000);

            const content = response?.result?.content?.[0]?.text;
            if (!content) {
                console.error(`❌ No content in MCP response for ${serverName}`);
                return [];
            }
            
            const data = JSON.parse(content);
            console.log(`✅ MCP query result for ${serverName}:`, Array.isArray(data) ? `${data.length} rows` : typeof data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`❌ MCP query failed for ${serverName}:`, error?.message || error);
            return [];
        }
    }

    // Separate method for extracting single numeric values (for dashboard metrics)
    async executeQueryValue(serverName, query) {
        try {
            console.log(`🔍 Executing MCP value query on ${serverName}: ${query.substring(0, 100)}...`);
            const data = await this.executeQuery(serverName, query);
            
            if (Array.isArray(data) && data.length > 0) {
                const firstRow = data[0];
                const valueField = firstRow.value || firstRow.VALUE || firstRow.count || firstRow.COUNT;
                if (typeof valueField === 'number') {
                    console.log(`✅ Extracted numeric value from ${serverName}:`, valueField);
                    return valueField;
                }
                console.log(`⚠️ Non-numeric result from ${serverName} - treating as failure (99999):`, firstRow);
                return 99999;
            }
            console.log(`⚠️ Empty result from ${serverName} - treating as failure (99999)`);
            return 99999;
        } catch (error) {
            console.error(`❌ MCP value query failed for ${serverName}:`, error?.message || error);
            return 99999;
        }
    }

    async executeQueryRows(serverName, query) {
        try {
            console.log(`🔍 Executing MCP row query on ${serverName}: ${query.substring(0, 100)}...`);
            const connection = await this.getOrCreateConnection(serverName);
            const response = await connection.rpc.request('tools/call', {
                name: 'execute_query',
                arguments: { query }
            }, 120000);
            const content = response?.result?.content?.[0]?.text;
            if (!content) {
                console.warn(`⚠️ No content in row query MCP response for ${serverName}`);
                return [];
            }
            const data = JSON.parse(content);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`❌ MCP row query failed for ${serverName}:`, error?.message || error);
            return [];
        }
    }

    async executeListTables(serverName) {
        try {
            console.log(`🔍 Executing list_tables tool on ${serverName}...`);
            const connection = await this.getOrCreateConnection(serverName);
            const response = await connection.rpc.request('tools/call', { 
                name: 'list_tables',
                arguments: {}
            }, 120000);
            
            console.log(`[${serverName}] Raw MCP response:`, JSON.stringify(response, null, 2));
            
            const content = response?.result?.content?.[0]?.text;
            if (!content) {
                console.warn(`⚠️ No content in list_tables MCP response for ${serverName}`);
                console.warn(`Full response structure:`, JSON.stringify(response, null, 2));
                return [];
            }
            
            try {
                const data = JSON.parse(content);
                if (Array.isArray(data)) {
                    if (data.length === 0) {
                        console.warn(`⚠️ ${serverName} list_tables returned an empty array. Raw content: ${content}`);
                    } else {
                        console.log(`✅ ${serverName} list_tables returned ${data.length} tables. Sample: ${JSON.stringify(data.slice(0, 5))}`);
                    }
                    return data;
                }
                console.warn(`⚠️ ${serverName} list_tables returned non-array JSON. Type=${typeof data}. Raw: ${content.slice(0, 200)}`);
                return [];
            } catch (parseErr) {
                console.error(`❌ Failed to parse list_tables JSON for ${serverName}: ${parseErr?.message || parseErr}. Raw: ${content.slice(0, 200)}`);
                return [];
            }
        } catch (error) {
            console.error(`❌ MCP list_tables failed for ${serverName}:`, error?.message || error);
            return [];
        }
    }

    // Clean up connections
    async cleanup() {
        for (const [serverName, connection] of this.connections) {
            if (connection.process && !connection.process.killed) {
                connection.process.kill();
            }
        }
        this.connections.clear();
    }
}

export default MCPController;
