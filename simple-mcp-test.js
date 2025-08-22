// Simple MCP test to check basic functionality
const { spawn } = require('child_process');
const fs = require('fs');

console.log('=== SIMPLE MCP CONNECTION TEST ===\n');

// Test if P21 MCP server can be spawned
console.log('1. Testing P21 MCP server spawn...\n');

try {
    const p21Process = spawn('node', ['P21-MCP-Server-Package/src/index.ts'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
    });

    p21Process.stdout.on('data', (data) => {
        console.log('P21 stdout:', data.toString());
    });

    p21Process.stderr.on('data', (data) => {
        console.log('P21 stderr:', data.toString());
    });

    p21Process.on('error', (error) => {
        console.log('❌ P21 spawn error:', error.message);
    });

    setTimeout(() => {
        console.log('Terminating P21 test process...');
        p21Process.kill();
    }, 3000);

} catch (error) {
    console.log('❌ P21 test failed:', error.message);
}

// Check allData.json current values
setTimeout(() => {
    console.log('\n2. Checking current allData.json values...\n');
    
    try {
        const allData = JSON.parse(fs.readFileSync('allData.json', 'utf8'));
        const nonZeroValues = allData.filter(entry => entry.value !== 0);
        const p21Count = allData.filter(entry => entry.serverName === 'P21').length;
        const porCount = allData.filter(entry => entry.serverName === 'POR').length;
        
        console.log(`Total entries: ${allData.length}`);
        console.log(`P21 entries: ${p21Count}`);
        console.log(`POR entries: ${porCount}`);
        console.log(`Non-zero values: ${nonZeroValues.length}`);
        
        if (nonZeroValues.length > 0) {
            console.log('Sample non-zero values:');
            nonZeroValues.slice(0, 5).forEach(entry => {
                console.log(`  ${entry.variableName}: ${entry.value} (${entry.serverName})`);
            });
        } else {
            console.log('⚠️  All values are 0 - this indicates MCP queries are not executing successfully');
        }
        
    } catch (error) {
        console.log('❌ Failed to read allData.json:', error.message);
    }
}, 4000);
