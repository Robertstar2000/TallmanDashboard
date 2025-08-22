#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Auto-Fix POR Connection - Background Testing ===');

const attempts = [
    {
        name: "Install mdb-reader dependency",
        command: "npm",
        args: ["install", "mdb-reader"],
        cwd: __dirname
    },
    {
        name: "Test mdbreader POR server",
        command: "node",
        args: ["-e", `
            const { spawn } = require('child_process');
            const server = spawn('node', ['por-server-mdbreader.js'], { 
                cwd: '${__dirname}',
                stdio: ['pipe', 'pipe', 'pipe'] 
            });
            
            let output = '';
            server.stdout.on('data', data => output += data.toString());
            server.stderr.on('data', data => output += data.toString());
            
            setTimeout(() => {
                server.stdin.write(JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'tools/call',
                    params: {
                        name: 'test_por_connection',
                        arguments: {}
                    }
                }) + '\\n');
                
                setTimeout(() => {
                    server.kill();
                    console.log('SERVER OUTPUT:', output);
                    process.exit(output.includes('success') ? 0 : 1);
                }, 2000);
            }, 1000);
        `],
        cwd: __dirname
    },
    {
        name: "Test backend integration",
        command: "node",
        args: ["../backend/quick-por-test.js"],
        cwd: __dirname
    }
];

async function runAttempt(attempt) {
    return new Promise((resolve) => {
        console.log(`\n🔄 ${attempt.name}...`);
        
        const process = spawn(attempt.command, attempt.args, {
            cwd: attempt.cwd || __dirname,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });
        
        let output = '';
        let errorOutput = '';
        
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${attempt.name} - SUCCESS`);
                if (output) console.log(`   Output: ${output.slice(0, 200)}...`);
                resolve({ success: true, output, errorOutput });
            } else {
                console.log(`❌ ${attempt.name} - FAILED (exit code: ${code})`);
                if (errorOutput) console.log(`   Error: ${errorOutput.slice(0, 200)}...`);
                resolve({ success: false, output, errorOutput, code });
            }
        });
        
        process.on('error', (error) => {
            console.log(`❌ ${attempt.name} - ERROR: ${error.message}`);
            resolve({ success: false, error: error.message });
        });
    });
}

async function main() {
    let successCount = 0;
    
    for (const attempt of attempts) {
        const result = await runAttempt(attempt);
        if (result.success) {
            successCount++;
        }
        
        // Add delay between attempts
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n=== Results: ${successCount}/${attempts.length} successful ===`);
    
    if (successCount === attempts.length) {
        console.log('🎉 POR connection should now be working!');
        
        // Create success marker
        fs.writeFileSync(path.join(__dirname, 'por-fix-complete.txt'), 
            `POR fix completed at ${new Date().toISOString()}\n` +
            `All ${attempts.length} tests passed successfully.\n` +
            'Restart TallmanDashboard to see POR as Connected.'
        );
        
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Check output above for details.');
        process.exit(1);
    }
}

main().catch(console.error);