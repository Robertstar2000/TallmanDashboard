import { NextResponse } from 'next/server';
import { executionState } from '../state';
import { BackgroundWorker } from '../backgroundWorker';

export async function POST() {
  try {
    // First try to stop any running worker
    const worker = BackgroundWorker.getInstance();
    worker.stop();
    
    // Reset the execution state
    executionState.status = 'idle';
    executionState.activeRow = null;
    executionState.error = null;
    
    // Keep the updated data for reference, but mark as complete
    
    return NextResponse.json({ status: 'reset' });
  } catch (error) {
    console.error('Error resetting query execution state:', error);
    return NextResponse.json(
      { error: 'Failed to reset query execution state' },
      { status: 500 }
    );
  }
}
