const { spawn } = require('child_process');
const path = require('path');

async function testP21Connection() {
    console.log('Testing P21 MCP Server DSN Connection...');
    
    const p21ServerPath = path.join(__dirname, '..', 'P21-MCP-Server-Package');
    const serverScript = path.join(p21ServerPath, 'src', 'index.ts');
    
    console.log(`Starting P21 MCP server from: ${serverScript}`);
    
    // Start the P21 MCP server
    const serverProcess = spawn('npx', ['tsx', serverScript], {
        cwd: p21ServerPath,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverOutput = '';
    let serverErrors = '';
    
    serverProcess.stdout.on('data', (data) => {
        serverOutput += data.toString();
        console.log('Server stdout:', data.toString().trim());
    });
    
    serverProcess.stderr.on('data', (data) => {
        serverErrors += data.toString();
        console.log('Server stderr:', data.toString().trim());
    });
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test basic connection with list_tables
    console.log('\n--- Testing list_tables tool ---');
    const listTablesRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
            name: 'list_tables',
            arguments: {}
        }
    };
    
    try {
        serverProcess.stdin.write(JSON.stringify(listTablesRequest) + '\n');
        
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('\n--- Testing simple query ---');
        const queryRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'execute_query',
                arguments: {
                    query: 'SELECT TOP 5 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\' ORDER BY TABLE_NAME'
                }
            }
        };
        
        serverProcess.stdin.write(JSON.stringify(queryRequest) + '\n');
        
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } catch (error) {
        console.error('Error sending requests:', error);
    }
    
    // Clean up
    console.log('\n--- Cleaning up ---');
    serverProcess.kill();
    
    console.log('\n=== Test Results ===');
    console.log('Server Output:', serverOutput);
    console.log('Server Errors:', serverErrors);
    
    if (serverErrors.includes('P21 MCP Server starting with DSN')) {
        console.log('✅ P21 MCP server started successfully with DSN');
    } else {
        console.log('❌ P21 MCP server failed to start with DSN');
    }
    
    if (serverErrors.includes('Connecting to P21 with: DSN=P21live')) {
        console.log('✅ P21 MCP server attempting DSN connection');
    } else {
        console.log('❌ P21 MCP server not using expected DSN');
    }
}

testP21Connection().catch(console.error);
