import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MCP controller using official SDK
class MCPController {
    constructor() {
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

        // Use root .env values as fallback
        if (!packageEnv.P21_DSN && process.env.P21_DSN) {
            packageEnv.P21_DSN = process.env.P21_DSN;
        }
        if (!packageEnv.POR_FILE_PATH && process.env.POR_FILE_PATH) {
            packageEnv.POR_FILE_PATH = process.env.POR_FILE_PATH;
        }

        console.log(`🚀 Spawning MCP server for ${serverName} at ${serverPath}`);
        
        // Spawn the MCP server process
        const childProcess = spawn('node', [serverPath], {
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

        // Create MCP client using official SDK
        const transport = new StdioClientTransport({
            command: 'node',
            args: [serverPath],
            env: { ...process.env, ...packageEnv },
            cwd: packageDir
        });

        const client = new Client({
            name: 'tallman-dashboard',
            version: '1.0.0'
        }, {
            capabilities: { tools: {} }
        });

        // Connect and initialize
        await client.connect(transport);
        
        const connection = {
            client,
            transport,
            process: childProcess,
            initialized: true,
            ready: true
        };

        console.log(`✅ MCP server ${serverName} initialized successfully`);
        this.connections.set(serverName, connection);
        return connection;
    }

    async executeQuery(serverName, query) {
        try {
            console.log(`🔍 Executing MCP query on ${serverName}: ${query.substring(0, 100)}...`);
            const connection = await this.getOrCreateConnection(serverName);
            
            const response = await connection.client.callTool({
                name: 'execute_query',
                arguments: { query }
            });

            const content = response?.content?.[0]?.text;
            if (!content) {
                console.error(`❌ No content in MCP response for ${serverName}`);
                return 99999;
            }
            
            const data = JSON.parse(content);
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
            console.error(`❌ MCP query failed for ${serverName}:`, error?.message || error);
            return 99999;
        }
    }

    async executeQueryRows(serverName, query) {
        try {
            console.log(`🔍 Executing MCP row query on ${serverName}: ${query.substring(0, 100)}...`);
            const connection = await this.getOrCreateConnection(serverName);
            
            const response = await connection.client.callTool({
                name: 'execute_query',
                arguments: { query }
            });
            
            const content = response?.content?.[0]?.text;
            if (!content) return [];
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
            
            const response = await connection.client.callTool({
                name: 'list_tables'
            });
            
            const content = response?.content?.[0]?.text;
            if (!content) return [];
            const data = JSON.parse(content);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`❌ MCP list_tables failed for ${serverName}:`, error?.message || error);
            return [];
        }
    }

    // Clean up connections
    async cleanup() {
        for (const [serverName, connection] of this.connections) {
            try {
                if (connection.client) {
                    await connection.client.close();
                }
                if (connection.process && !connection.process.killed) {
                    connection.process.kill();
                }
            } catch (error) {
                console.warn(`Error cleaning up ${serverName}:`, error.message);
            }
        }
        this.connections.clear();
    }
}

export default MCPController;
