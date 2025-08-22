# Install MCP Server Dependencies and Test Connections
Write-Host "Installing MCP server dependencies..." -ForegroundColor Green

# Navigate to mcp-servers directory
cd "C:\Users\BobM\Desktop\TallmanDashboard\mcp-servers"

# Install dependencies
npm install

Write-Host "`nDependencies installed. Testing P21 MCP server..." -ForegroundColor Yellow

# Test P21 MCP server
Write-Host "Starting P21 MCP server test..." -ForegroundColor Blue
$env:P21_DSN = "P21Live"
$env:P21_TRUSTED_CONNECTION = "true"

# Create a simple test script for P21
$p21TestScript = @"
const { spawn } = require('child_process');

const server = spawn('node', ['p21-server.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env, P21_DSN: 'P21Live', P21_TRUSTED_CONNECTION: 'true' }
});

// Send test connection request
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'test_p21_connection',
    arguments: {}
  }
};

server.stdin.write(JSON.stringify(testRequest) + '\n');

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  if (output.includes('"id":1')) {
    console.log('P21 Test Result:', output);
    server.kill();
    process.exit(0);
  }
});

setTimeout(() => {
  console.log('P21 test timeout');
  server.kill();
  process.exit(1);
}, 10000);
"@

$p21TestScript | Out-File -FilePath "test-p21.js" -Encoding UTF8

Write-Host "Testing P21 connection..." -ForegroundColor Cyan
node test-p21.js

Write-Host "`nTesting POR MCP server..." -ForegroundColor Yellow

# Test POR MCP server
$env:POR_DB_PATH = "\\ts03\POR\POR.MDB"

# Create a simple test script for POR
$porTestScript = @"
const { spawn } = require('child_process');

const server = spawn('node', ['por-server.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env, POR_DB_PATH: '\\\\ts03\\POR\\POR.MDB' }
});

// Send test connection request
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'test_por_connection',
    arguments: {}
  }
};

server.stdin.write(JSON.stringify(testRequest) + '\n');

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  if (output.includes('"id":1')) {
    console.log('POR Test Result:', output);
    server.kill();
    process.exit(0);
  }
});

setTimeout(() => {
  console.log('POR test timeout');
  server.kill();
  process.exit(1);
}, 10000);
"@

$porTestScript | Out-File -FilePath "test-por.js" -Encoding UTF8

Write-Host "Testing POR connection..." -ForegroundColor Cyan
node test-por.js

Write-Host "`nMCP server testing complete!" -ForegroundColor Green