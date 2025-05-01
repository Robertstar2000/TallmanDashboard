import { NextResponse } from 'next/server';
import { getAllChartData } from '@/lib/db/server';
import { ChartDataRow } from '@/lib/db/types';

// Define the expected structure of the response
// TODO: Define this properly in lib/db/types.ts and import it
interface DashboardApiResponse {
  metrics: ChartDataRow[];
  accounts: ChartDataRow[];
  historicalData: ChartDataRow[];
  customerMetrics: ChartDataRow[];
  inventory: ChartDataRow[];
  porOverview: ChartDataRow[];
  siteDistribution: ChartDataRow[];
  arAging: ChartDataRow[];
  dailyOrders: ChartDataRow[];
  webOrders: {
    date: string;
    orders: number;
    revenue: number;
  }[];
}

export async function GET(request: Request) {
  try {
    const allData = getAllChartData();

    // Initialize the structure for grouped data
    const groupedData: DashboardApiResponse = {
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

    // Temporary collection for raw Web Orders rows
    let rawWebOrders: ChartDataRow[] = [];

    // Group data based on chartGroup
    // Note: These group names are assumed based on the frontend structure.
    // Adjust them if the actual names in your database are different.
    allData.forEach((row) => {
      // Ensure value is numeric, defaulting null/undefined to 0
      if (row.value === null || typeof row.value === 'undefined') {
        row.value = 0;
      }

      switch (row.chartGroup) {
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
        case 'Web Revenue':
          rawWebOrders.push(row);
          break;
        default:
          // Optionally log or handle rows with unexpected chartGroup
          console.warn(`Data row with unhandled chartGroup found: ${row.chartGroup}`);
          break;
      }
    });

    // Pivot raw Web Orders rows into date-series with orders & revenue
    if (rawWebOrders.length > 0) {
      const steps = Array.from(new Set(rawWebOrders.map(r => r.axisStep))).filter(Boolean);
      const now = new Date();
      const pivoted = steps.map(step => {
        let offset = 0;
        if (String(step).toLowerCase() !== 'current') {
          const m = /-?\\d+/.exec(String(step));
          offset = m ? parseInt(m[0], 10) : 0;
        }
        const dateObj = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const date = dateObj.toISOString().split('T')[0];
        const ordersItem = rawWebOrders.find(r => r.axisStep === step && String(r.variableName).toLowerCase() === 'web_order_count');
        const revenueItem = rawWebOrders.find(r => r.axisStep === step && String(r.variableName).toLowerCase() === 'web_order_value');
        return { date, orders: ordersItem?.value ?? 0, revenue: revenueItem?.value ?? 0 };
      }).sort((a, b) => a.date.localeCompare(b.date));
      groupedData.webOrders = pivoted;
    }

    // Log the grouped data before sending the response
    console.log('API Response Data:', JSON.stringify(groupedData, null, 2)); 
    console.log('API - AR Aging Data Count:', groupedData.arAging?.length ?? 0);
    console.log('API - Accounts Data Count:', groupedData.accounts?.length ?? 0);
    console.log('API - Metrics Data Count:', groupedData.metrics?.length ?? 0);
    console.log('API - Historical Data Count:', groupedData.historicalData?.length ?? 0);
    console.log('API - Customer Metrics Data Count:', groupedData.customerMetrics?.length ?? 0);
    console.log('API - Inventory Data Count:', groupedData.inventory?.length ?? 0);
    console.log('API - POR Overview Data Count:', groupedData.porOverview?.length ?? 0);
    console.log('API - Site Distribution Data Count:', groupedData.siteDistribution?.length ?? 0);
    console.log('API - Daily Orders Data Count:', groupedData.dailyOrders?.length ?? 0);
    console.log('API - Web Orders Data Count:', groupedData.webOrders?.length ?? 0);

    return NextResponse.json(groupedData);

  } catch (error) {
    console.error('API Error fetching dashboard data:', error instanceof Error ? error.stack : error);
    // Determine the type of error and provide a more specific message if possible
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: `Failed to fetch dashboard data: ${errorMessage}` },
      { status: 500 }
    );
  }
}
