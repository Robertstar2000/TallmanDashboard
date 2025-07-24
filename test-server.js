const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Received request for ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server is running!');});

const PORT = 60005;
server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
