const { execSync } = require('child_process');
const path = require('path');

// Ensure we're in the project directory
process.chdir(__dirname);

try {
    // Build the Next.js application
    console.log('Building Next.js application...');
    execSync('npm run build', { stdio: 'inherit' });

    // Start the Next.js application
    console.log('Starting Next.js application...');
    const nextStart = execSync('npm run start', { 
        stdio: 'inherit',
        env: { 
            ...process.env, 
            PORT: process.env.PORT || '5500' 
        }
    });
} catch (error) {
    console.error('Error starting Next.js application:', error);
    process.exit(1);
}
