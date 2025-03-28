import { NextResponse } from 'next/server';
import { type ServerConfig } from '@/lib/db/connections';

interface ConnectionSaveRequest {
  type: 'p21' | 'por';
  config: ServerConfig;
}

export async function POST(request: Request) {
  try {
    const data: ConnectionSaveRequest = await request.json();
    console.log(`Saving connection configuration for ${data.type}:`, data.config.server);

    // Validate request data
    if (!data.type || !['p21', 'por'].includes(data.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid server type' },
        { status: 400 }
      );
    }

    if (!data.config || !data.config.server || !data.config.database) {
      return NextResponse.json(
        { success: false, message: 'Invalid configuration' },
        { status: 400 }
      );
    }

    // In a real implementation, we would save this to a database
    // Since we're keeping configurations in localStorage, the client will handle saving
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully saved configuration for ${data.type}`,
      details: {
        server: data.config.server,
        database: data.config.database,
        savedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error saving connection configuration:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}
