#!/usr/bin/env node
import { config } from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import odbc from 'odbc';
// Load environment variables from .env file
config({ path: '.env' });
// Get database configuration from environment variables
const P21_DSN = process.env.P21_DSN;
if (!P21_DSN) {
    throw new Error('P21_DSN environment variable is required');
}
const isValidQueryArgs = (args) => typeof args === 'object' &&
    args !== null &&
    typeof args.query === 'string';
class P21Server {
    server;
    connection = null;
    lastRequestTime = 0;
    RATE_LIMIT_DELAY = 1000; // 1 second in milliseconds
    constructor() {
        this.server = new Server({
            name: 'p21-server',
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
    async getConnection() {
        // Always create a new connection to ensure it's fresh
        if (this.connection) {
            await this.connection.close();
        }
        // Use DSN connection string for ODBC
        const connectionString = `DSN=${P21_DSN}`;
        this.connection = await odbc.connect(connectionString);
        return this.connection;
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'execute_query',
                    description: 'Execute a SQL query against the P21 database',
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
                    description: 'Get P21 database version and connection info',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                {
                    name: 'list_tables',
                    description: 'List all tables in the P21 database',
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
                    console.error(`Rate limiting: waiting ${Math.ceil(waitTime / 1000)} seconds before next P21 request...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                this.lastRequestTime = Date.now();
                console.error(`Executing P21 request: ${request.params.name}`);
                const connection = await this.getConnection();
                switch (request.params.name) {
                    case 'execute_query': {
                        if (!isValidQueryArgs(request.params.arguments)) {
                            throw new McpError(ErrorCode.InvalidParams, 'Invalid query arguments');
                        }
                        // Check for write operations and block them
                        if (this.isWriteOperation(request.params.arguments.query)) {
                            const warningMessage = `⚠️  WRITE OPERATION BLOCKED: P21 MCP Server is READ-ONLY for safety. Attempted query: ${request.params.arguments.query.substring(0, 100)}...`;
                            console.error(warningMessage);
                            throw new McpError(ErrorCode.InvalidRequest, 'Write operations are not allowed. This server is configured for read-only access to protect the production database.');
                        }
                        const result = await connection.query(request.params.arguments.query);
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
                        const result = await connection.query('SELECT @@VERSION as version');
                        const serverInfo = {
                            version: result[0]?.version || 'Unknown',
                            dsn: P21_DSN,
                            provider: 'ODBC',
                            connectionString: `DSN=${P21_DSN}`,
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
                        const result = await connection.query(`
              SELECT TABLE_NAME 
              FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_TYPE = 'BASE TABLE'
              ORDER BY TABLE_NAME
            `);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(result.map((row) => row.TABLE_NAME), null, 2),
                                },
                            ],
                        };
                    }
                    case 'describe_table': {
                        const tableName = request.params.arguments?.tableName;
                        if (!tableName || typeof tableName !== 'string') {
                            throw new McpError(ErrorCode.InvalidParams, 'Table name is required');
                        }
                        const result = await connection.query(`
              SELECT 
                COLUMN_NAME as column_name,
                DATA_TYPE as data_type,
                IS_NULLABLE as is_nullable,
                CHARACTER_MAXIMUM_LENGTH as max_length
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = '${tableName}'
              ORDER BY ORDINAL_POSITION
            `);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2),
                                },
                            ],
                        };
                    }
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                console.error('🚨 P21 CRITICAL DATABASE ERROR:', error);
                // PRODUCTION RULE: NEVER return fallback data - ALWAYS fail with error
                throw new McpError(ErrorCode.InternalError, `P21 SQL execution failed: ${error instanceof Error ? error.message : 'Unknown database error'}. No fallback data available - check database connection and query syntax.`);
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
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('P21 MCP server running on stdio');
    }
}
const server = new P21Server();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map