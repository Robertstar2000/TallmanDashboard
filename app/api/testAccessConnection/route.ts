import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import MDBReader from 'mdb-reader';

// Set the correct POR database path
const POR_DB_PATH = 'C:\\Users\\BobM\\OneDrive\\Desktop\\POR.MDB';

/**
 * API route to test connection to an MS Access database
 * Uses mdb-reader to test the connection instead of PowerShell/ADODB
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { filePath } = body;

    // If no file path is provided, use the default POR database path
    if (!filePath) {
      filePath = process.env.POR_FILE_PATH || POR_DB_PATH;
      console.log(`Using default POR database path: ${filePath}`);
    }

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`MS Access file not found at path: ${filePath}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `MS Access file not found at path: ${filePath}`,
          fileExists: false
        },
        { status: 404 }
      );
    }

    console.log(`MS Access file found at path: ${filePath}`);

    try {
      // Read the database file using mdb-reader
      const buffer = fs.readFileSync(filePath);
      const reader = new MDBReader(buffer);
      
      // Get table names
      const tables = reader.getTableNames();
      console.log(`Found ${tables.length} tables in the database`);
      
      // Get some basic info about the first table if available
      let sampleTableInfo = null;
      if (tables.length > 0) {
        const firstTable = reader.getTable(tables[0]);
        const columns = firstTable.getColumnNames();
        const rowCount = firstTable.rowCount;
        
        sampleTableInfo = {
          name: tables[0],
          columns: columns,
          rowCount: rowCount
        };
      }
      
      // Update the environment variable with the correct path if the connection was successful
      if (filePath !== process.env.POR_FILE_PATH) {
        console.log(`Updating POR_FILE_PATH environment variable to: ${filePath}`);
        process.env.POR_FILE_PATH = filePath;
        
        // Try to update the .env.local file
        try {
          const envPath = path.join(process.cwd(), '.env.local');
          let envContent = '';
          
          if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
            
            // Check if POR_FILE_PATH already exists
            if (envContent.includes('POR_FILE_PATH=')) {
              // Update the existing value
              envContent = envContent.replace(
                /POR_FILE_PATH=.*/,
                `POR_FILE_PATH=${filePath}`
              );
            } else {
              // Add the new variable
              envContent += `\nPOR_FILE_PATH=${filePath}`;
            }
          } else {
            // Create a new .env.local file
            envContent = `POR_FILE_PATH=${filePath}`;
          }
          
          // Write the updated content
          fs.writeFileSync(envPath, envContent);
          console.log('Updated .env.local file with POR_FILE_PATH');
        } catch (envError) {
          console.error('Error updating .env.local file:', envError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: "Successfully connected to MS Access database using mdb-reader",
        tables: tables,
        sampleTableInfo: sampleTableInfo,
        filePath: filePath
      });
    } catch (dbError) {
      console.error('Error connecting to database:', dbError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Error connecting to database: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
          fileExists: true
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing Access connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Error testing Access connection: ${error instanceof Error ? error.message : String(error)}`,
        fileExists: false
      },
      { status: 500 }
    );
  }
}
