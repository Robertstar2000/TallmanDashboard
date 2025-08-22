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
