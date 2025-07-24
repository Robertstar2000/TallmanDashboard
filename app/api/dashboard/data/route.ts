import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAllChartData } from '@/lib/db/server';
import { ChartDataRow, PORDailySalesPoint } from '@/lib/db/types';
import { getPORDailySales } from '@/lib/db/porDailySales';
import { getAdminVariables } from '@/lib/db/server';
import { verifyRequest } from '@/lib/auth/apiAuth';

// Define the expected structure of the response
interface WebOrderPoint {
  date: string;
  orders: number;
  revenue: number;
}

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
  webOrders: WebOrderPoint[];  // Using the defined interface
  porDailySales: PORDailySalesPoint[];
}

// Determine POR path: prefer admin config, fallback to env var
const envPorPath = process.env.POR_Path;
const adminVars = getAdminVariables();
const porVar = adminVars.find(v => v.type === 'POR' && v.value);
const porPath = porVar?.value as string || envPorPath;
console.log('API: Using POR path:', porPath);

export async function GET(request: NextRequest) {
  console.log('Dashboard API: Starting request');
  
  // Verify authentication
  const { user, error } = await verifyRequest(request);
  if (error) {
    console.error('Dashboard API: Authentication failed:', error);
    return error;
  }
  
  console.log('Dashboard API: Authenticated user:', user?.email);
  
  try {
    console.log('Dashboard API: Fetching chart data...');
    const allData = getAllChartData();
    console.log(`Dashboard API: Retrieved ${allData.length} data points`);

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
      porDailySales: [],
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
        default:
          // Optionally log or handle rows with unexpected chartGroup
          console.warn(`Data row with unhandled chartGroup found: ${row.chartGroup}`);
          break;
      }
    });

    // First, collect all web orders data
    const webOrdersData = allData.filter(row => 
      row.chartGroup === 'web_orders' && 
      row.serverName === 'P21' &&
      row.axisStep
    );

    if (webOrdersData.length > 0) {
      // Pivot the data by axisStep (month)
      const months = [...new Set(webOrdersData.map(r => r.axisStep))].sort();
      const pivoted: WebOrderPoint[] = months.map(step => {
        const now = new Date();
        const offset = Number(step) - 1; // Convert to 0-based month offset
        if (isNaN(offset)) {
          console.warn('Invalid month offset:', step);
          return { date: '', orders: 0, revenue: 0 };
        }
        const dateObj = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const date = dateObj.toISOString().split('T')[0];
        const ordersItem = webOrdersData.find(r => r.axisStep === step && String(r.variableName).toLowerCase() === 'web_order_count');
        const revenueItem = webOrdersData.find(r => r.axisStep === step && String(r.variableName).toLowerCase() === 'web_order_value');
        return { 
          date, 
          orders: ordersItem?.value ? Number(ordersItem.value) : 0, 
          revenue: revenueItem?.value ? Number(revenueItem.value) : 0 
        };
      }).sort((a, b) => a.date.localeCompare(b.date));
      groupedData.webOrders = pivoted;
    }

    // Fetch daily POR sales from MDB (file-based extraction) instead of DB rows
    if (porPath) {
      try {
        const values = await getPORDailySales(porPath);
        const today = new Date();
        
        groupedData.porOverview = values.map((value, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (values.length - 1 - i));
          const dateStr = date.toISOString().split('T')[0];
          
          // Create a proper ChartDataRow object
          return {
            id: `por-daily-${i}`,
            rowId: `por-daily-${dateStr}`,
            chartGroup: 'por_daily_sales',
            variableName: 'daily_sales',
            DataPoint: dateStr,
            chartName: 'POR Daily Sales',
            serverName: 'POR',
            tableName: 'daily_sales',
            productionSqlExpression: null,
            value: value,
            lastUpdated: new Date().toISOString(),
            calculationType: 'SUM',
            axisStep: dateStr
          } as ChartDataRow;
        });
      } catch (e) {
        console.error('Failed to load POR daily sales:', e);
      }
    }

    // Fetch daily POR sales for last 30 days
    let porDaily: PORDailySalesPoint[] = [];
    if (porPath) {
      try {
        const values = await getPORDailySales(porPath);
        // map to last 30 days labels
        const now = new Date();
        porDaily = values.slice(-30).map((v, i) => {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i));
          return { date: d.toISOString().split('T')[0], value: v };});
      } catch (e) {
        console.error('Failed to load POR daily sales:', e);
      }
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
    console.log('API - POR Daily Sales Data Count:', porDaily?.length ?? 0);

    console.log('Dashboard API: Successfully prepared response');
    return NextResponse.json(groupedData);
  } catch (error) {
    console.error('Dashboard API: Error processing request:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
