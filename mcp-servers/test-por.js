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
