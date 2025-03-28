import { NextResponse } from 'next/server';
import { initializeDatabases, checkDatabaseConnections } from '@/lib/db/initialize';

export async function GET() {
  try {
    console.log('Starting system initialization...');
    
    // Initialize all databases
    const initResult = await initializeDatabases();
    
    if (!initResult.success) {
      console.error('Database initialization failed:', initResult.message);
      return NextResponse.json(
        { 
          error: 'Database initialization failed', 
          message: initResult.message 
        },
        { status: 500 }
      );
    }
    
    // Check connections after initialization
    const connectionStatus = await checkDatabaseConnections();
    
    return NextResponse.json({
      success: true,
      message: 'System initialized successfully',
      databases: connectionStatus
    });
  } catch (error) {
    console.error('System initialization error:', error);
    return NextResponse.json(
      { 
        error: 'System initialization failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
