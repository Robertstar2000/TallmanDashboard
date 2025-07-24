// Simple HTTP server to test port binding
import http from 'http';

const PORT = 60005;

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Server is working on port 60005');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

// Keep the process running for 5 minutes
setTimeout(() => {
  console.log('Test server shutting down');
  server.close();
}, 5 * 60 * 1000);
