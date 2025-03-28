import { NextRequest, NextResponse } from 'next/server';
import { ConnectionManager } from '@/lib/db/connection-manager';
import { getServerConfig } from '@/lib/db/connections';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { query } = body;
    
    if (!query) {
      return NextResponse.json({ success: false, message: 'Query is required' }, { status: 400 });
    }
    
    console.log('Executing P21 query:', query);
    
    // Check if the query has a column named 'value'
    const hasValueColumn = query.toUpperCase().includes('AS VALUE') || 
                           query.toUpperCase().includes(' VALUE,') || 
                           query.toUpperCase().includes(' VALUE ') || 
                           query.toUpperCase().includes(' VALUE)');
    
    // Format the query if needed
    let formattedQuery = query;
    if (!hasValueColumn && 
        (query.toUpperCase().includes('COUNT(') || 
         query.toUpperCase().includes('SUM(') || 
         query.toUpperCase().includes('AVG(') || 
         query.toUpperCase().includes('MIN(') || 
         query.toUpperCase().includes('MAX('))) {
      
      const lastParenIndex = query.lastIndexOf(')');
      if (lastParenIndex > 0 && lastParenIndex === query.length - 1) {
        formattedQuery = query.substring(0, lastParenIndex) + ') AS value';
      }
    }
    
    console.log('Formatted P21 query:', formattedQuery);
    
    // Get the server configuration for P21
    const serverConfig = await getServerConfig('P21');
    if (!serverConfig) {
      return NextResponse.json({ 
        success: false, 
        message: 'No P21 server configuration found' 
      }, { status: 400 });
    }
    
    // Execute the query using the ConnectionManager directly
    const connectionManager = ConnectionManager.getInstance();
    const result = await connectionManager.executeP21Query(serverConfig, formattedQuery);
    
    // Log the result
    console.log('P21 query result:', result);
    
    // Return the result
    return NextResponse.json({ 
      success: true, 
      result,
      query: {
        original: query,
        formatted: formattedQuery,
        hasValueColumn
      }
    });
  } catch (error: any) {
    console.error('Error executing P21 query:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred while executing the query' 
    }, { status: 500 });
  }
}
