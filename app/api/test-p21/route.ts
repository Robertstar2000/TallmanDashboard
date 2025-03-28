import { NextRequest, NextResponse } from 'next/server';
import { ConnectionManager } from '@/lib/db/connection-manager';
import { ServerConfig } from '@/lib/db/connections';

/**
 * API route for testing P21 connection and query execution
 * GET /api/test-p21
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Testing P21 connection and query execution...');
    
    // Test queries that should return non-zero results
    const testQueries = [
      "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)",
      "SELECT ISNULL(SUM(order_amt), 0) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)",
      "SELECT TOP 1 order_no FROM P21.dbo.oe_hdr WITH (NOLOCK)",
      "SELECT TOP 1 * FROM P21.dbo.oe_hdr WITH (NOLOCK)"
    ];
    
    const results = [];
    
    // Test direct connection manager execution
    for (const query of testQueries) {
      console.log(`Executing query: ${query}`);
      try {
        const serverConfig: ServerConfig = {
          type: 'P21'
        };
        
        const result = await ConnectionManager.executeQuery(serverConfig, query);
        results.push({
          query,
          result: JSON.stringify(result, null, 2),
          success: true
        });
      } catch (error: any) {
        results.push({
          query,
          error: error.message,
          success: false
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error('Error in test endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred while testing P21 connection',
        error: error.toString()
      },
      { status: 500 }
    );
  }
}
