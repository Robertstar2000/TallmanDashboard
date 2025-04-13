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
import { getChartData } from '@/lib/db/sqlite';
export function GET() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting to fetch chart data');
            const chartData = yield getChartData();
            console.log(`Got chart data with ${chartData.length} rows`);
            // Transform chart_data into dashboard format
            let dashboardData = {
                metrics: [],
                historicalData: [],
                accounts: [],
                customerMetrics: [],
                inventory: [],
                porOverview: [],
                siteDistribution: [],
                arAging: [],
                dailyOrders: [],
                webOrders: []
            };
            // Initialize the dashboard data arrays
            if (!dashboardData) {
                dashboardData = {};
                dashboardData.metrics = [];
                dashboardData.historicalData = [];
                dashboardData.accounts = [];
                dashboardData.customerMetrics = [];
                dashboardData.inventory = [];
                dashboardData.siteDistribution = [];
                dashboardData.porOverview = [];
                dashboardData.arAging = [];
                dashboardData.dailyOrders = [];
                dashboardData.webOrders = [];
                console.log('All dashboard data arrays initialized as empty - will be populated from admin spreadsheet');
            }
            // Pre-populate the webOrders array with empty data points for all months
            // This ensures that all months have data points even if they're not in the database
            const currentDate = new Date();
            for (let i = 0; i < 12; i++) {
                const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const monthString = monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
                // Only add if it doesn't already exist
                if (!dashboardData.webOrders.find(w => w.date === monthString)) {
                    dashboardData.webOrders.push({
                        id: `web-${i}`,
                        date: monthString,
                        orders: 0,
                        revenue: 0
                    });
                }
            }
            // Pre-populate the dailyOrders array with empty data points for all days
            // This ensures that all days have data points even if they're not in the database
            for (let i = 1; i <= 7; i++) {
                // Only add if it doesn't already exist
                if (!dashboardData.dailyOrders.find(d => d.date === i.toString())) {
                    dashboardData.dailyOrders.push({
                        id: `order-${i}`,
                        date: i.toString(),
                        orders: 0
                    });
                }
            }
            // Pre-populate month names for reference
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            console.log('Processing chart data rows');
            // First, sort the data by month to ensure correct order
            const sortedData = chartData.sort((a, b) => {
                if (a.variableName < b.variableName)
                    return -1;
                if (a.variableName > b.variableName)
                    return 1;
                return 0;
            });
            // Process each row from chart_data
            sortedData.forEach(row => {
                console.log(`Processing row: ${row.chartName} - ${row.variableName}, Value: ${row.value}`);
                // Try to parse value as a number if it's a string
                let value = 0;
                if (typeof row.value === 'string') {
                    // Handle non-numeric values for testing
                    try {
                        value = parseFloat(row.value) || 0;
                        console.log(`Parsed string value "${row.value}" to number: ${value}`);
                    }
                    catch (e) {
                        console.warn(`Failed to parse value ${row.value} as number for ${row.chartName} - ${row.variableName}`);
                        value = 0;
                    }
                }
                else if (typeof row.value === 'number') {
                    value = row.value;
                }
                // Ensure value is a valid number
                if (isNaN(value) || !isFinite(value)) {
                    console.warn(`Invalid value for ${row.chartName} - ${row.variableName}: ${value}, defaulting to 0`);
                    value = 0;
                }
                switch (row.chartName) {
                    case 'Key Metrics':
                        // Convert the variableName to the format expected by the MetricsSection component
                        let metricName = row.variableName.toLowerCase().replace(/ /g, '_');
                        console.log(`Adding metric: ${row.variableName} (${metricName}) with value: ${value}`);
                        dashboardData.metrics.push({
                            id: row.id,
                            name: metricName, // Use the converted name format that MetricsSection expects
                            value: value, // Use the exact value from the spreadsheet
                            trend: value > 0 ? 'up' : value < 0 ? 'down' : 'neutral',
                            change: 0, // Set to 0 to ensure no modification to the value
                            color: getRandomColor()
                        });
                        break;
                    case 'Historical Data':
                        console.log(`Processing Historical Data row: id=${row.id}, variableName=${row.variableName}, value=${value}`);
                        // For Historical Data, we need to handle the special case where variableNames are "P21" and "POR"
                        // instead of "Sales" and "Orders" as expected
                        // Extract the month from the ID if possible
                        let historicalMonthNumber = null;
                        // Try to extract month from the ID
                        if (row.id) {
                            // Check if the ID is a simple number (e.g., "36", "37")
                            const simpleIdMatch = /^(\d+)$/.exec(row.id);
                            if (simpleIdMatch) {
                                const idNum = parseInt(simpleIdMatch[1]);
                                // For simple numeric IDs, we assume they come in pairs (P21, POR) for each month
                                // So month = (id - 36) / 2 + 1 (assuming 36 is the first ID for month 1)
                                if (idNum >= 36) {
                                    historicalMonthNumber = Math.floor((idNum - 36) / 2) + 1;
                                    console.log(`  Extracted month ${historicalMonthNumber} from numeric ID ${row.id}`);
                                }
                            }
                            // Check if the ID has a letter suffix (e.g., "41a", "41b")
                            else {
                                const complexIdMatch = /^(\d+)([a-z])$/.exec(row.id);
                                if (complexIdMatch) {
                                    // Convert the letter to a number (a=0, b=1, etc.)
                                    const idNum = parseInt(complexIdMatch[1]);
                                    const letterOffset = complexIdMatch[2].charCodeAt(0) - 'a'.charCodeAt(0);
                                    // Calculate month number
                                    historicalMonthNumber = Math.floor((idNum - 36) / 2) + 1;
                                    console.log(`  Extracted month ${historicalMonthNumber} from complex ID ${row.id}`);
                                }
                            }
                        }
                        // If we couldn't extract a month number from the ID, try to extract it from the variableName
                        if (historicalMonthNumber === null) {
                            for (let i = 0; i < months.length; i++) {
                                if (row.variableName && row.variableName.includes(months[i])) {
                                    historicalMonthNumber = i + 1;
                                    console.log(`  Extracted month ${historicalMonthNumber} from variableName ${row.variableName}`);
                                    break;
                                }
                            }
                        }
                        // If we still don't have a month number, use a default
                        if (historicalMonthNumber === null) {
                            historicalMonthNumber = 1;
                            console.log(`  Using default month 1 for row with ID ${row.id}`);
                        }
                        // Ensure month number is between 1 and 12
                        historicalMonthNumber = Math.max(1, Math.min(12, historicalMonthNumber));
                        // Get the month name
                        const historicalMonth = months[historicalMonthNumber - 1];
                        // Find existing data point for this month or create a new one
                        let historicalDataPoint = dashboardData.historicalData.find(h => h.date === historicalMonth);
                        if (!historicalDataPoint) {
                            historicalDataPoint = {
                                id: `historical-${historicalMonthNumber}`,
                                date: historicalMonth,
                                sales: 0,
                                orders: 0
                            };
                            dashboardData.historicalData.push(historicalDataPoint);
                        }
                        // Update the appropriate field based on the server
                        if (row.serverName === 'P21') {
                            if (historicalDataPoint) {
                                historicalDataPoint.sales = value;
                            }
                        }
                        else if (row.serverName === 'POR') {
                            if (historicalDataPoint) {
                                historicalDataPoint.orders = value;
                            }
                        }
                        console.log(`  Updated historical data for ${historicalMonth}: P21=${historicalDataPoint === null || historicalDataPoint === void 0 ? void 0 : historicalDataPoint.sales}, POR=${historicalDataPoint === null || historicalDataPoint === void 0 ? void 0 : historicalDataPoint.orders}`);
                        break;
                    case 'Accounts':
                        // Find the account data point for the current date or create a new one
                        const accountDate = new Date().toISOString().split('T')[0];
                        let accountDataPoint = dashboardData.accounts.find(a => a.date === accountDate);
                        if (!accountDataPoint) {
                            accountDataPoint = {
                                id: `account-${accountDate}`,
                                date: accountDate,
                                payable: 0,
                                receivable: 0,
                                overdue: 0
                            };
                            dashboardData.accounts.push(accountDataPoint);
                        }
                        // Update the appropriate field based on the variableName
                        if (accountDataPoint) {
                            if (row.variableName === 'Current') {
                                accountDataPoint.receivable = value;
                            }
                            else if (row.variableName === '30 Days') {
                                accountDataPoint.payable = value;
                            }
                            else if (row.variableName === '60 Days' || row.variableName === '90 Days') {
                                accountDataPoint.overdue = value;
                            }
                        }
                        break;
                    case 'Customer Metrics':
                        dashboardData.customerMetrics.push({
                            id: `customer-${row.id || dashboardData.customerMetrics.length}`,
                            date: new Date().toISOString().split('T')[0],
                            newCustomers: value
                        });
                        break;
                    case 'Inventory':
                        dashboardData.inventory.push({
                            id: `inventory-${row.id || dashboardData.inventory.length}`,
                            inStock: value,
                            onOrder: 0
                        });
                        break;
                    case 'POR Overview':
                        dashboardData.porOverview.push({
                            id: `por-${row.id || dashboardData.porOverview.length}`,
                            date: new Date().toISOString().split('T')[0],
                            newRentals: value,
                            openRentals: 0,
                            rentalValue: 0
                        });
                        break;
                    case 'Site Distribution':
                        dashboardData.siteDistribution.push({
                            id: `site-${row.id || dashboardData.siteDistribution.length}`,
                            name: row.variableName || `Site ${dashboardData.siteDistribution.length + 1}`,
                            value: value
                        });
                        break;
                    case 'AR Aging':
                        // Find the AR aging data point for the current range or create a new one
                        let agingRange = 'Unknown';
                        if (row.variableName === 'Current') {
                            agingRange = 'Current';
                        }
                        else if (row.variableName === '30 Days') {
                            agingRange = '1-30 Days';
                        }
                        else if (row.variableName === '60 Days') {
                            agingRange = '31-60 Days';
                        }
                        else if (row.variableName === '90 Days') {
                            agingRange = '61-90 Days';
                        }
                        else if (row.variableName === '120 Days') {
                            agingRange = '90+ Days';
                        }
                        else {
                            agingRange = row.variableName || 'Unknown';
                        }
                        let arDataPoint = dashboardData.arAging.find(a => a.range === agingRange);
                        if (!arDataPoint) {
                            arDataPoint = {
                                id: `ar-${agingRange}`,
                                range: agingRange,
                                amount: 0
                            };
                            dashboardData.arAging.push(arDataPoint);
                        }
                        // Update the amount
                        if (arDataPoint) {
                            arDataPoint.amount = value;
                        }
                        break;
                    case 'Daily Orders':
                        // Try to extract the day number from the variableName
                        let dayNumber = '1'; // Default to Sunday
                        if (row.variableName) {
                            // Check if variableName is a simple number 1-7
                            if (/^[1-7]$/.test(row.variableName)) {
                                dayNumber = row.variableName;
                            }
                            // Check for day names
                            else {
                                const lowerVarName = row.variableName.toLowerCase();
                                if (lowerVarName.includes('sun'))
                                    dayNumber = '1';
                                else if (lowerVarName.includes('mon'))
                                    dayNumber = '2';
                                else if (lowerVarName.includes('tue'))
                                    dayNumber = '3';
                                else if (lowerVarName.includes('wed'))
                                    dayNumber = '4';
                                else if (lowerVarName.includes('thu'))
                                    dayNumber = '5';
                                else if (lowerVarName.includes('fri'))
                                    dayNumber = '6';
                                else if (lowerVarName.includes('sat'))
                                    dayNumber = '7';
                            }
                        }
                        // Find the daily order data point for this day or create a new one
                        let dailyOrderPoint = dashboardData.dailyOrders.find(d => d.date === dayNumber);
                        if (!dailyOrderPoint) {
                            dailyOrderPoint = {
                                id: `daily-order-${dayNumber}`,
                                date: dayNumber,
                                orders: 0
                            };
                            dashboardData.dailyOrders.push(dailyOrderPoint);
                        }
                        // Update the orders value
                        if (dailyOrderPoint) {
                            dailyOrderPoint.orders = value;
                        }
                        break;
                    case 'Web Orders':
                        // Try to extract the month from the variableName
                        let webOrderMonth = '';
                        if (row.variableName) {
                            for (const month of months) {
                                if (row.variableName.includes(month)) {
                                    webOrderMonth = month;
                                    break;
                                }
                            }
                        }
                        // If we couldn't extract a month, use the current month
                        if (!webOrderMonth) {
                            webOrderMonth = months[new Date().getMonth()];
                        }
                        // Construct the full date string (e.g., "Jan 2023")
                        const webOrderDate = `${webOrderMonth} ${new Date().getFullYear()}`;
                        // Find the web order data point for this month or create a new one
                        let webOrderPoint = dashboardData.webOrders.find(w => w.date === webOrderDate);
                        if (!webOrderPoint) {
                            webOrderPoint = {
                                id: `web-order-${webOrderMonth}`,
                                date: webOrderDate,
                                orders: 0,
                                revenue: 0
                            };
                            dashboardData.webOrders.push(webOrderPoint);
                        }
                        // Update the appropriate field based on the variableName
                        if (webOrderPoint) {
                            if (row.variableName && row.variableName.toLowerCase().includes('revenue')) {
                                webOrderPoint.revenue = value;
                            }
                            else {
                                webOrderPoint.orders = value;
                            }
                        }
                        break;
                    default:
                        console.log(`Unhandled chart name: ${row.chartName}`);
                        break;
                }
            });
            // Sort historical data by month
            dashboardData.historicalData.sort((a, b) => {
                const aIndex = months.indexOf(a.date);
                const bIndex = months.indexOf(b.date);
                return aIndex - bIndex;
            });
            // Sort daily orders by day number
            dashboardData.dailyOrders.sort((a, b) => {
                const aNum = parseInt(a.date || '0');
                const bNum = parseInt(b.date || '0');
                return aNum - bNum;
            });
            // Sort web orders by date
            dashboardData.webOrders.sort((a, b) => {
                const aMonth = a.date.split(' ')[0];
                const bMonth = b.date.split(' ')[0];
                const aIndex = months.indexOf(aMonth);
                const bIndex = months.indexOf(bMonth);
                return aIndex - bIndex;
            });
            console.log('Finished processing chart data');
            console.log(`Final dashboard data: ${dashboardData.metrics.length} metrics, ${dashboardData.historicalData.length} historical data points`);
            return NextResponse.json(dashboardData);
        }
        catch (error) {
            console.error('Error in dashboard data route:', error);
            return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
        }
    });
}
// Helper function to generate a random color
function getRandomColor() {
    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}
