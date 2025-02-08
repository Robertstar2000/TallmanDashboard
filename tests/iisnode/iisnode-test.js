const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', '..', 'iisnode');
const logFile = path.join(logDir, 'iisnode-test.log');

try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Write test log
    fs.writeFileSync(logFile, `Test log created at ${new Date().toISOString()}\n`);
    
    // Write environment info
    fs.appendFileSync(logFile, `Node version: ${process.version}\n`);
    fs.appendFileSync(logFile, `Current directory: ${process.cwd()}\n`);
    fs.appendFileSync(logFile, `User: ${process.env.USERNAME}\n`);
    
    console.log('Test successful - check iisnode/iisnode-test.log');
} catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
}
