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
import { getAllChartData } from '@/lib/db/server';
export function GET(request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const allData = getAllChartData();
            // Initialize the structure for grouped data
            const groupedData = {
                metrics: [],
                accounts: [],
                historicalData: [],
                customerMetrics: [],
                inventory: [],
                porOverview: [],
                siteDistribution: [],
                arAging: [],
                dailyOrders: [],
                webOrders: [],
            };
            // Group data based on chartGroup
            // Note: These group names are assumed based on the frontend structure.
            // Adjust them if the actual names in your database are different.
            allData.forEach((row) => {
                switch (row.chart_group) {
                    case 'Key Metrics': // Assuming this maps to 'metrics'
                        groupedData.metrics.push(row);
                        break;
                    case 'Accounts':
                        groupedData.accounts.push(row);
                        break;
                    case 'Historical Data':
                        groupedData.historicalData.push(row);
                        break;
                    case 'Customer Metrics':
                        groupedData.customerMetrics.push(row);
                        break;
                    case 'Inventory':
                        groupedData.inventory.push(row);
                        break;
                    case 'POR Overview':
                        groupedData.porOverview.push(row);
                        break;
                    case 'Site Distribution':
                        groupedData.siteDistribution.push(row);
                        break;
                    case 'AR Aging':
                        groupedData.arAging.push(row);
                        break;
                    case 'Daily Orders':
                        groupedData.dailyOrders.push(row);
                        break;
                    case 'Web Orders':
                        groupedData.webOrders.push(row);
                        break;
                    default:
                        // Optionally log or handle rows with unexpected chartGroup
                        console.warn(`Data row with unhandled chartGroup found: ${row.chart_group}`);
                        break;
                }
            });
            return NextResponse.json(groupedData);
        }
        catch (error) {
            console.error('API Error fetching dashboard data:', error instanceof Error ? error.stack : error);
            // Determine the type of error and provide a more specific message if possible
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return NextResponse.json({ message: `Failed to fetch dashboard data: ${errorMessage}` }, { status: 500 });
        }
    });
}
