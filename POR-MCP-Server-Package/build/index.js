#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import MDBReader from 'mdb-reader';
import { readFileSync } from 'fs';
// Get database configuration from environment variables
const POR_FILE_PATH = process.env.POR_FILE_PATH;
if (!POR_FILE_PATH) {
    throw new Error('POR_FILE_PATH environment variable is required');
}
const isValidQueryArgs = (args) => typeof args === 'object' &&
    args !== null &&
    typeof args.query === 'string';
class PORServer {
    server;
    mdbReader = null;
    lastRequestTime = 0;
    RATE_LIMIT_DELAY = 1000; // 1 second in milliseconds
    constructor() {
        this.server = new Server({
            name: 'por-server',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.cleanup();
            process.exit(0);
        });
    }
    getMDBReader() {
        if (!this.mdbReader) {
            const buffer = readFileSync(POR_FILE_PATH);
            this.mdbReader = new MDBReader(buffer);
        }
        return this.mdbReader;
    }
    async executeQuery(query) {
        try {
            const reader = this.getMDBReader();
            // Simple query parsing for basic SELECT statements
            const trimmedQuery = query.trim().toLowerCase();
            if (trimmedQuery.startsWith('select')) {
                // Extract table name from query (basic parsing)
                const fromMatch = trimmedQuery.match(/from\s+\[?(\w+)\]?/);
                if (!fromMatch) {
                    throw new Error('Could not parse table name from query');
                }
                const tableName = fromMatch[1];
                const table = reader.getTable(tableName);
                const data = table.getData();
                return data;
            }
            else {
                throw new Error('Only SELECT queries are supported with mdb-reader');
            }
        }
        catch (error) {
            console.error('Query execution error:', error);
            throw error;
        }
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'execute_query',
                    description: 'Execute a SQL query against the POR MS Access database',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'SQL query to execute',
                            },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'get_version',
                    description: 'Get POR database version and connection info',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                {
                    name: 'list_tables',
                    description: 'List all tables in the POR database',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                {
                    name: 'describe_table',
                    description: 'Get column information for a specific table',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            tableName: {
                                type: 'string',
                                description: 'Name of the table to describe',
                            },
                        },
                        required: ['tableName'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                // Rate limiting: enforce 30-second delay between requests
                const currentTime = Date.now();
                const timeSinceLastRequest = currentTime - this.lastRequestTime;
                if (this.lastRequestTime > 0 && timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
                    const waitTime = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
                    console.error(`Rate limiting: waiting ${Math.ceil(waitTime / 1000)} seconds before next POR request...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                this.lastRequestTime = Date.now();
                console.error(`Executing POR request: ${request.params.name}`);
                switch (request.params.name) {
                    case 'execute_query': {
                        if (!isValidQueryArgs(request.params.arguments)) {
                            throw new McpError(ErrorCode.InvalidParams, 'Invalid query arguments');
                        }
                        // Check for write operations and block them
                        if (this.isWriteOperation(request.params.arguments.query)) {
                            const warningMessage = `⚠️  WRITE OPERATION BLOCKED: POR MCP Server is READ-ONLY for safety. Attempted query: ${request.params.arguments.query.substring(0, 100)}...`;
                            console.error(warningMessage);
                            throw new McpError(ErrorCode.InvalidRequest, 'Write operations are not allowed. This server is configured for read-only access to protect the production database.');
                        }
                        const result = await this.executeQuery(request.params.arguments.query);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2),
                                },
                            ],
                        };
                    }
                    case 'get_version': {
                        const serverInfo = {
                            version: 'MDB Reader',
                            filePath: POR_FILE_PATH,
                            provider: 'mdb-reader',
                            type: 'MS Access Database',
                        };
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(serverInfo, null, 2),
                                },
                            ],
                        };
                    }
                    case 'list_tables': {
                        const reader = this.getMDBReader();
                        const tableNames = reader.getTableNames();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(tableNames, null, 2),
                                },
                            ],
                        };
                    }
                    case 'describe_table': {
                        const tableName = request.params.arguments?.tableName;
                        if (!tableName || typeof tableName !== 'string') {
                            throw new McpError(ErrorCode.InvalidParams, 'Table name is required');
                        }
                        try {
                            const reader = this.getMDBReader();
                            const table = reader.getTable(tableName);
                            const columns = table.getColumns().map(col => ({
                                column_name: col.name,
                                data_type: col.type,
                                size: col.size,
                            }));
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(columns, null, 2),
                                    },
                                ],
                            };
                        }
                        catch (error) {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify([{ error: `Cannot access table structure: ${error}` }], null, 2),
                                    },
                                ],
                            };
                        }
                    }
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                console.error('🚨 POR CRITICAL DATABASE ERROR:', error);
                // PRODUCTION RULE: NEVER return fallback data - ALWAYS fail with error
                throw new McpError(ErrorCode.InternalError, `POR SQL execution failed: ${error instanceof Error ? error.message : 'Unknown database error'}. No fallback data available - check database file path and query syntax.`);
            }
        });
    }
    isWriteOperation(query) {
        const writeKeywords = [
            'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
            'TRUNCATE', 'MERGE', 'REPLACE', 'EXEC', 'EXECUTE'
        ];
        const normalizedQuery = query.trim().toUpperCase();
        return writeKeywords.some(keyword => normalizedQuery.startsWith(keyword));
    }
    async cleanup() {
        this.mdbReader = null;
        console.error('POR server shutting down');
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('POR MCP server running on stdio');
    }
}
const server = new PORServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map