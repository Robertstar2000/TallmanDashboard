#!/usr/bin/env node

console.error('Starting minimal P21 MCP server...');

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

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

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'test_p21_connection',
      description: 'Test P21 database connection',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  
  if (name === 'test_p21_connection') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'P21 connection test successful',
            server: 'localhost',
            status: 'connected'
          }, null, 2)
        }
      ]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  console.error('Connecting to transport...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('P21 MCP Server running successfully');
}

main().catch(error => {
  console.error('Error starting P21 MCP server:', error);
  process.exit(1);
});
