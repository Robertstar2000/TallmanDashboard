#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing POR 3-Library MCP Server...');
console.log('Libraries: node-adodb, mdb-tools-js, node-mdb');
console.log('Target: \\\\ts03\\POR\\POR.MDB');
console.log('Access: Read-only');
console.log('=' * 50);

// Set environment variable for POR database path
process.env.POR_DB_PATH = '\\\\ts03\\POR\\POR.MDB';

const serverPath = join(__dirname, 'mcp-servers', 'por-server-3lib.js');

// Test the MCP server
const testServer = () => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting POR 3-Library MCP server...');
    
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, POR_DB_PATH: '\\\\ts03\\POR\\POR.MDB' }
    });

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('📝 Server log:', data.toString().trim());
    });

    // Test status query
    setTimeout(() => {
      console.log('📡 Sending get_status request...');
      const statusRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'get_status',
          arguments: {}
        }
      };

      server.stdin.write(JSON.stringify(statusRequest) + '\n');
    }, 2000);

    // Test simple query
    setTimeout(() => {
      console.log('📡 Sending test query...');
      const queryRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'execute_query',
          arguments: {
            query: 'SELECT 42 as TestValue'
          }
        }
      };

      server.stdin.write(JSON.stringify(queryRequest) + '\n');
    }, 4000);

    // Complete test after 8 seconds
    setTimeout(() => {
      server.kill();
      console.log('✅ Test completed');
      console.log('\n📋 Server Output:');
      console.log(output);
      console.log('\n📋 Server Errors/Logs:');
      console.log(errorOutput);
      resolve({ output, errorOutput });
    }, 8000);

    server.on('error', (error) => {
      console.error('❌ Server error:', error.message);
      reject(error);
    });
  });
};

// Run the test
testServer()
  .then((result) => {
    console.log('\n🎉 POR 3-Library MCP server test completed');
    
    // Analyze results
    if (result.errorOutput.includes('✅')) {
      console.log('✅ At least one library succeeded');
    }
    
    if (result.errorOutput.includes('succeeded - using as primary method')) {
      const match = result.errorOutput.match(/✅ ([^\\s]+) succeeded - using as primary method/);
      if (match) {
        console.log(`🎯 Active method: ${match[1]}`);
      }
    }
    
    if (result.output.includes('status') && result.output.includes('connected')) {
      console.log('🔗 Connection status: Connected');
    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
