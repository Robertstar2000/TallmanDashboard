// Script to monitor the progress of SQL expression testing
const fs = require('fs');
const path = require('path');

// Configuration
const LOGS_DIR = './logs';

// Function to get the latest log file
function getLatestLogFile() {
  try {
    // Get all files in the logs directory
    const files = fs.readdirSync(LOGS_DIR);
    
    // Filter for SQL test log files
    const logFiles = files.filter(file => file.startsWith('sql-test-log-'));
    
    // Sort by creation time (newest first)
    logFiles.sort((a, b) => {
      const statA = fs.statSync(path.join(LOGS_DIR, a));
      const statB = fs.statSync(path.join(LOGS_DIR, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    });
    
    // Return the newest log file
    if (logFiles.length > 0) {
      return path.join(LOGS_DIR, logFiles[0]);
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting latest log file: ${error.message}`);
    return null;
  }
}

// Function to parse the log file and extract progress information
function parseLogFile(logFile) {
  try {
    // Read the log file
    const content = fs.readFileSync(logFile, 'utf8');
    
    // Split into lines
    const lines = content.split('\n');
    
    // Find the latest progress line
    let progressLine = '';
    let statsLine = '';
    
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('Progress:')) {
        progressLine = lines[i];
      }
      if (lines[i].includes('Success:')) {
        statsLine = lines[i];
        break;
      }
    }
    
    // Extract current progress
    let currentProgress = 'No progress information found';
    if (progressLine) {
      const progressMatch = progressLine.match(/Progress: (\d+)\/(\d+)/);
      if (progressMatch) {
        const current = parseInt(progressMatch[1]);
        const total = parseInt(progressMatch[2]);
        const percentage = Math.round((current / total) * 100);
        currentProgress = `Processing: ${current}/${total} (${percentage}%)`;
      }
    }
    
    // Extract statistics
    let statistics = 'No statistics found';
    if (statsLine) {
      const statsMatch = statsLine.match(/Success: (\d+), Failed: (\d+), Non-Zero: (\d+), Zero: (\d+), Skipped: (\d+), Updated: (\d+)/);
      if (statsMatch) {
        statistics = `Success: ${statsMatch[1]}, Failed: ${statsMatch[2]}, Non-Zero: ${statsMatch[3]}, Zero: ${statsMatch[4]}, Skipped: ${statsMatch[5]}, Updated: ${statsMatch[6]}`;
      }
    }
    
    // Find the latest SQL expression being processed
    let currentExpression = 'No current expression found';
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('Testing SQL expression for:')) {
        currentExpression = lines[i].replace(/\[\d+\/\d+\] Testing SQL expression for: /, '');
        break;
      }
    }
    
    return {
      currentProgress,
      statistics,
      currentExpression
    };
  } catch (error) {
    console.error(`Error parsing log file: ${error.message}`);
    return {
      currentProgress: 'Error parsing log file',
      statistics: 'Error parsing log file',
      currentExpression: 'Error parsing log file'
    };
  }
}

// Main function to monitor progress
function monitorProgress() {
  console.clear();
  console.log('===== SQL Expression Testing Progress Monitor =====');
  
  // Get the latest log file
  const logFile = getLatestLogFile();
  
  if (!logFile) {
    console.log('No log file found. Make sure the SQL testing script is running.');
    return;
  }
  
  console.log(`Monitoring log file: ${logFile}`);
  
  // Parse the log file
  const progress = parseLogFile(logFile);
  
  // Display progress information
  console.log('\nCurrent Progress:');
  console.log(progress.currentProgress);
  
  console.log('\nCurrent Expression:');
  console.log(progress.currentExpression);
  
  console.log('\nStatistics:');
  console.log(progress.statistics);
  
  console.log('\nPress Ctrl+C to exit monitor');
}

// Monitor progress every 5 seconds
console.log('Starting SQL progress monitor...');
monitorProgress();
setInterval(monitorProgress, 5000);
