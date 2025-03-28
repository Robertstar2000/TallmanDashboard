import { NextRequest, NextResponse } from 'next/server';
import { PORDirectReader } from '@/lib/db/por-direct-reader';
import { ServerConfig } from '@/lib/db/connections';
import fs from 'fs';

/**
 * API route for executing queries against the POR database using direct access
 * This avoids the need for ODBC or the Microsoft Access Database Engine
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, sql } = body;

    // Validate required parameters
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: filePath' },
        { status: 400 }
      );
    }

    if (!sql) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: sql' },
        { status: 400 }
      );
    }

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: `MS Access file not found at path: ${filePath}` },
        { status: 404 }
      );
    }

    // Create a server config
    const config: ServerConfig = {
      type: 'POR',
      server: 'local',
      database: 'POR',
      filePath: filePath
    };

    // Create a POR direct reader
    const reader = new PORDirectReader(config);

    // Connect to the database
    const connectionResult = await reader.connect();
    if (!connectionResult.success) {
      return NextResponse.json(
        { success: false, error: connectionResult.message },
        { status: 500 }
      );
    }

    // Execute the query
    try {
      const result = await reader.executeQuery(sql);
      
      // Close the connection
      reader.close();
      
      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      // Close the connection
      reader.close();
      
      return NextResponse.json(
        { success: false, error: `Error executing query: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
