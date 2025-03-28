import { NextResponse } from 'next/server';
import { executionState } from '../state';
import { BackgroundWorker } from '../backgroundWorker';

// Reference to the workerRunning variable in the parent route
declare const workerRunning: boolean;
// Reference to the lastRunTimestamp variable in the parent route
declare const lastRunTimestamp: number;

export async function GET() {
  // Get the worker instance to check its internal state
  const worker = BackgroundWorker.getInstance();
  
  // Add more detailed information to the response
  console.log(`STATUS API: Current execution state: ${executionState.status}, activeRow: ${executionState.activeRow || 'none'}`);
  
  // Check if there's any data to report
  const hasData = executionState.updatedData && executionState.updatedData.length > 0;
  
  // Include the worker running state if available
  let isWorkerRunning = false;
  try {
    isWorkerRunning = workerRunning;
    console.log(`STATUS API: Worker running flag from parent scope: ${isWorkerRunning}`);
  } catch (error) {
    // If we can't access the workerRunning variable, use the execution state
    isWorkerRunning = executionState.status === 'running';
    console.log(`STATUS API: Could not access worker running flag, using execution state: ${isWorkerRunning}`);
  }
  
  // Get the last run timestamp if available
  let lastRun = null;
  try {
    lastRun = lastRunTimestamp ? new Date(lastRunTimestamp).toISOString() : null;
  } catch (error) {
    console.log(`STATUS API: Could not access lastRunTimestamp`);
  }
  
  // Check if any rows have been updated recently (within the last 10 seconds)
  const recentlyUpdated = executionState.updatedData?.some(row => {
    if (!row.lastUpdated) return false;
    const lastUpdated = new Date(row.lastUpdated).getTime();
    const now = Date.now();
    return (now - lastUpdated) < 10000; // 10 seconds
  });
  
  // If we have recently updated rows but the worker is not running, it might be a race condition
  if (recentlyUpdated && !isWorkerRunning && executionState.status !== 'idle') {
    console.log(`STATUS API: Detected recently updated rows but worker is not running, possible race condition`);
    // Update the execution state to reflect that it's still running
    executionState.status = 'running';
  }
  
  // Calculate cycle information
  let cycleInfo = null;
  if (executionState.activeRow && executionState.updatedData?.length > 0) {
    const totalRows = executionState.updatedData.length;
    const currentRowIndex = executionState.updatedData.findIndex(row => row.id === executionState.activeRow);
    
    if (currentRowIndex !== -1) {
      cycleInfo = {
        currentRow: currentRowIndex + 1,
        totalRows,
        percentComplete: Math.round((currentRowIndex + 1) / totalRows * 100),
        isCycleComplete: currentRowIndex === totalRows - 1
      };
    }
  }
  
  return NextResponse.json({
    ...executionState,
    isWorkerRunning,
    timestamp: new Date().toISOString(),
    lastRun,
    hasData,
    recentlyUpdated,
    cycleInfo,
    mode: 'continuous' // Indicate that we're in continuous execution mode
  });
}
