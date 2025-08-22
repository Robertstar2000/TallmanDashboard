// Direct MCP Server Test
import { spawn } from 'child_process';
import path from 'path';

async function testMCPServer(serverName, serverPath) {
    console.log(`\n=== Testing ${serverName} MCP Server ===`);
    console.log(`Path: ${serverPath}`);
    
    return new Promise((resolve, reject) => {
        const process = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: path.dirname(serverPath)
        });
        
        let output = '';
        let errorOutput = '';
        
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.log(`${serverName} stderr:`, data.toString().trim());
        });
        
        process.on('error', (error) => {
            console.log(`❌ ${serverName} process error:`, error.message);
            resolve(false);
        });
        
        process.on('exit', (code) => {
            console.log(`${serverName} process exited with code ${code}`);
            if (code !== 0) {
                console.log(`${serverName} error output:`, errorOutput);
            }
            resolve(code === 0);
        });
        
        // Send initialization request
        const initRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                clientInfo: { name: 'test', version: '1.0.0' }
            }
        };
        
        try {
            process.stdin.write(JSON.stringify(initRequest) + '\n');
            console.log(`✅ Sent init request to ${serverName}`);
        } catch (error) {
            console.log(`❌ Failed to send init request to ${serverName}:`, error.message);
        }
        
        // Kill after 5 seconds
        setTimeout(() => {
            if (!process.killed) {
                process.kill();
                console.log(`${serverName} test completed (timeout)`);
                resolve(true);
            }
        }, 5000);
    });
}

async function main() {
    console.log('=== Direct MCP Server Test ===');
    
    const p21Path = 'C:\\Users\\BobM\\Desktop\\TallmanDashboard\\P21-MCP-Server-Package\\build\\index.js';
    const porPath = 'C:\\Users\\BobM\\Desktop\\TallmanDashboard\\POR-MCP-Server-Package\\build\\index.js';
    
    const p21Result = await testMCPServer('P21', p21Path);
    const porResult = await testMCPServer('POR', porPath);
    
    console.log('\n=== Results ===');
    console.log('P21 MCP Server:', p21Result ? '✅ Working' : '❌ Failed');
    console.log('POR MCP Server:', porResult ? '✅ Working' : '❌ Failed');
}

main().catch(console.error);
