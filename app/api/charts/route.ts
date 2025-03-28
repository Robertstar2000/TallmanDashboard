import { NextResponse } from 'next/server';
import { executeAdminQuery } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const result = await executeAdminQuery(`
      SELECT 
        id,
        chart_group as chartGroup,
        variable_name as variableName,
        server_name as serverName,
        table_name as tableName,
        sql_expression as sqlExpression,
        value
      FROM chart_data
      ORDER BY id ASC
    `);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate the data
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Begin transaction
    await executeAdminQuery('BEGIN TRANSACTION');

    try {
      // Clear existing data
      await executeAdminQuery('DELETE FROM chart_data');

      // Insert new data
      for (const row of data) {
        await executeAdminQuery(`
          INSERT INTO chart_data (
            id,
            chart_group,
            variable_name,
            server_name,
            table_name,
            sql_expression,
            value
          ) VALUES (
            '${row.id}',
            '${row.chartGroup}',
            '${row.variableName}',
            '${row.serverName}',
            '${row.tableName}',
            '${row.sqlExpression}',
            '${row.value}'
          )
        `);
      }

      // Commit transaction
      await executeAdminQuery('COMMIT');

      return NextResponse.json({ success: true });
    } catch (error) {
      // Rollback on error
      await executeAdminQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating chart data:', error);
    return NextResponse.json({ error: 'Failed to update chart data' }, { status: 500 });
  }
}
