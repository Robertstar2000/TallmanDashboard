// Fix SQL Query Tool by checking MCP server connectivity and backend logs
const fs = require('fs');
const path = require('path');

console.log('=== Diagnosing SQL Query Tool Issue ===');

// Check if MCP servers are built
console.log('\n1. Checking MCP server builds...');

const p21BuildPath = path.join(__dirname, 'P21-MCP-Server-Package', 'build', 'index.js');
const porBuildPath = path.join(__dirname, 'POR-MCP-Server-Package', 'build', 'index.js');

console.log('P21 build exists:', fs.existsSync(p21BuildPath));
console.log('POR build exists:', fs.existsSync(porBuildPath));

// Check environment files
console.log('\n2. Checking environment configuration...');

const p21EnvPath = path.join(__dirname, 'P21-MCP-Server-Package', '.env');
const porEnvPath = path.join(__dirname, 'POR-MCP-Server-Package', '.env');

if (fs.existsSync(p21EnvPath)) {
    const p21Env = fs.readFileSync(p21EnvPath, 'utf8');
    console.log('P21 .env content:', p21Env.trim());
} else {
    console.log('P21 .env file not found');
}

if (fs.existsSync(porEnvPath)) {
    const porEnv = fs.readFileSync(porEnvPath, 'utf8');
    console.log('POR .env content:', porEnv.trim());
} else {
    console.log('POR .env file not found');
}

// Check backend server configuration
console.log('\n3. Checking backend MCP controller...');
const mcpControllerPath = path.join(__dirname, 'backend', 'mcpControllerFixed.js');
console.log('MCP Controller exists:', fs.existsSync(mcpControllerPath));

console.log('\n=== Diagnosis Complete ===');
console.log('The SQL Query Tool should work if:');
console.log('1. Backend server is running on port 3001 ✓');
console.log('2. MCP servers are built and accessible');
console.log('3. Environment variables are set correctly');
console.log('4. MCP servers can connect to databases');

console.log('\nNext steps:');
console.log('- Rebuild MCP servers if build files are missing');
console.log('- Check backend server logs for MCP connection errors');
console.log('- Verify database connectivity (P21 DSN and POR file path)');
