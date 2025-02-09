const express = require('express');
const next = require('next');
const path = require('path');
const fs = require('fs');

console.log("Node application is starting...");

// Set absolute working directory
const workDir = 'C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard';
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
        console.error('Failed to write to log:', e);
    }
}

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';

// Initialize Next.js
const dev = false; // Force production mode
const nextApp = next({ dev, dir: workDir });
const handle = nextApp.getRequestHandler();

// Create Express app
const app = express();

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    logError(err);
    next(err);
});

// Serve static files from the .next directory
app.use('/_next', express.static(path.join(workDir, '.next')));

// Prepare and start the server
nextApp.prepare()
    .then(() => {
        // Log all requests
        app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            next();
        });

        // Handle all routes with Next.js
        app.all('*', (req, res) => {
            return handle(req, res);
        });

        // Start server
        const port = process.env.PORT || 5000;
        const server = app.listen(port, '0.0.0.0', (err) => {
            if (err) {
                console.error('Failed to start server:', err);
                logError(err);
                return;
            }
            console.log(`Server is running on http://0.0.0.0:${port}`);
            console.log('Try accessing:');
            console.log(`  - http://localhost:${port}`);
            console.log(`  - http://127.0.0.1:${port}`);
            logError(`Server started successfully on port ${port}`);
        });

        // Add error handler for the server
        server.on('error', (err) => {
            console.error('Server error:', err);
            logError(err);
        });
    })
    .catch((err) => {
        console.error('Error during Next.js initialization:', err);
        logError(err);
    });
