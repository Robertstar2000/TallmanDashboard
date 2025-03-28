import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getMode } from '@/lib/state/modeState';
import { executeTestQuery } from '@/lib/db/test-db';
import { getServerConfig } from '@/lib/db/connections';
import { SqlServerClient } from '@/lib/db/sqlserver';
import { executeServerQuery } from '@/lib/db/server-operations';
import { generateAccessSql } from '@/lib/db/access-sql-generator';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { exec } from 'child_process';

// Convert exec to Promise-based
const execPromise = util.promisify(exec);

// Connection pool to reuse connections
const connectionPool: { [key: string]: SqlServerClient } = {};

// SQL validation function
function validateSql(sql: string): boolean {
  // Basic validation to prevent SQL injection
  const upperSql = sql.toUpperCase();
  
  // Only allow SELECT statements
  if (!upperSql.trim().startsWith('SELECT')) {
    console.warn('SQL Validation: Query must start with SELECT');
    return false;
  }
  
  // Disallow multiple statements
  if (upperSql.includes(';')) {
    console.warn('SQL Validation: Multiple statements are not allowed');
    return false;
  }
  
  // Disallow dangerous keywords
  if (upperSql.includes('DROP') || upperSql.includes('DELETE') || 
      upperSql.includes('UPDATE') || upperSql.includes('INSERT') || 
      upperSql.includes('CREATE') || upperSql.includes('ALTER') ||
      upperSql.includes('TRUNCATE') || upperSql.includes('EXEC')) {
    console.warn('SQL Validation: Dangerous keywords detected');
    return false;
  }
  
  return true;
}

/**
 * Execute a query against MS Access database using PowerShell
 */
