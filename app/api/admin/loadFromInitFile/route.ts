import { NextResponse } from 'next/server';
import { replaceAllChartData } from '@/lib/db/server'; // Import replaceAllChartData
import { singleSourceData } from '@/lib/db/single-source-data'; // Import the source data
import type { ChartDataRow } from '@/lib/db/types'; // Import ChartDataRow type

export async function POST(request: Request) {
  try {
    console.log('API Route: /api/admin/loadFromInitFile called, using replaceAllChartData');

    // Prepare data in the format expected by replaceAllChartData
    const dataToInsert = singleSourceData.map((row, index) => {
      // Basic check for essential fields using CORRECT names
      if (!row || typeof row !== 'object' || !row.rowId || !row.chartGroup || !row.DataPoint || !row.serverName || !row.productionSqlExpression) {
        console.warn(`[API loadFromInitFile] Skipping row at index ${index} due to missing essential data:`, row);
        return null; // Indicate invalid row
      }

      // Safely parse value - REMOVED as 'value' is not in source
      // const parsedValue = parseFloat(row.value);
      // const finalValue = !isNaN(parsedValue) ? parsedValue : 0; // Default to 0 if parsing fails

      return {
        rowId: row.rowId, // Use correct property name
        chartGroup: row.chartGroup,
        chartName: typeof row.chartName === 'string' ? row.chartName : '', // Provide default if missing/wrong type
        variableName: typeof row.variableName === 'string' ? row.variableName : null, // Allow null if missing/wrong type
        DataPoint: row.DataPoint,
        serverName: row.serverName as 'P21' | 'POR', // Assume correct type ('P21' or 'POR')
        tableName: typeof row.tableName === 'string' ? row.tableName : null, // Allow null if missing/wrong type
        productionSqlExpression: row.productionSqlExpression, // Use correct property name
        value: 0, // Provide default value as it's not in source
        calculationType: row.calculationType as ChartDataRow['calculationType'], // Use correct property name and assume correct type
        axisStep: typeof row.axisStep === 'number' ? row.axisStep : null, // Provide null default if missing/wrong type
      };
    }).filter(row => row !== null) as Omit<ChartDataRow, 'id' | 'lastUpdated'>[]; // Filter out invalid rows and assert type

    // Check if any valid data remains after filtering
    if (dataToInsert.length === 0 && singleSourceData.length > 0) {
       console.error('[API loadFromInitFile] No valid data rows could be processed from singleSourceData.');
       throw new Error('Failed to process any rows from the source data file. Check data integrity.');
    }

    console.log(`[API loadFromInitFile] Attempting to replace data with ${dataToInsert.length} processed rows.`);
    const success = replaceAllChartData(dataToInsert);

    if (success) {
      return NextResponse.json({ success: true, message: `Database loaded successfully. ${dataToInsert.length} rows processed.` });
    } else {
      // replaceAllChartData handles its own errors, but we return a generic server error if it returns false
      return NextResponse.json(
        { success: false, error: 'Failed to replace chart data. Check server logs for details.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API Error in loadFromInitFile route:', error instanceof Error ? error.stack : error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: `Failed to load database: ${errorMessage}` },
      { status: 500 }
    );
  }
}
