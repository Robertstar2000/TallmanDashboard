import { spawn } from 'child_process';
import path from 'path';

console.log('🧪 Testing POR MCP Server Connection...\n');

async function testPORServer() {
  try {
    const porServerPath = path.join(process.cwd(), '..', 'POR-MCP-Server-Package', 'build', 'index.js');
    const packageDir = path.join(process.cwd(), '..', 'POR-MCP-Server-Package');
    
    console.log('📂 POR Server Path:', porServerPath);
    console.log('📂 Package Directory:', packageDir);
    
    // Spawn POR MCP server with environment variable
    const porProcess = spawn('node', [porServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        POR_FILE_PATH: 'C:\\TallmanDashboard\\POR.mdb' 
      },
      cwd: packageDir
    });

    let responseReceived = false;
    
    // Set timeout
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        console.error('❌ POR server test timeout');
        porProcess.kill();
      }
    }, 10000);

    // Handle stdout
    porProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📤 POR Output:', output.trim());
      
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            console.log('📋 POR JSON Response:', JSON.stringify(response, null, 2));
            
            if (response.id === 1) {
              console.log('✅ POR server initialized successfully');
              
              // Send a test query
              const testQuery = {
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/call',
                params: {
                  name: 'execute_query',
                  arguments: { 
                    query: 'SELECT COUNT(*) as table_count FROM MSysObjects WHERE Type=1' 
                  }
                }
              };
              
              console.log('🔍 Sending test query...');
              porProcess.stdin.write(JSON.stringify(testQuery) + '\n');
            }
            
            if (response.id === 2) {
              responseReceived = true;
              clearTimeout(timeout);
              
              if (response.result) {
                console.log('✅ POR query successful!');
                console.log('📊 Query result:', JSON.stringify(response.result, null, 2));
              } else if (response.error) {
                console.log('❌ POR query error:', response.error);
              }
              
              porProcess.kill();
            }
          } catch (error) {
            // Ignore non-JSON lines
          }
        }
      }
    });

    // Handle stderr
    porProcess.stderr.on('data', (data) => {
      console.log('🚨 POR Error:', data.toString().trim());
    });

    // Handle process exit
    porProcess.on('exit', (code) => {
      console.log(`🏁 POR process exited with code ${code}`);
    });

    // Send initialization request
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };

    console.log('🔧 Initializing POR server...');
    porProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  } catch (error) {
    console.error('❌ POR test failed:', error.message);
  }
}

testPORServer();
