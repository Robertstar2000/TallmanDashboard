import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get the file path from the query parameter
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }
    
    // Normalize the path to prevent directory traversal attacks
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // Get the absolute path to the file
    const absolutePath = path.join(process.cwd(), normalizedPath);
    
    // Check if the file exists
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    
    // Return the file content
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error serving documentation file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
