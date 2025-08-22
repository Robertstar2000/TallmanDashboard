#!/usr/bin/env node

// Simple test to verify Node.js and MCP SDK
console.log('Testing MCP server dependencies...');

try {
    console.log('Node version:', process.version);
    
    // Test MCP SDK
    const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
    console.log('✓ MCP SDK Server loaded successfully');
    
    const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
    console.log('✓ MCP SDK Transport loaded successfully');
    
    // Test ODBC
    const odbc = require('odbc');
    console.log('✓ ODBC module loaded successfully');
    
    console.log('All dependencies loaded successfully!');
    
} catch (error) {
    console.error('❌ Error loading dependencies:', error.message);
    console.error('Stack:', error.stack);
}
