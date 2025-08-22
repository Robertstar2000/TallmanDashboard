#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const MDBReader = require('mdb-reader');

class PORDatabaseServer {
  constructor() {
    this.server = new Server(
      {
        name: 'por-database-server',
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
          name: 'execute_por_query',
          description: 'Execute SQL query against POR MS Access database',
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
          description: 'Test connection to POR MS Access database',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_por_tables',
          description: 'Get list of tables in POR MS Access database',
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
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async getConnection() {
    const dbPath = process.env.POR_DB_PATH || '\\\\ts03\\POR\\POR.MDB';
    const password = process.env.POR_DB_PASSWORD || '';
    
    let connectionString;
    if (password) {
      connectionString = `DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${dbPath};PWD=${password};`;
    } else {
      connectionString = `DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${dbPath};`;
    }
    
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
      // Use MS Access compatible syntax for testing
      const result = await connection.query('SELECT 1 as test');
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Connection successful',
              database: process.env.POR_DB_PATH || '\\\\ts03\\POR\\POR.MDB'
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
              database: process.env.POR_DB_PATH || '\\\\ts03\\POR\\POR.MDB'
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
      // MS Access system tables query
      const result = await connection.query(`
        SELECT Name as TABLE_NAME 
        FROM MSysObjects 
        WHERE Type=1 AND Flags=0
        ORDER BY Name
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
      // Fallback: try ODBC catalog functions
      try {
        const tables = await connection.tables(null, null, null, 'TABLE');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                tables: tables.map(row => row.TABLE_NAME)
              }, null, 2)
            }
          ]
        };
      } catch (fallbackError) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Primary error: ${error.message}, Fallback error: ${fallbackError.message}`
              }, null, 2)
            }
          ]
        };
      }
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('POR Database MCP server running on stdio');
  }
}

const server = new PORDatabaseServer();
server.run().catch(console.error);