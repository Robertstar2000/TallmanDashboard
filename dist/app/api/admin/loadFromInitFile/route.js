var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NextResponse } from 'next/server';
import { replaceAllChartData } from '@/lib/db/server'; // Import replaceAllChartData
import { singleSourceData } from '@/lib/db/single-source-data'; // Import the source data
export function POST(request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('API Route: /api/admin/loadFromInitFile called, using replaceAllChartData');
            // Prepare data in the format expected by replaceAllChartData
            // The function expects Omit<ChartDataRow, 'id' | 'lastUpdated'>[]
            const dataToInsert = singleSourceData.map(row => ({
                rowId: row.id,
                chartGroup: row.chartGroup,
                variableName: row.variableName,
                DataPoint: row.DataPoint,
                serverName: row.serverName, // Type assertion might be needed
                tableName: row.tableName,
                productionSqlExpression: row.sqlExpression,
                value: parseFloat(row.value) || 0,
                calculationType: row.calculation, // Type assertion
            }));
            const success = replaceAllChartData(dataToInsert);
            if (success) {
                return NextResponse.json({ success: true, message: `Database loaded successfully. ${dataToInsert.length} rows processed.` });
            }
            else {
                // replaceAllChartData handles its own errors, but we return a generic server error if it returns false
                return NextResponse.json({ success: false, error: 'Failed to replace chart data. Check server logs for details.' }, { status: 500 });
            }
        }
        catch (error) {
            console.error('API Error in loadFromInitFile route:', error instanceof Error ? error.stack : error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return NextResponse.json({ success: false, error: `Failed to load database: ${errorMessage}` }, { status: 500 });
        }
    });
}
