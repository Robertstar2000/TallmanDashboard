/**
 * Start Application Script
 * 
 * This script starts the application with proper error handling
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to start the application
function startApplication() {
  console.log('Starting application...');
  
  // Create cache refresh markers
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  
  // Create cache refresh marker files
  const refreshMarkerPath = path.join(dataDir, 'refresh_required');
  fs.writeFileSync(refreshMarkerPath, timestamp);
  
  const cacheRefreshPath = path.join(dataDir, 'cache-refresh.txt');
  fs.writeFileSync(cacheRefreshPath, timestamp);
  
  const forceRefreshPath = path.join(dataDir, 'force_refresh.json');
  const refreshData = {
    timestamp: timestamp,
    reason: "Application restart"
  };
  fs.writeFileSync(forceRefreshPath, JSON.stringify(refreshData, null, 2));
  
  // Create a Next.js cache reset marker
  const nextCacheResetPath = path.join(process.cwd(), '.next-cache-reset');
  fs.writeFileSync(nextCacheResetPath, timestamp);
  
  console.log('Created cache refresh markers');
  
  // Start the application
  const nextDev = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  nextDev.on('error', (error) => {
    console.error('Error starting application:', error);
  });
  
  nextDev.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error('Application exited with code:', code);
      console.error('Signal:', signal);
    }
  });
  
  console.log('Application started');
}

// Run the function
startApplication();
