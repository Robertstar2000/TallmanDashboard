import { NextResponse } from 'next/server';

// In a real implementation, this would close the SQL Server connection
// For now, we'll just simulate it

// Track active connections
const activeConnections: Record<string, { 
  createdAt: Date, 
  server: string, 
  database: string 
}> = {};

export async function POST(request: Request) {
  try {
    const { connectionId } = await request.json();
    
    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Missing connectionId parameter' },
        { status: 400 }
      );
    }
    
    // Check if connection exists
    if (activeConnections[connectionId]) {
      // In a real implementation, this would close the actual connection
      console.log(`Closing connection ${connectionId} to ${activeConnections[connectionId].database} on ${activeConnections[connectionId].server}`);
      
      // Remove from active connections
      delete activeConnections[connectionId];
      
      return NextResponse.json({ 
        success: true,
        message: 'Connection closed successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Connection not found or already closed' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error closing connection:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Export for other modules to use
export function trackConnection(id: string, server: string, database: string): void {
  activeConnections[id] = {
    createdAt: new Date(),
    server,
    database
  };
}

export function getActiveConnections(): typeof activeConnections {
  return activeConnections;
}
