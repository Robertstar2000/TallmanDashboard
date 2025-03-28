/**
 * Verification script for the background worker sequencing
 * This script simulates the API endpoint that triggers the background worker
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

// Log file path
const logFile = path.join(__dirname, 'background-worker-verification.log');

// Helper function to log messages
async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  
  try {
    // Append to log file
    fs.appendFileSync(logFile, logMessage);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

// Initialize log file
fs.writeFileSync(logFile, `=== Background Worker Verification ===\nStarted at: ${new Date().toISOString()}\n\n`);

// Mock data for testing
const testData = [
  { 
    id: '1', 
    chartName: 'Key Metrics', 
    variableName: 'Total Orders',
    serverName: 'P21',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())"
  },
  { 
    id: '2', 
    chartName: 'Key Metrics', 
    variableName: 'Open Orders',
    serverName: 'P21',
    sqlExpression: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  { 
    id: '3', 
    chartName: 'Key Metrics', 
    variableName: 'Open Orders 2',
    serverName: 'P21',
    sqlExpression: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'"
  },
  { 
    id: '4', 
    chartName: 'Key Metrics', 
    variableName: 'Daily Revenue',
    serverName: 'P21',
    sqlExpression: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  { 
    id: '5', 
    chartName: 'Key Metrics', 
    variableName: 'Open Invoices',
    serverName: 'P21',
    sqlExpression: "SELECT COUNT(*) as value FROM invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  }
];

// Mock execution state
const executionState = {
  status: 'idle',
  activeRow: null,
  error: null,
  updatedData: [],
  setActiveRow(rowId) {
    this.activeRow = rowId;
    log(`Active row set to: ${rowId}`);
  },
  setStatus(status) {
    this.status = status;
    log(`Status changed to: ${status}`);
  }
};

// Mock background worker class that simulates the actual implementation
class BackgroundWorkerSimulation {
  constructor() {
    this.isRunning = false;
    this.abortController = null;
    this.isProduction = false;
  }

  async run(data, isProduction) {
    // Prevent multiple runs
    if (this.isRunning) {
      await log('Background worker is already running');
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
    
    await log(`Starting to process ${processData.length} rows in ${isProduction ? 'production' : 'test'} mode`);
    
    try {
      // Start processing - we don't await here to allow the API to return immediately
      this.processRows(processData, isProduction).catch(async (error) => {
        await log(`Error in background processing: ${error.message}`);
        executionState.setStatus('error');
        this.isRunning = false;
      });
      
      await log('Run method completed, processing continues in background');
    } catch (error) {
      await log(`Synchronous error in run method: ${error.message}`);
      executionState.setStatus('error');
      this.isRunning = false;
    }
  }
  
  async processRows(data, isProduction) {
    const mode = isProduction ? 'production' : 'test';
    
    try {
      let currentIndex = 0;
      
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
          await new Promise(resolve => setTimeout(resolve, 0));
          return processNextRow();
        }
        
        // Update active row
        executionState.setActiveRow(row.id);
        await log(`Processing row ${currentIndex+1}/${data.length}: ${row.chartName} - ${row.variableName} (ID: ${row.id})`);
        
        try {
          // Simulate processing the row
          const updatedRow = await this.simulateProcessRow(row, isProduction, mode);
          await log(`Successfully processed row ${row.id} with value: ${updatedRow.value}`);
          
          // Move to next row
          currentIndex++;
          
          // Schedule next row processing with a delay
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between rows for testing
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
  
  // Simulate processing a row
  async simulateProcessRow(row, isProduction, mode) {
    await log(`Simulating processing for row ${row.id} (${row.variableName}) in ${mode} mode`);
    
    // Simulate processing time
    const processingTime = 500 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate occasional errors
    if (row.id === '3' && Math.random() < 0.3) {
      throw new Error('Simulated error for testing error handling');
    }
    
    // Generate a random value for testing
    const value = Math.floor(Math.random() * 1000).toString();
    
    return {
      ...row,
      value,
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Stop processing
  stop() {
    if (!this.isRunning) {
      log('Worker is not running, nothing to stop');
      return;
    }
    
    if (this.abortController) {
      this.abortController.abort();
    }
    
    this.isRunning = false;
    executionState.setStatus('idle');
    executionState.setActiveRow(null);
    log('Worker stopped');
  }
}

// Run verification tests
async function runVerificationTests() {
  await log('=== Starting Background Worker Verification ===');
  
  const worker = new BackgroundWorkerSimulation();
  
  // Test 1: Run in production mode
  await log('\n=== Test 1: Run in Production Mode ===');
  await worker.run(testData, true);
  
  // Wait for processing to complete
  await new Promise(resolve => {
    const checkStatus = () => {
      if (executionState.status === 'complete' || executionState.status === 'error') {
        resolve();
      } else {
        setTimeout(checkStatus, 1000);
      }
    };
    setTimeout(checkStatus, 1000);
  });
  
  // Test 2: Verify stop functionality
  await log('\n=== Test 2: Verify Stop Functionality ===');
  await worker.run(testData, false);
  
  // Wait a bit and then stop
  await new Promise(resolve => setTimeout(resolve, 3000));
  worker.stop();
  
  await log('\n=== Verification Tests Completed ===');
}

// Run the verification tests
runVerificationTests().catch(error => {
  console.error('Verification test error:', error);
});
