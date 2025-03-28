import { NextRequest, NextResponse } from 'next/server';
import { ConnectionManager } from '@/lib/db/connection-manager';
import { executeP21Query } from '@/lib/services/p21';
import { executeProductionQuery } from '@/lib/db/admin';
import { AdminVariable } from '@/lib/types/dashboard';

interface TestResult {
  method: string;
  result?: any;
  error?: string;
}

/**
 * API route for directly testing P21 connection and query execution
 * GET /api/test-p21-direct
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Running direct P21 query test...');
    
    // Test query that should return non-zero results
    const testQuery = "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)";
    
    const results = {
      connectionManager: null as any,
      p21Service: null as any,
      adminExecuteProduction: null as any,
      rawResults: [] as TestResult[]
    };
    
    // Test 1: Direct ConnectionManager execution
    console.log('Test 1: Direct ConnectionManager execution');
    try {
      const result = await ConnectionManager.executeQuery({ type: 'P21' }, testQuery);
      console.log('ConnectionManager result:', JSON.stringify(result, null, 2));
      results.connectionManager = result;
      results.rawResults.push({ method: 'ConnectionManager', result });
    } catch (error: any) {
      console.error('ConnectionManager error:', error);
      results.rawResults.push({ method: 'ConnectionManager', error: error.message });
    }
    
    // Test 2: P21 Service execution
    console.log('Test 2: P21 Service execution');
    try {
      const result = await executeP21Query(testQuery, 'P21');
      console.log('P21 Service result:', result);
      results.p21Service = result;
      results.rawResults.push({ method: 'P21Service', result });
    } catch (error: any) {
      console.error('P21 Service error:', error);
      results.rawResults.push({ method: 'P21Service', error: error.message });
    }
    
    // Test 3: Admin executeProductionQuery
    console.log('Test 3: Admin executeProductionQuery');
    try {
      const testVariable: AdminVariable = {
        id: 'test-variable',
        chartName: 'Test Chart',
        variableName: 'Test Variable',
        name: 'Test Variable',
        chartGroup: 'Test Group',
        category: 'Test Category',
        server: 'P21',
        serverName: 'P21',
        tableName: 'oe_hdr',
        productionSqlExpression: testQuery,
        value: '0'
      };
      
      const result = await executeProductionQuery(testVariable);
      console.log('Admin executeProductionQuery result:', result);
      results.adminExecuteProduction = result;
      results.rawResults.push({ method: 'AdminExecuteProduction', result });
    } catch (error: any) {
      console.error('Admin executeProductionQuery error:', error);
      results.rawResults.push({ method: 'AdminExecuteProduction', error: error.message });
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
