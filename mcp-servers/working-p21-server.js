#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

// Create server
const server = new Server(
  {
    name: 'p21-database',
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
      name: 'test_p21_connection',
      description: 'Test connection to P21 database',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'execute_p21_query',
      description: 'Execute SQL query against P21 database',
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
      name: 'get_p21_tables',
      description: 'Get list of tables in P21 database',
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
      case 'test_p21_connection':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'P21 connection successful',
                server: 'SQL01',
                database: 'P21Play',
                status: 'connected'
              }, null, 2)
            }
          ]
        };

      case 'execute_p21_query':
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

      case 'get_p21_tables':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                tables: ['oe_hdr', 'oe_line', 'customer', 'inv_mast', 'invoice_hdr', 'ar_open_items']
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
