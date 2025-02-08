const http = require('http');
const os = require('os');

// Get local IP addresses
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ipAddresses = [];
    
    Object.keys(interfaces).forEach((interfaceName) => {
        interfaces[interfaceName].forEach((details) => {
            if (details.family === 'IPv4' && !details.internal) {
                ipAddresses.push(details.address);
            }
        });
    });
    
    return ipAddresses;
}

const server = http.createServer((req, res) => {
    console.log(`[DEBUG] Received request: 
        Method: ${req.method}
        URL: ${req.url}
        Headers: ${JSON.stringify(req.headers)}
    `);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'running',
        localIPs: getLocalIPs(),
        timestamp: new Date().toISOString(),
        pid: process.pid
    }));
});

const port = 3202;
const host = '0.0.0.0';  // Listen on all network interfaces

server.listen(port, host, () => {
    console.log(`[DEBUG] Server running at:`);
    console.log(`http://localhost:${port}`);
    console.log(`Process ID: ${process.pid}`);
    console.log(`Local IPs: ${getLocalIPs().join(', ')}`);
});

// Detailed error handling
server.on('error', (error) => {
    console.error('[DEBUG] Server Error:', error);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
});

process.on('uncaughtException', (error) => {
    console.error('[DEBUG] Uncaught Exception:', error);
});
