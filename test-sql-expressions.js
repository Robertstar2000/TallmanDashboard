// Test SQL expressions from allData.json against P21 and POR databases
const fs = require('fs');
const { spawn } = require('child_process');

// Load allData.json
const allData = JSON.parse(fs.readFileSync('allData.json', 'utf8'));

async function testP21Query(sql) {
    return new Promise((resolve, reject) => {
        const mcpProcess = spawn('node', ['./P21-MCP-Server-Package/src/index.ts'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        mcpProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        mcpProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        // Send JSON-RPC request
        const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: "execute_p21_query",
                arguments: { query: sql }
            }
        };

        mcpProcess.stdin.write(JSON.stringify(request) + '\n');
        
        setTimeout(() => {
            mcpProcess.kill();
            resolve({ success: false, error: 'Timeout', output, errorOutput });
        }, 5000);

        mcpProcess.on('exit', (code) => {
            try {
                const result = JSON.parse(output);
                resolve({ success: true, result, output, errorOutput });
            } catch (e) {
                resolve({ success: false, error: e.message, output, errorOutput });
            }
        });
    });
}

async function testPORQuery(sql) {
    return new Promise((resolve, reject) => {
        const mcpProcess = spawn('node', ['./POR-MCP-Server-Package/src/index.ts'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        mcpProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        mcpProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        // Send JSON-RPC request
        const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: "execute_por_query",
                arguments: { query: sql }
            }
        };

        mcpProcess.stdin.write(JSON.stringify(request) + '\n');
        
        setTimeout(() => {
            mcpProcess.kill();
            resolve({ success: false, error: 'Timeout', output, errorOutput });
        }, 5000);

        mcpProcess.on('exit', (code) => {
            try {
                const result = JSON.parse(output);
                resolve({ success: true, result, output, errorOutput });
            } catch (e) {
                resolve({ success: false, error: e.message, output, errorOutput });
            }
        });
    });
}

async function testSQLExpression(entry) {
    console.log(`\n=== Testing ID ${entry.id}: ${entry.variableName} ===`);
    console.log(`Chart Group: ${entry.chartGroup}`);
    console.log(`Data Point: ${entry.dataPoint}`);
    console.log(`Server: ${entry.serverName}`);
    console.log(`SQL: ${entry.productionSqlExpression}`);
    
    let result;
    if (entry.serverName === 'P21') {
        result = await testP21Query(entry.productionSqlExpression);
    } else {
        result = await testPORQuery(entry.productionSqlExpression);
    }
    
    console.log(`Result:`, result);
    return result;
}

async function main() {
    console.log('=== SQL Expression Testing Tool ===\n');
    
    // Test first few entries to validate approach
    const testEntries = allData.slice(0, 5);
    
    for (const entry of testEntries) {
        await testSQLExpression(entry);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

main().catch(console.error);
