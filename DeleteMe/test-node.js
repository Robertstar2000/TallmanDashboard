const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a log file
const logFile = path.join(__dirname, 'node-test.log');
fs.writeFileSync(logFile, `Test started at ${new Date().toISOString()}\n`);

// Create HTTP server
const server = http.createServer((req, res) => {
    const message = `Request received: ${req.method} ${req.url}\n`;
    fs.appendFileSync(logFile, message);
    
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Node.js test server is running!\n');
});

// Log process info
fs.appendFileSync(logFile, `Process ID: ${process.pid}\n`);
fs.appendFileSync(logFile, `Working directory: ${process.cwd()}\n`);
fs.appendFileSync(logFile, `Node version: ${process.version}\n`);

// Listen on port 3201 (different from main app)
const port = 3201;
server.listen(port, () => {
    fs.appendFileSync(logFile, `Server listening on port ${port}\n`);
});
