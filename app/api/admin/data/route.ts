import { NextRequest, NextResponse } from 'next/server';
import { getChartData, updateChartData } from '@/lib/db/sqlite';
import { executeQuery } from '../../../../lib/db/execute-query';
import { ConnectionManager } from '../../../../lib/db/connection-manager';

// Set the correct POR database path from memory
const POR_DB_PATH = 'C:\\Users\\BobM\\OneDrive\\Desktop\\POR.MDB';

/**
 * API route for admin data
 * GET /api/admin/data - Get all chart data
 * PUT /api/admin/data - Update chart data
 */

export async function GET() {
  try {
    console.log('API route: Fetching chart data');
    const data = await getChartData();
    
    // Add detailed logging to see the structure of the data
    console.log('API route: Chart data fetched successfully');
    console.log('API route: Data type:', typeof data);
    console.log('API route: Is array:', Array.isArray(data));
    console.log('API route: Data length:', data ? (Array.isArray(data) ? data.length : 'not an array') : 'null');
    
    if (!data) {
      console.error('API route: No data returned from getChartData');
      return NextResponse.json({ error: 'No data returned from database' }, { status: 500 });
    }
    
    if (!Array.isArray(data)) {
      console.error('API route: Data returned is not an array:', typeof data);
      return NextResponse.json({ error: 'Invalid data format from database' }, { status: 500 });
    }
    
    // Log a sample of the data (first item) to verify structure
    if (data.length > 0) {
      console.log('API route: First row sample:', JSON.stringify(data[0]).substring(0, 200) + '...');
    }
    
    // Return data in the expected format
    return NextResponse.json({ data });
  } catch (error) {
    // Enhanced error logging with more details
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown error type'
    };
    
    console.error('Error fetching admin data:', errorDetails);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, productionSqlExpression, tableName, serverName } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Update the chart data in SQLite
    await updateChartData(id, { productionSqlExpression, tableName });

    // Try to execute the query to verify it works
    try {
      // Determine if this is a POR query based on ID (127-174 are POR queries)
      const isPORQuery = parseInt(id) >= 127 && parseInt(id) <= 174;
      
      if (isPORQuery) {
        console.log(`Executing POR query (ID: ${id}): ${productionSqlExpression}`);
        
        // Use the ConnectionManager directly instead of fetch API
        try {
          const porFilePath = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\OneDrive\\Desktop\\POR.MDB';
          const result = await ConnectionManager.executeAccessQuery(
            { type: 'POR', filePath: porFilePath },
            productionSqlExpression
          );
          
          console.log(`POR query executed successfully, result:`, result);
          
          // No need to update rows here since this is just a test execution
          // The actual update was already done with updateChartData above
        } catch (error) {
          console.error(`Error executing POR query (ID: ${id}):`, error);
          throw new Error(`POR query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // For P21 queries, use the executeQuery function
        console.log(`Executing P21 query (ID: ${id}): ${productionSqlExpression}`);
        
        const result = await executeQuery(serverName, productionSqlExpression, tableName);
        console.log('P21 query execution successful:', result);
      }
      
      return NextResponse.json({ success: true, id });
    } catch (queryError) {
      console.error('Query execution failed:', queryError);
      
      // Still return success for the update, but include the query error
      return NextResponse.json({
        success: true,
        id,
        queryError: queryError instanceof Error ? queryError.message : String(queryError)
      });
    }
  } catch (error) {
    console.error('Error updating admin data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, productionSqlExpression, tableName, serverName } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Update the chart data in SQLite
    await updateChartData(id, { productionSqlExpression, tableName });

    // Try to execute the query to verify it works
    try {
      // Determine if this is a POR query based on ID (127-174 are POR queries)
      const isPORQuery = parseInt(id) >= 127 && parseInt(id) <= 174;
      
      if (isPORQuery) {
        console.log(`Executing POR query (ID: ${id}): ${productionSqlExpression}`);
        
        // Use the ConnectionManager directly instead of fetch API
        try {
          const porFilePath = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\OneDrive\\Desktop\\POR.MDB';
          const result = await ConnectionManager.executeAccessQuery(
            { type: 'POR', filePath: porFilePath },
            productionSqlExpression
          );
          
          console.log(`POR query executed successfully, result:`, result);
          
          // No need to update rows here since this is just a test execution
          // The actual update was already done with updateChartData above
        } catch (error) {
          console.error(`Error executing POR query (ID: ${id}):`, error);
          
          // Set error information
          // rows[i].error = error instanceof Error ? error.message : 'Unknown error';
          // rows[i].errorType = 'execution';
          // rows[i].lastError = new Date().toISOString();
        }
      } else {
        // For P21 queries, use the executeQuery function
        console.log(`Executing P21 query (ID: ${id}): ${productionSqlExpression}`);
        
        const result = await executeQuery(serverName, productionSqlExpression, tableName);
        console.log('P21 query execution successful:', result);
      }
      
      return NextResponse.json({ success: true, id });
    } catch (queryError) {
      console.error('Query execution failed:', queryError);
      
      // Still return success for the update, but include the query error
      return NextResponse.json({
        success: true,
        id,
        queryError: queryError instanceof Error ? queryError.message : String(queryError)
      });
    }
  } catch (error) {
    console.error('Error updating admin data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to update production SQL expression
 */
async function updateProductionSql(id: string, productionSqlExpression: string, tableName: string) {
  try {
    await updateChartData(id, { productionSqlExpression, tableName });
    return { success: true, id };
  } catch (error) {
    console.error('Error updating production SQL:', error);
    throw error;
  }
}
