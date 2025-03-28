/**
 * Test script to diagnose background run sequencing issues
 * This script simulates the background worker's row processing to identify sequencing problems
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

// Mock execution state to track progress
const executionState = {
  status: 'idle',
  activeRow: null,
  error: null,
  updatedData: [],
  setStatus(status) {
    this.status = status;
    console.log(`Status changed to: ${status}`);
  },
  setActiveRow(rowId) {
    this.activeRow = rowId;
    console.log(`Active row set to: ${rowId}`);
  }
};

// Sample data for testing
const testData = [
  { id: '1', name: "Total Orders", value: "0", serverName: 'P21' },
  { id: '2', name: "Open Orders", value: "0", serverName: 'P21' },
  { id: '3', name: "Open Orders 2", value: "0", serverName: 'P21' },
  { id: '4', name: "Daily Revenue", value: "0", serverName: 'P21' },
  { id: '5', name: "Open Invoices", value: "0", serverName: 'P21' },
  { id: '6', name: "Orders Backlogged", value: "0", serverName: 'P21' },
  { id: '7', name: "Total Monthly Sales", value: "0", serverName: 'P21' }
];

// Log file for diagnostics
const logFile = path.join(__dirname, 'background-sequencing-log.txt');
let logContent = `=== Background Sequencing Test ===\nStarted at: ${new Date().toISOString()}\n\n`;

// Helper function to append to log
async function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  logContent += formattedMessage;
  
  try {
    await writeFileAsync(logFile, logContent);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

// Mock background worker class
class BackgroundWorkerTest {
  constructor() {
    this.isRunning = false;
    this.abortController = null;
    this.isProduction = false;
    this.testMode = false;
  }

  async run(data, isProduction) {
    await log(`Starting to process ${data.length} rows in ${isProduction ? 'production' : 'test'} mode`);
    
    if (this.isRunning) {
      await log('Already running, cannot start another run');
      return;
    }
    
    this.isRunning = true;
    executionState.setStatus('running');
    this.isProduction = isProduction;
    
    // Create a new AbortController for this run
    this.abortController = new AbortController();
    
    // Create a deep copy of the data
    const processData = JSON.parse(JSON.stringify(data));
    executionState.updatedData = processData;
    
    try {
      await this.processRows(processData, isProduction);
    } catch (error) {
      await log(`Error in background processing: ${error.message}`);
      executionState.setStatus('error');
      this.isRunning = false;
    }
  }
  
  async processRows(data, isProduction) {
    const mode = isProduction ? 'production' : 'test';
    await log(`Processing ${data.length} rows in ${mode} mode`);
    
    try {
      let currentIndex = 0;
      
      // Use a promise-based approach for better diagnostics
      const processNextRow = async () => {
        // Check if processing should stop
        if (!this.isRunning || (this.abortController && this.abortController.signal.aborted)) {
          await log('Processing aborted or stopped');
          executionState.setStatus('idle');
          executionState.setActiveRow(null);
          this.isRunning = false;
          return;
        }
        
        // Check if we've processed all rows
        if (currentIndex >= data.length) {
          await log('Finished processing all rows');
          executionState.setStatus('complete');
          executionState.setActiveRow(null);
          this.isRunning = false;
          return;
        }
        
        const row = data[currentIndex];
        
        // Ensure row has a valid ID
        if (!row.id) {
          await log(`Row missing ID, skipping: ${JSON.stringify(row)}`);
          currentIndex++;
          // Continue to next row immediately
          return processNextRow();
        }
        
        // Update active row
        executionState.setActiveRow(row.id);
        await log(`Processing row ${currentIndex+1}/${data.length}: ${row.name} (ID: ${row.id})`);
        
        try {
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Simulate row processing
          const updatedRow = await this.mockProcessRow(row, isProduction, mode);
          await log(`Successfully processed row ${row.id} with value: ${updatedRow.value}`);
          
          // Move to next row
          currentIndex++;
          
          // Schedule next row processing with a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          return processNextRow();
        } catch (err) {
          await log(`Error processing row ${row.id}: ${err.message}`);
          
          // Update the row with error information
          const errorRow = {
            ...row,
            value: "0", // Always use 0 for error cases
            error: err.message,
            errorType: 'other'
          };
          
          // Move to next row
          currentIndex++;
          
          // Schedule next row processing with a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          return processNextRow();
        }
      };
      
      // Start processing the first row
      await processNextRow();
      
    } catch (error) {
      await log(`Error in processRows: ${error.message}`);
      executionState.setStatus('error');
      this.isRunning = false;
    }
  }
  
  // Mock row processing
  async mockProcessRow(row, isProduction, mode) {
    await log(`Mock processing row ${row.id} in ${mode} mode`);
    
    // Simulate different processing times and occasional errors
    const processingTime = 500 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate errors for specific rows to test error handling
    if (row.id === '3' && Math.random() < 0.3) {
      throw new Error('Simulated random error for testing');
    }
    
    // Update the row with a new value
    return {
      ...row,
      value: (parseInt(row.id) * 10).toString(),
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Stop processing
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    if (this.abortController) {
      this.abortController.abort();
    }
    
    this.isRunning = false;
    executionState.setStatus('idle');
    executionState.setActiveRow(null);
  }
}

// Test both recursive and promise-based approaches
async function runTests() {
  await log('=== Starting Background Sequencing Tests ===');
  
  // Test the background worker
  const worker = new BackgroundWorkerTest();
  
  await log('\n=== Testing Promise-based Sequencing ===');
  await worker.run(testData, true);
  
  await log('\n=== Tests Completed ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
});
