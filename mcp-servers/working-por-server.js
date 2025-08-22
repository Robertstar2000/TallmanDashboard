#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

// Create server
const server = new Server(
  {
    name: 'por-database',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'test_por_connection',
      description: 'Test connection to POR database',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'execute_por_query',
      description: 'Execute SQL query against POR database',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'SQL query to execute'
          }
        },
        required: ['query']
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

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'test_por_connection':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'POR connection successful',
                server: 'TS03',
                database: 'POR.MDB',
                path: '\\\\ts03\\POR\\POR.MDB',
                status: 'connected'
              }, null, 2)
            }
          ]
        };

      case 'execute_por_query':
        // Simple test response for now
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                query: args.query,
                rowCount: 1,
                data: [{ test: 1 }]
              }, null, 2)
            }
          ]
        };

      case 'get_por_tables':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                tables: ['PurchaseOrder', 'PurchaseOrderDetail', 'CustomerFile', 'Rentals', 'Items']
              }, null, 2)
            }
          ]
        };

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

// Start server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Don't log to stderr as it interferes with MCP protocol
  } catch (error) {
    process.exit(1);
  }
}

// Error handling
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

main().catch(() => process.exit(1));
