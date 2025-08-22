#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const odbc = require('odbc');

class P21DatabaseServer {
  constructor() {
    this.server = new Server(
      {
        name: 'p21-database',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => {
      // Don't log errors to stderr as it interferes with MCP protocol
    };
    
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
              text: JSON.stringify({
                success: false,
                error: error.message
              }, null, 2)
            }
          ]
        };
      }
    });
  }

  async getConnection() {
    try {
      // Use DSN connection with Windows Authentication
      const dsn = process.env.P21_DSN || 'P21Live';
      const connectionString = `DSN=${dsn};Trusted_Connection=yes;`;
      
      return await odbc.connect(connectionString);
    } catch (error) {
      throw new Error(`P21 connection failed: ${error.message}`);
    }
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
        try {
          await connection.close();
        } catch (e) {
          // Ignore close errors
        }
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
              message: 'P21 connection successful',
              server: 'SQL01',
              database: 'P21Play',
              dsn: process.env.P21_DSN || 'P21Live',
              status: 'connected'
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
              server: 'SQL01',
              database: 'P21Play',
              dsn: process.env.P21_DSN || 'P21Live',
              status: 'disconnected'
            }, null, 2)
          }
        ]
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          // Ignore close errors
        }
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
        try {
          await connection.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new P21DatabaseServer();
server.run().catch(() => process.exit(1));
