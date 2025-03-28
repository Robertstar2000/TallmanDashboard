import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import ADODB from 'node-adodb';

const execAsync = promisify(exec);

// Helper function to execute PowerShell commands safely
const executePowerShell = async (command: string): Promise<string> => {
  try {
    const { stdout } = await execAsync(`powershell -Command "${command.replace(/"/g, '\\"')}"`);
    return stdout.trim();
  } catch (error: any) {
    console.error('PowerShell execution error:', error);
    throw new Error(`PowerShell execution failed: ${error.message}`);
  }
};

export async function POST(req: Request) {
  try {
    const { tableName, serverType } = await req.json();

    if (!tableName) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
    }

    if (serverType !== 'POR') {
      return NextResponse.json({ error: 'Only POR database is supported' }, { status: 400 });
    }

    // Get the POR file path from environment variable
    const porFilePath = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';

    // Check if the file exists
    if (!fs.existsSync(porFilePath)) {
      return NextResponse.json({ error: 'POR database file not found' }, { status: 404 });
    }

    try {
      // Use PowerShell to query the Access database for column information
      // This is more reliable than node-adodb which has issues with cscript.exe
      const psCommand = `
        $conn = New-Object -ComObject ADODB.Connection
        $conn.Open("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${porFilePath}")
        $rs = New-Object -ComObject ADODB.Recordset
        $rs.Open("SELECT TOP 1 * FROM ${tableName}", $conn)
        $fields = @()
        for ($i = 0; $i -lt $rs.Fields.Count; $i++) {
          $fields += $rs.Fields.Item($i).Name
        }
        $fields | ConvertTo-Json
        $rs.Close()
        $conn.Close()
      `;
      
      const columnsJson = await executePowerShell(psCommand);
      let columns: string[] = [];
      
      try {
        columns = JSON.parse(columnsJson);
      } catch (parseError) {
        // If JSON parsing fails, try to extract column names from the string
        const columnMatches = columnsJson.match(/"([^"]+)"/g);
        if (columnMatches) {
          columns = columnMatches.map(match => match.replace(/"/g, ''));
        }
      }
      
      return NextResponse.json({ columns });
    } catch (error: any) {
      console.error('Error querying table:', error);
      
      // Fallback to a simpler approach if PowerShell fails
      try {
        // Create a connection to the Access database
        const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${porFilePath};`);
        
        // Query to get column information using a different approach
        const query = `SELECT TOP 1 * FROM ${tableName}`;
        const result = await connection.query(query) as any[];
        
        // If we get a result, extract the column names from the first row
        if (result && result.length > 0) {
          const columns = Object.keys(result[0]);
          return NextResponse.json({ columns });
        } else {
          // If no rows, return an empty array
          return NextResponse.json({ columns: [] });
        }
      } catch (fallbackError: any) {
        console.error('Fallback error:', fallbackError);
        return NextResponse.json({ error: `Error querying table: ${error.message}` }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('Error in get-table-columns API:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