async function executeAccessQuery(sql: string, filePath: string): Promise<any> {
  try {
    // Create a temporary PowerShell script to execute the query
    const scriptPath = path.join(process.cwd(), 'temp', 'access-query.ps1');
    const scriptDir = path.dirname(scriptPath);
    
    // Ensure the directory exists
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }
    
    // Create the PowerShell script content
    const scriptContent = `
# PowerShell script to query MS Access database
param(
    [string]$filePath,
    [string]$sql
)

try {
    # Create connection to the Access database
    $conn = New-Object -ComObject ADODB.Connection
    $connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$filePath;Persist Security Info=False;"
    $conn.Open($connString)

    # Create recordset
    $rs = New-Object -ComObject ADODB.Recordset
    $rs.Open($sql, $conn)

    # Convert recordset to JSON
    $results = @()
    if (-not $rs.EOF) {
        $rs.MoveFirst()
        while (-not $rs.EOF) {
            $row = @{}
            for ($i = 0; $i -lt $rs.Fields.Count; $i++) {
                $fieldName = $rs.Fields.Item($i).Name
                $fieldValue = $rs.Fields.Item($i).Value
                $row[$fieldName] = $fieldValue
            }
            $results += $row
            $rs.MoveNext()
        }
    }

    # Close recordset and connection
    $rs.Close()
    $conn.Close()

    # Output results as JSON
    $results | ConvertTo-Json -Depth 10
}
catch {
    Write-Error "Error: $_"
    exit 1
}
`;
    
    // Write the script to a file
    fs.writeFileSync(scriptPath, scriptContent);
    
    // Execute the PowerShell script
    const { stdout, stderr } = await execPromise(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -filePath "${filePath}" -sql "${sql.replace(/"/g, '\\"')}"`);
    
    if (stderr) {
      console.error('PowerShell error:', stderr);
      throw new Error(`Error executing Access query: ${stderr}`);
    }
    
    try {
      // Parse the JSON output
      return JSON.parse(stdout);
    } catch (parseError) {
      console.error('Error parsing PowerShell output:', parseError);
      throw new Error(`Error parsing Access query results: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  } catch (error) {
    console.error('Error executing Access query:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    console.log('API: Received executeQuery request');
    
    // Parse the request body
    const body = await request.json();
    const { server, sql, connectionId: requestConnectionId, testMode, tableName } = body;
    
    // Mutable connection ID
    let connectionId = requestConnectionId;
    
    // Validate required parameters
    if (!server || !sql) {
      console.error('API: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate server parameter
    if (server !== 'P21' && server !== 'POR') {
      console.error(`API: Invalid server parameter: ${server}`);
      return NextResponse.json(
        { error: 'Invalid server parameter. Must be P21 or POR' },
        { status: 400 }
      );
    }
    
    // Basic SQL validation
    if (!validateSql(sql)) {
      console.error(`API: Invalid SQL expression: ${sql}`);
      return NextResponse.json(
        { error: 'Invalid SQL expression. Only SELECT statements are allowed.' },
        { status: 400 }
      );
    }
    
    console.log(`API: Executing query on ${server}: ${sql}`);
    console.log(`API: testMode parameter: ${testMode}`);
    
    // Get the current mode (test or production)
    // Override with testMode parameter if provided
    const isProdMode = testMode === false ? false : (testMode === true ? true : getMode());
    console.log(`API: Using ${isProdMode ? 'PRODUCTION' : 'TEST'} mode`);
    
    if (!isProdMode) {
      // In test mode, use the test database
      console.log(`API: Using test database for query`);
      try {
        const value = await executeTestQuery(sql, server as 'P21' | 'POR');
        console.log(`API: Test query result: ${value}`);
        return NextResponse.json({ success: true, value });
      } catch (error) {
        console.error(`API: Error executing test query on ${server}:`, error);
        return NextResponse.json(
          { 
            error: error instanceof Error ? error.message : 'Test database query failed' 
          },
          { status: 500 }
        );
      }
    } else {
      // In production mode, use the real database connection
      console.log(`API: Using real database connection for query`);
      try {
        // Check if we have server configuration
        const config = await getServerConfig(server as 'P21' | 'POR');
        
        if (!config) {
          console.error(`API: No configuration found for ${server} server`);
          return NextResponse.json(
            { error: `No configuration found for ${server} server` },
            { status: 500 }
          );
        }
        
        console.log(`API: Found configuration for ${server}: ${config.server}, DB: ${config.database}`);
        
        // For POR, check if we're using MS Access
        if (server === 'POR' && config.filePath) {
          console.log(`API: Using MS Access for POR with file path: ${config.filePath}`);
          
          // Check if the file exists
          if (!fs.existsSync(config.filePath)) {
            console.error(`API: MS Access file not found at path: ${config.filePath}`);
            return NextResponse.json(
              { error: `MS Access file not found at path: ${config.filePath}` },
              { status: 404 }
            );
          }
          
          try {
            // Transform SQL for MS Access if tableName is provided
            let accessSql = sql;
            if (tableName) {
              accessSql = generateAccessSql(sql, tableName);
              console.log(`API: Transformed SQL for MS Access: ${accessSql}`);
            }
            
            // Execute the query against MS Access
            const result = await executeAccessQuery(accessSql, config.filePath);
            console.log(`API: Access query executed successfully`);
            
            // Process the result
            if (Array.isArray(result)) {
              console.log(`API: Query returned ${result.length} rows`);
              if (result.length === 1) {
                // If we have a single row, extract the first value
                const row = result[0];
                const keys = Object.keys(row);
                if (keys.length === 1) {
                  const value = row[keys[0]];
                  console.log(`API: Extracted single value: ${value}`);
                  return NextResponse.json({ success: true, value, connectionId: 'access' });
                } else if (keys.length > 1) {
                  // Try to find a column named 'value' or similar
                  const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
                  const value = row[valueKey];
                  console.log(`API: Extracted value from column ${valueKey}: ${value}`);
                  return NextResponse.json({ success: true, value, connectionId: 'access' });
                }
              }
              
              // Return all rows
              console.log(`API: Returning all rows`);
              return NextResponse.json({ success: true, rows: result, connectionId: 'access' });
            } else if (typeof result === 'number') {
              // If the result is already a number, use it directly
              console.log(`API: Returning numeric result: ${result}`);
              return NextResponse.json({ success: true, value: result, connectionId: 'access' });
            } else if (result && typeof result === 'object') {
              // If it's a single object, try to extract a value
              const keys = Object.keys(result);
              if (keys.length >= 1) {
                const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
                const value = result[valueKey];
                console.log(`API: Extracted value from object: ${value}`);
                return NextResponse.json({ success: true, value, connectionId: 'access' });
              }
            }
            
            // If we couldn't extract a single value, return the raw result
            console.log(`API: Returning raw result`);
            return NextResponse.json({ success: true, result, connectionId: 'access' });
          } catch (error) {
            console.error(`API: Error executing Access query:`, error);
            return NextResponse.json(
              { error: error instanceof Error ? error.message : 'Access database query failed' },
              { status: 500 }
            );
          }
        } else {
          // For P21 or non-Access POR, use SQL Server
          // Get or create a SQL Server client for this connection
          let client: SqlServerClient;
          
          if (connectionId && connectionPool[connectionId]) {
            client = connectionPool[connectionId];
            console.log(`API: Using existing connection ID: ${connectionId}`);
          } else {
            // Create a new client and add it to the pool
            client = new SqlServerClient(config);
            const newConnectionId = uuidv4();
            connectionPool[newConnectionId] = client;
            console.log(`API: Created new connection with ID: ${newConnectionId}`);
            
            // Test the connection
            const status = await client.testConnection();
            if (!status.isConnected) {
              console.error(`API: Failed to connect to ${server} server: ${status.error}`);
              return NextResponse.json(
                { error: `Failed to connect to ${server} server: ${status.error}` },
                { status: 500 }
              );
            }
            
            // Return the new connection ID
            connectionId = newConnectionId;
          }
          
          // Execute the query
          console.log(`API: Executing query on ${server} server: ${sql}`);
          const result = await client.executeQuery(sql);
          console.log(`API: Query executed successfully`);
          
          // Process the result
          if (Array.isArray(result)) {
            console.log(`API: Query returned ${result.length} rows`);
            if (result.length === 1) {
              // If we have a single row, extract the first value
              const row = result[0];
              const keys = Object.keys(row);
              if (keys.length === 1) {
                const value = row[keys[0]];
                console.log(`API: Extracted single value: ${value}`);
                return NextResponse.json({ success: true, value, connectionId });
              } else if (keys.length > 1) {
                // Try to find a column named 'value' or similar
                const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
                const value = row[valueKey];
                console.log(`API: Extracted value from column ${valueKey}: ${value}`);
                return NextResponse.json({ success: true, value, connectionId });
              }
            }
            
            // Return all rows
            console.log(`API: Returning all rows`);
            return NextResponse.json({ success: true, rows: result, connectionId });
          } else if (typeof result === 'number') {
            // If the result is already a number, use it directly
            console.log(`API: Returning numeric result: ${result}`);
            return NextResponse.json({ success: true, value: result, connectionId });
          } else if (result && typeof result === 'object') {
            // If it's a single object, try to extract a value
            const keys = Object.keys(result);
            if (keys.length >= 1) {
              const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
              const value = result[valueKey];
              console.log(`API: Extracted value from object: ${value}`);
              return NextResponse.json({ success: true, value, connectionId });
            }
          }
          
          // If we couldn't extract a single value, return the raw result
          console.log(`API: Returning raw result`);
          return NextResponse.json({ success: true, result, connectionId });
        }
      } catch (error) {
        console.error(`API: Error executing query on ${server}:`, error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Database query failed' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}
