import { NextResponse } from 'next/server';
import { type ServerConfig } from '@/lib/db/connections';
import { ConnectionManager } from '@/lib/db/connection-manager';

interface ConnectionTestRequest {
  config: ServerConfig;
}

export async function POST(request: Request) {
  try {
    const data: ConnectionTestRequest = await request.json();
    console.log(`Testing connection for ${data.config.type || 'unknown'}:`, data.config.type === 'POR' ? 'MS Access' : data.config.server);

    // Validate request data based on connection type
    if (data.config.type === 'POR') {
      // For MS Access (POR), we only need filePath
      if (!data.config || !data.config.filePath) {
        return NextResponse.json(
          { success: false, message: 'File path is required for MS Access connections' },
          { status: 400 }
        );
      }

      try {
        // Test the MS Access connection using the static method
        const result = await ConnectionManager.testAccessConnection(data.config);
        
        return NextResponse.json(result);
      } catch (error) {
        console.error('Error testing MS Access connection:', error);
        return NextResponse.json(
          { 
            success: false, 
            message: `Error testing MS Access connection: ${error instanceof Error ? error.message : String(error)}` 
          },
          { status: 500 }
        );
      }
    } else {
      // For SQL Server (P21), we need server and database
      if (!data.config || !data.config.server || !data.config.database) {
        return NextResponse.json(
          { success: false, message: 'Invalid SQL Server configuration: Server and database are required' },
          { status: 400 }
        );
      }

      // Use ConnectionManager to test the connection
      const result = await ConnectionManager.testConnection(data.config);

      // Return appropriate details based on connection type
      return NextResponse.json({
        ...result,
        details: result.success ? {
          server: data.config.server,
          database: data.config.database,
          connectedAt: new Date().toISOString()
        } : undefined
      });
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
