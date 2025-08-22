const { spawn } = require('child_process');
const path = require('path');

async function testPORDirect() {
    console.log('=== Testing POR MCP Server Directly ===\n');
    
    const porServerPath = path.join(__dirname, '..', 'POR-MCP-Server-Package');
    
    console.log('Starting POR MCP server...');
    
    const serverProcess = spawn('node', ['build/index.js'], {
        cwd: porServerPath,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let responseData = '';
    
    serverProcess.stderr.on('data', (data) => {
        console.log(`[POR Server] ${data.toString().trim()}`);
    });
    
    serverProcess.stdout.on('data', (data) => {
        responseData += data.toString();
        console.log(`[Response] ${data.toString().trim()}`);
    });
    
    serverProcess.on('error', (error) => {
        console.error('❌ Server process error:', error.message);
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n--- Sending list_tables request ---');
    
    const listTablesRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
            name: 'list_tables',
            arguments: {}
        }
    };
    
    const requestStr = JSON.stringify(listTablesRequest);
    const header = `Content-Length: ${Buffer.byteLength(requestStr, 'utf8')}\r\n\r\n`;
    
    serverProcess.stdin.write(header + requestStr);
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n--- Cleaning up ---');
    serverProcess.kill();
    
    // Parse response
    if (responseData) {
        console.log('\n--- Parsing response ---');
        try {
            const lines = responseData.split('\n').filter(line => line.trim());
            for (const line of lines) {
                if (line.includes('Content-Length:')) continue;
                if (!line.trim()) continue;
                
                try {
                    const response = JSON.parse(line);
                    if (response.result && response.result.content) {
                        const content = response.result.content[0].text;
                        const tables = JSON.parse(content);
                        console.log('\n✅ POR Tables discovered:');
                        tables.forEach((table, index) => {
                            console.log(`${index + 1}. ${table}`);
                        });
                        
                        // Look for rental-related tables
                        const rentalTables = tables.filter(table => 
                            table.toLowerCase().includes('rental') || 
                            table.toLowerCase().includes('contract') ||
                            table.toLowerCase().includes('lease') ||
                            table.toLowerCase().includes('agreement')
                        );
                        
                        if (rentalTables.length > 0) {
                            console.log('\n🎯 Rental-related tables found:');
                            rentalTables.forEach(table => console.log(`- ${table}`));
                        } else {
                            console.log('\n⚠️ No obvious rental tables found');
                        }
                        
                        return tables;
                    }
                } catch (parseError) {
                    // Continue trying to parse other lines
                }
            }
        } catch (error) {
            console.log('Parse error:', error.message);
        }
    }
}

testPORDirect().catch(console.error);
