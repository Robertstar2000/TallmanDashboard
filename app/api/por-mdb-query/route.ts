import { NextResponse } from 'next/server';
import fs from 'fs';
import { PORDirectReader } from '@/lib/db/por-direct-reader';

export async function POST(request: Request) {
  try {
    const { query, filePath } = await request.json();
    
    if (!query) {
      return NextResponse.json({ 
        success: false, 
        message: 'Query is required' 
      }, { status: 400 });
    }

    // Use the provided file path or default to the environment variable
    const mdbFilePath = filePath || process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';

    // Check if the file exists
    if (!fs.existsSync(mdbFilePath)) {
      return NextResponse.json({ 
        success: false, 
        message: `MDB file not found at ${mdbFilePath}` 
      }, { status: 404 });
    }

    console.log(`Opening MDB file: ${mdbFilePath}`);
    
    // Use our enhanced PORDirectReader class
    const reader = new PORDirectReader(mdbFilePath);
    const connectResult = await reader.connect();
    
    if (!connectResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: connectResult.message
      }, { status: 500 });
    }
    
    try {
      // Execute the query using our enhanced reader
      const result = reader.executeQuery(query);
      
      // Check if there was an error in the result
      if (result && result.length > 0 && result[0].error) {
        return NextResponse.json({ 
          success: false, 
          message: result[0].error,
          query: query
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: true, 
        data: result,
        message: `Query executed successfully`,
        query: query
      });
    } finally {
      // Always close the connection
      reader.close();
    }
  } catch (error: any) {
    console.error('Error executing POR MDB query:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Error executing query: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
