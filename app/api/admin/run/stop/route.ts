import { NextResponse } from 'next/server';
import { BackgroundWorker } from '../backgroundWorker';
import { executionState } from '../state';

// Reference to the workerRunning variable in the parent route
declare let workerRunning: boolean;
// Reference to the lastRunTimestamp variable in the parent route
declare let lastRunTimestamp: number;

export async function POST() {
  try {
    console.log('STOP API: Received request to stop query execution');
    
    const worker = BackgroundWorker.getInstance();
    
    // Stop the worker
    worker.stop();
    
    // Reset execution state
    executionState.status = 'idle';
    executionState.activeRow = null;
    
    // Try to set the global workerRunning flag to false
    try {
      // This will work if the variable is in the same scope
      workerRunning = false;
      // Update the lastRunTimestamp to prevent race conditions
      lastRunTimestamp = Date.now();
      console.log('STOP API: Set workerRunning flag to false and updated timestamp');
    } catch (error) {
      console.warn('STOP API: Could not directly set workerRunning flag, relying on worker state');
    }
    
    // Force a small delay to ensure the worker has time to stop
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('STOP API: Worker stopped, returning response');
    
    return NextResponse.json({ 
      status: 'stopped',
      executionState
    });
  } catch (error) {
    console.error('STOP API: Error stopping query execution:', error);
    
    // Even if there's an error, try to reset the state
    try {
      executionState.status = 'idle';
      executionState.activeRow = null;
      workerRunning = false;
    } catch (stateError) {
      console.error('STOP API: Error resetting state:', stateError);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to stop query execution',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
