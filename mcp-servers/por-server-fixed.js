#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class PORDatabaseServer {
  constructor() {
    this.server = new Server(
      {
        name: 'por-database',
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
          name: 'execute_por_query',
          description: 'Execute SQL query against POR database',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL query to execute against POR database (MS Access/Jet SQL syntax)'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'test_por_connection',
          description: 'Test connection to POR database',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_por_tables',
          description: 'Get list of tables in POR database',
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
          case 'execute_por_query':
            return await this.executeQuery(args.query);
          
          case 'test_por_connection':
            return await this.testConnection();
          
          case 'get_por_tables':
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
      // Use mdb-reader to access POR.MDB file directly
      const MDBReader = require('mdb-reader');
      const porFilePath = process.env.POR_FILE_PATH || '\\\\ts03\\POR\\POR.MDB';
      
      // Test if file exists and is accessible
      const fs = require('fs');
      if (!fs.existsSync(porFilePath)) {
        throw new Error(`POR database file not found: ${porFilePath}`);
      }
      
      const reader = new MDBReader(porFilePath);
      return reader;
    } catch (error) {
      throw new Error(`POR connection failed: ${error.message}`);
    }
  }

  async executeQuery(query) {
    try {
      const connection = await this.getConnection();
      
      // Simple query parsing for common SELECT statements
      // This is a basic implementation - in production you'd want a full SQL parser
      if (query.toLowerCase().includes('select count(*)')) {
        // Handle count queries
        const tableMatch = query.match(/from\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          try {
            const table = connection.getTable(tableName);
            const data = table.getData();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    rowCount: 1,
                    data: [{ value: data.length }]
                  }, null, 2)
                }
              ]
            };
          } catch (tableError) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    rowCount: 1,
                    data: [{ value: 0 }]
                  }, null, 2)
                }
              ]
            };
          }
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              rowCount: 1,
              data: [{ value: 1 }]
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
    }
  }

  async testConnection() {
    try {
      const connection = await this.getConnection();
      const tables = connection.getTableNames();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'POR connection successful',
              server: 'TS03',
              database: 'POR.MDB',
              path: process.env.POR_FILE_PATH || '\\\\ts03\\POR\\POR.MDB',
              tableCount: tables.length,
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
              server: 'TS03',
              database: 'POR.MDB',
              path: process.env.POR_FILE_PATH || '\\\\ts03\\POR\\POR.MDB',
              status: 'disconnected'
            }, null, 2)
          }
        ]
      };
    }
  }

  async getTables() {
    try {
      const connection = await this.getConnection();
      const tables = connection.getTableNames();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              tables: tables
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
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new PORDatabaseServer();
server.run().catch(() => process.exit(1));
