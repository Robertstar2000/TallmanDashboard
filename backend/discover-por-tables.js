const { spawn } = require('child_process');
const path = require('path');

async function discoverPORTables() {
    console.log('=== Discovering POR Database Tables ===\n');
    
    const porServerPath = path.join(__dirname, '..', 'POR-MCP-Server-Package');
    
    console.log('Starting POR MCP server...');
    
    const serverProcess = spawn('node', ['build/index.js'], {
        cwd: porServerPath,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let tablesDiscovered = [];
    
    serverProcess.stderr.on('data', (data) => {
        console.log(`[POR Server] ${data.toString().trim()}`);
    });
    
    serverProcess.on('error', (error) => {
        console.error('❌ Server process error:', error.message);
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n--- Requesting table list ---');
    
    const listTablesRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
            name: 'list_tables',
            arguments: {}
        }
    };
    
    let responseReceived = false;
    
    serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Raw response:', output);
        
        try {
            // Parse MCP response
            const lines = output.split('\n').filter(line => line.trim());
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
                        tablesDiscovered = tables;
                        responseReceived = true;
                    }
                } catch (parseError) {
                    // Ignore parse errors for partial responses
                }
            }
        } catch (error) {
            console.log('Parse error (expected during streaming):', error.message);
        }
    });
    
    try {
        serverProcess.stdin.write(JSON.stringify(listTablesRequest) + '\n');
        
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        if (responseReceived && tablesDiscovered.length > 0) {
            console.log('\n--- Analyzing table names for rental data ---');
            const rentalTables = tablesDiscovered.filter(table => 
                table.toLowerCase().includes('rental') || 
                table.toLowerCase().includes('contract') ||
                table.toLowerCase().includes('lease')
            );
            
            if (rentalTables.length > 0) {
                console.log('Potential rental-related tables:');
                rentalTables.forEach(table => console.log(`- ${table}`));
            } else {
                console.log('No obvious rental tables found. All tables:');
                tablesDiscovered.forEach(table => console.log(`- ${table}`));
            }
        } else {
            console.log('❌ No tables discovered - check POR database connection');
        }
        
    } catch (error) {
        console.error('❌ Error sending request:', error.message);
    }
    
    // Clean up
    serverProcess.kill();
    
    return tablesDiscovered;
}

discoverPORTables().catch(console.error);
