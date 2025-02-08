const http = require('http');
const fs = require('fs');
const path = require('path');
console.log("Node application is starting...");

// Set absolute working directory
const workDir = 'C:\\inetpub\\wwwroot\\TallmanDashboard';
process.chdir(workDir);

// Create log directory if it doesn't exist
const logDir = path.join(workDir, 'iisnode');
try {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
} catch (err) {
    console.error('Error creating log directory:', err);
}

// Log errors to a file we can access
function logError(error) {
    const logFile = path.join(workDir, 'error.log');
    const errorMessage = `${new Date().toISOString()} - ${error.stack || error}\n`;
    
    try {
        fs.appendFileSync(logFile, errorMessage);
    } catch (e) {
        // Can't write to log file
        console.error('Failed to write to log:', e);
    }
}

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    logError(err);
    console.error('Uncaught Exception:', err);
});

try {
    // Log startup information
    console.log('Starting server...');
    console.log('Current directory:', process.cwd());
    console.log('Node version:', process.version);
    console.log('Environment:', process.env.NODE_ENV);

    const server = http.createServer((req, res) => {
        try {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Node.js is working!\nWorking Directory: ${process.cwd()}\nTime: ${new Date().toISOString()}`);
        } catch (err) {
            logError(err);
            res.writeHead(500);
            res.end('Server Error');
        }
    });

    const port = process.env.PORT || 3200;
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`Working directory: ${process.cwd()}`);
        // Try to write to a log file to test permissions
        logError(new Error('Server started successfully'));
    });

    // Error handling for the server
    server.on('error', (err) => {
        logError(err);
        console.error('Server error:', err);
    });
} catch (err) {
    logError(err);
    console.error('Failed to start server:', err);
}
