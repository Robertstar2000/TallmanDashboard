import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCP_SERVERS = {
    P21: {
        path: path.join(__dirname, '..', 'P21-MCP-Server-Package', 'build', 'index.js'),
        process: null,
        env: {
            P21_DB_PATH: 'C:\\TallmanDashboard\\P21Live.mdb'
        }
    },
    POR: {
        path: path.join(__dirname, '..', 'POR-MCP-Server-Package', 'build', 'index.js'),
        process: null,
        env: {
            POR_FILE_PATH: 'C:\\TallmanDashboard\\POR.mdb'
        }
    }
};

function startMCPServers() {
    for (const serverName in MCP_SERVERS) {
        const server = MCP_SERVERS[serverName];
        if (!server.process) {
            console.log(`Starting ${serverName} MCP server...`);
            server.process = spawn('node', [server.path], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, ...server.env }
            });

            server.process.stdout.on('data', (data) => {
                console.log(`[MCP ${serverName} log]: ${data}`);
            });

            server.process.stderr.on('data', (data) => {
                console.error(`[MCP ${serverName} stderr]: ${data}`);
            });

            server.process.on('close', (code) => {
                console.log(`${serverName} MCP server exited with code ${code}`);
                server.process = null;
            });
        }
    }
}

function stopMCPServers() {
    for (const serverName in MCP_SERVERS) {
        const server = MCP_SERVERS[serverName];
        if (server.process) {
            console.log(`Stopping ${serverName} MCP server...`);
            server.process.kill();
            server.process = null;
        }
    }
}

async function executeQuery(serverName, query) {
    const server = MCP_SERVERS[serverName];
    if (!server || !server.process) {
        throw new Error(`${serverName} MCP server is not running.`);
    }

    return new Promise((resolve, reject) => {
        const requestId = Date.now();
        const request = {
            jsonrpc: '2.0',
            id: requestId,
            method: 'tools/call',
            params: {
                name: 'execute_query',
                arguments: { query }
            }
        };

        const responseListener = (data) => {
            try {
                const response = JSON.parse(data.toString());
                if (response.id === requestId) {
                    server.process.stdout.removeListener('data', responseListener);
                    if (response.error) {
                        reject(new Error(`MCP error from ${serverName}: ${response.error.message}`));
                    } else {
                        resolve(response.result);
                    }
                }
            } catch (error) {
                // Ignore parsing errors if the data is not a valid JSON RPC response
            }
        };

        server.process.stdout.on('data', responseListener);
        server.process.stdin.write(JSON.stringify(request) + '\n');
    });
}

export { startMCPServers, stopMCPServers, executeQuery };
