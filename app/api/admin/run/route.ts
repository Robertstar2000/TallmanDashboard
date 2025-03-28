import { NextResponse } from 'next/server';
import { executionState } from './state';
import { BackgroundWorker } from './backgroundWorker';

// Global flag to track if worker is already running
let workerRunning = false;
// Timestamp of the last run request to handle race conditions
let lastRunTimestamp = 0;

export async function POST(request: Request) {
  try {
    const { data } = await request.json();
    
    console.log(`RUN API: Received request to run queries with ${data?.length || 0} rows`);
    
    // Get singleton instance of background worker
    const worker = BackgroundWorker.getInstance();
    
    // Check if worker is already running
    if (workerRunning) {
      console.log('RUN API: Worker is already running, returning current state');
      return NextResponse.json({ 
        status: 'already_running', 
        executionState 
      });
    }
    
    // Generate a timestamp for this run request
    const currentRunTimestamp = Date.now();
    lastRunTimestamp = currentRunTimestamp;
    
    // Reset execution state
    executionState.status = 'running';
    executionState.activeRow = null;
    executionState.error = null;
    
    // Set global flag to true
    workerRunning = true;
    
    // Start processing in background
    // This will continue even if the client disconnects
    worker.run(data)
      .then(() => {
        console.log('RUN API: Background worker completed successfully');
        // Only update the state if this was the last run request
        if (lastRunTimestamp === currentRunTimestamp) {
          workerRunning = false;
        }
      })
      .catch(error => {
        console.error('RUN API: Error in background worker:', error);
        executionState.status = 'error';
        executionState.error = error instanceof Error ? error.message : 'Unknown error';
        // Only update the state if this was the last run request
        if (lastRunTimestamp === currentRunTimestamp) {
          workerRunning = false;
        }
      });

    console.log('RUN API: Background worker started, returning response');
    
    return NextResponse.json({ 
      status: 'started',
      executionState
    });
  } catch (error) {
    console.error('RUN API: Error starting query execution:', error);
    workerRunning = false;
    return NextResponse.json(
      { error: 'Failed to start query execution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Update workerRunning flag based on execution state
  workerRunning = executionState.status === 'running';
  
  console.log(`RUN API GET: Current execution state: ${executionState.status}, workerRunning: ${workerRunning}`);
  
  return NextResponse.json({
    ...executionState,
    isWorkerRunning: workerRunning
  });
}
