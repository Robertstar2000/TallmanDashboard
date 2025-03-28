import { NextResponse } from 'next/server';
import { type ServerConfig } from '@/lib/db/connections';
import { ConnectionManager } from '@/lib/db/connection-manager';

interface QueryExecutionRequest {
  config: ServerConfig;
  query: string;
}

export async function POST(request: Request) {
  try {
    const data: QueryExecutionRequest = await request.json();
    console.log(`Executing query on ${data.config.type}:`, data.config.server);

    // Validate request data
    if (!data.config || !data.config.server || !data.config.database) {
      return NextResponse.json(
        { success: false, message: 'Invalid configuration' },
        { status: 400 }
      );
    }

    if (!data.query) {
      return NextResponse.json(
        { success: false, message: 'Query is required' },
        { status: 400 }
      );
    }

    // Execute the query using ConnectionManager
    const result = await ConnectionManager.executeQuery(data.config, data.query);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing query:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
