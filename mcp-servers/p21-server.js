#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const odbc = require('odbc');

class P21DatabaseServer {
  constructor() {
    this.server = new Server(
      {
        name: 'p21-database-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_p21_query',
          description: 'Execute SQL query against P21 database',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL query to execute against P21 database'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'test_p21_connection',
          description: 'Test connection to P21 database',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_p21_tables',
          description: 'Get list of tables in P21 database',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_p21_query':
            return await this.executeQuery(args.query);
          
          case 'test_p21_connection':
            return await this.testConnection();
          
          case 'get_p21_tables':
            return await this.getTables();
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async getConnection() {
    // Use DSN connection with Windows Authentication
    const dsn = process.env.P21_DSN || 'P21Live';
    const connectionString = `DSN=${dsn};Trusted_Connection=yes;`;
    
    console.error(`[P21 MCP] Connecting with DSN: ${dsn}`);
    return await odbc.connect(connectionString);
  }

  async executeQuery(query) {
    let connection;
    try {
      connection = await this.getConnection();
      const result = await connection.query(query);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              rowCount: result.length,
              data: result
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }
        ]
      };
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  async testConnection() {
    let connection;
    try {
      connection = await this.getConnection();
      const result = await connection.query('SELECT 1 as test');
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Connection successful',
              server: process.env.P21_SERVER || 'Unknown',
              database: process.env.P21_DATABASE || 'Unknown'
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              server: process.env.P21_SERVER || 'Unknown',
              database: process.env.P21_DATABASE || 'Unknown'
            }, null, 2)
          }
        ]
      };
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  async getTables() {
    let connection;
    try {
      connection = await this.getConnection();
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
            text: JSON.stringify({
              success: true,
              tables: result.map(row => row.TABLE_NAME)
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }
        ]
      };
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('P21 Database MCP server running on stdio');
  }
}

const server = new P21DatabaseServer();
server.run().catch(console.error);