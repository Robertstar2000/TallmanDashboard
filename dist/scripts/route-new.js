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
import { executeRead } from '@/lib/db/sqlite';
import { transformDashboardData } from '@/lib/transformers/chartDataTransformers';
export function GET() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Dashboard data API route called (new transformer version)');
            // Fetch all dashboard data from the SQLite database
            const query = `
      SELECT 
        id, 
        name, 
        chart_group as chartGroup, 
        variable_name as variableName, 
        server_name as serverName, 
        value, 
        table_name as tableName,
        sql_expression as sqlExpression,
        sql_expression as sqlExpression,
        last_updated as lastUpdated
      FROM dashboard_data
    `;
            // The executeRead function only takes one parameter (the query string)
            const rawData = yield executeRead(query);
            if (!rawData || rawData.length === 0) {
                console.log('No data found in database, returning empty data');
                return NextResponse.json({
                    metrics: [],
                    accounts: [],
                    historicalData: [],
                    customerMetrics: [],
                    inventory: [],
                    porOverview: [],
                    siteDistribution: [],
                    arAging: [],
                    dailyOrders: [],
                    webOrders: []
                });
            }
            // Transform the raw data into the format required by each chart group
            const transformedData = transformDashboardData(rawData);
            // Log the number of data points for each chart group
            console.log(`Transformed data: 
      - Metrics: ${transformedData.metrics.length}
      - Accounts: ${transformedData.accounts.length}
      - Historical Data: ${transformedData.historicalData.length}
      - Customer Metrics: ${transformedData.customerMetrics.length}
      - Inventory: ${transformedData.inventory.length}
      - POR Overview: ${transformedData.porOverview.length}
      - Site Distribution: ${transformedData.siteDistribution.length}
      - AR Aging: ${transformedData.arAging.length}
      - Daily Orders: ${transformedData.dailyOrders.length}
      - Web Orders: ${transformedData.webOrders.length}
    `);
            return NextResponse.json(transformedData);
        }
        catch (error) {
            console.error('Error in dashboard data API route:', error);
            return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
        }
    });
}
