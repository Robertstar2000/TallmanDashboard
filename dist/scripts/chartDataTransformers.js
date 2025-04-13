/**
 * Chart Data Transformers
 *
 * This file contains transformation functions for each chart group.
 * Each function takes raw data from the database and transforms it into
 * the structure required by the corresponding chart component.
 */
/**
 * Master transformer function that transforms all raw data into dashboard format
 * @param data Raw data from the database
 * @returns Formatted dashboard data
 */
export function transformDashboardData(data) {
    return {
        metrics: transformKeyMetrics(data),
        historicalData: transformHistoricalData(data),
        accounts: transformAccountsData(data),
        customerMetrics: transformCustomerMetrics(data),
        inventory: transformInventory(data),
        porOverview: transformPOROverview(data),
        siteDistribution: transformSiteDistribution(data),
        arAging: transformARAgingData(data),
        dailyOrders: transformDailyOrders(data),
        webOrders: transformWebOrders(data)
    };
}
/**
 * Helper function to get metric color based on name
 * @param name Metric name
 * @returns Color string
 */
function getMetricColor(name) {
    const colorMap = {
        'Daily Revenue': '#4CAF50',
        'Total Sales Monthly': '#2196F3',
        'Open Orders': '#FFC107',
        'New Customers': '#9C27B0',
        'Inventory Value': '#FF5722',
        'Active Rentals': '#795548'
    };
    return colorMap[name] || '#607D8B'; // Default color if not found
}
/**
 * Transforms raw data into Key Metrics format
 * @param data Raw data from the database
 * @returns Formatted Key Metrics data
 */
export function transformKeyMetrics(data) {
    // Filter data for Key Metrics chart group
    const keyMetricsData = data.filter(item => item.chartGroup === 'Key Metrics');
    // Transform to required format
    return keyMetricsData.map(item => {
        // Determine if the metric should be displayed as currency
        const isCurrency = ['Daily Revenue', 'Total Sales Monthly'].includes(item.name || '');
        return {
            id: item.id,
            name: item.name || '',
            value: typeof item.value === 'string' ? parseFloat(item.value) : item.value,
            color: getMetricColor(item.name || '')
        };
    });
}
/**
 * Transforms raw data into Accounts format
 * @param data Raw data from the database
 * @returns Formatted Accounts data
 */
export function transformAccountsData(data) {
    // Filter data for Accounts chart group
    const accountsData = data.filter(item => item.chartGroup === 'Accounts');
    // Get unique months and sort them chronologically
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Transform to required format
    const transformedData = [];
    // For each month, get payable, receivable, and overdue values
    months.forEach(month => {
        const payableItem = accountsData.find(item => item.DataPoint === `Accounts Payable ${month}`);
        const receivableItem = accountsData.find(item => item.DataPoint === `Accounts Receivable ${month}`);
        const overdueItem = accountsData.find(item => item.DataPoint === `Accounts Overdue ${month}`);
        // Parse values to numbers, defaulting to 0
        const payableValue = payableItem ?
            (typeof payableItem.value === 'string' ? parseFloat(payableItem.value) : Number(payableItem.value))
            : 0;
        const receivableValue = receivableItem ?
            (typeof receivableItem.value === 'string' ? parseFloat(receivableItem.value) : Number(receivableItem.value))
            : 0;
        const overdueValue = overdueItem ?
            (typeof overdueItem.value === 'string' ? parseFloat(overdueItem.value) : Number(overdueItem.value))
            : 0;
        transformedData.push({
            id: `${month}-accounts`,
            date: month,
            payable: payableValue,
            receivable: receivableValue,
            overdue: overdueValue
        });
    });
    // Sort by month order
    return transformedData.sort((a, b) => months.indexOf(a.date) - months.indexOf(b.date));
}
/**
 * Transforms raw data into Historical Data format
 * @param data Raw data from the database
 * @returns Formatted Historical Data
 */
export function transformHistoricalData(data) {
    // Filter data for Historical Data chart group
    const historicalData = data.filter(item => item.chartGroup === 'Historical Data');
    // Get unique months and sort them chronologically
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Transform to required format
    const transformedData = [];
    // For each month, get P21, POR, and Total values
    months.forEach(month => {
        const p21Item = historicalData.find(item => item.DataPoint === `Historical Data P21 ${month}` && item.serverName === 'P21');
        const porItem = historicalData.find(item => item.DataPoint === `Historical Data POR ${month}` && item.serverName === 'POR');
        const totalItem = historicalData.find(item => item.DataPoint === `Historical Data Total ${month}`);
        // Parse values to numbers, defaulting to 0
        const p21Value = p21Item ?
            (typeof p21Item.value === 'string' ? parseFloat(p21Item.value) : Number(p21Item.value))
            : 0;
        const porValue = porItem ?
            (typeof porItem.value === 'string' ? parseFloat(porItem.value) : Number(porItem.value))
            : 0;
        const totalValue = totalItem ?
            (typeof totalItem.value === 'string' ? parseFloat(totalItem.value) : Number(totalItem.value))
            : p21Value + porValue; // Calculate total if not provided
        transformedData.push({
            id: `${month}-history`,
            date: month,
            month: month,
            p21: p21Value,
            por: porValue,
            total: totalValue
        });
    });
    // Sort by month order
    return transformedData.sort((a, b) => months.indexOf(a.date) - months.indexOf(b.date));
}
/**
 * Transforms raw data into Customer Metrics format
 * @param data Raw data from the database
 * @returns Formatted Customer Metrics data
 */
export function transformCustomerMetrics(data) {
    // Filter data for Customer Metrics chart group
    const customerData = data.filter(item => item.chartGroup === 'Customer Metrics');
    // Get unique months and sort them chronologically
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Transform to required format
    const transformedData = [];
    // For each month, get new and returning customer values
    months.forEach(month => {
        const newCustomersItem = customerData.find(item => item.DataPoint === `Customer Metrics New ${month}`);
        const returningCustomersItem = customerData.find(item => item.DataPoint === `Customer Metrics Returning ${month}`);
        // Parse values to numbers, defaulting to 0
        const newCustomersValue = newCustomersItem ?
            (typeof newCustomersItem.value === 'string' ? parseFloat(newCustomersItem.value) : Number(newCustomersItem.value))
            : 0;
        const returningCustomersValue = returningCustomersItem ?
            (typeof returningCustomersItem.value === 'string' ? parseFloat(returningCustomersItem.value) : Number(returningCustomersItem.value))
            : 0;
        transformedData.push({
            id: `${month}-customers`,
            date: month,
            newCustomers: newCustomersValue,
            returningCustomers: returningCustomersValue
        });
    });
    // Sort by month order
    return transformedData.sort((a, b) => months.indexOf(a.date) - months.indexOf(b.date));
}
/**
 * Transforms raw data into Inventory format
 * @param data Raw data from the database
 * @returns Formatted Inventory data
 */
export function transformInventory(data) {
    // Filter data for Inventory chart group
    const inventoryData = data.filter(item => item.chartGroup === 'Inventory');
    // Define departments
    const departments = ['General', 'Electrical', 'Plumbing', 'HVAC'];
    // Transform to required format
    const transformedData = [];
    // For each department, get in-stock and on-order values
    departments.forEach(dept => {
        const inStockItem = inventoryData.find(item => item.DataPoint === `Inventory InStock ${dept}`);
        const onOrderItem = inventoryData.find(item => item.DataPoint === `Inventory OnOrder ${dept}`);
        // Parse values to numbers, defaulting to 0
        const inStockValue = inStockItem ?
            (typeof inStockItem.value === 'string' ? parseFloat(inStockItem.value) : Number(inStockItem.value))
            : 0;
        const onOrderValue = onOrderItem ?
            (typeof onOrderItem.value === 'string' ? parseFloat(onOrderItem.value) : Number(onOrderItem.value))
            : 0;
        transformedData.push({
            id: `${dept}-inventory`,
            department: dept,
            inStock: inStockValue,
            onOrder: onOrderValue
        });
    });
    return transformedData;
}
/**
 * Transforms raw data into POR Overview format
 * @param data Raw data from the database
 * @returns Formatted POR Overview data
 */
export function transformPOROverview(data) {
    // Filter data for POR Overview chart group
    const porData = data.filter(item => item.chartGroup === 'POR Overview');
    // Get unique months and sort them chronologically
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Transform to required format
    const transformedData = [];
    // For each month, find the new rentals, open rentals, and rental value
    months.forEach(month => {
        const newRentalsItem = porData.find(item => item.name === month && item.variableName === 'New Rentals');
        const openRentalsItem = porData.find(item => item.name === month && item.variableName === 'Open Rentals');
        const rentalValueItem = porData.find(item => item.name === month && item.variableName === 'Rental Value');
        if (newRentalsItem || openRentalsItem || rentalValueItem) {
            transformedData.push({
                id: `${month}-por`,
                date: month,
                name: month,
                newRentals: newRentalsItem ? (typeof newRentalsItem.value === 'string' ? parseFloat(newRentalsItem.value) : newRentalsItem.value) : 0,
                openRentals: openRentalsItem ? (typeof openRentalsItem.value === 'string' ? parseFloat(openRentalsItem.value) : openRentalsItem.value) : 0,
                rentalValue: rentalValueItem ? (typeof rentalValueItem.value === 'string' ? parseFloat(rentalValueItem.value) : rentalValueItem.value) : 0,
            });
        }
    });
    return transformedData;
}
/**
 * Transforms raw data into Site Distribution format
 * @param data Raw data from the database
 * @returns Formatted Site Distribution data
 */
export function transformSiteDistribution(data) {
    // Filter data for Site Distribution chart group
    const siteData = data.filter(item => item.chartGroup === 'Site Distribution');
    // Transform to required format
    const transformedData = [];
    // Get the latest site distribution data
    const date = new Date().toISOString().split('T')[0];
    const columbusItem = siteData.find(item => item.DataPoint === 'Site Distribution Columbus');
    const addisonItem = siteData.find(item => item.DataPoint === 'Site Distribution Addison');
    const lakeCityItem = siteData.find(item => item.DataPoint === 'Site Distribution Lake City');
    // Parse values to numbers, defaulting to 0
    const columbusValue = columbusItem ?
        (typeof columbusItem.value === 'string' ? parseFloat(columbusItem.value) : Number(columbusItem.value))
        : 0;
    const addisonValue = addisonItem ?
        (typeof addisonItem.value === 'string' ? parseFloat(addisonItem.value) : Number(addisonItem.value))
        : 0;
    const lakeCityValue = lakeCityItem ?
        (typeof lakeCityItem.value === 'string' ? parseFloat(lakeCityItem.value) : Number(lakeCityItem.value))
        : 0;
    // Calculate total for percentages
    const total = columbusValue + addisonValue + lakeCityValue;
    transformedData.push({
        id: 'site-distribution',
        date,
        columbus: columbusValue,
        addison: addisonValue,
        lakeCity: lakeCityValue,
        percentage: total > 0 ? 100 : 0 // Only show percentage if there's data
    });
    return transformedData;
}
/**
 * Transforms raw data into AR Aging format
 * @param data Raw data from the database
 * @returns Formatted AR Aging data
 */
export function transformARAgingData(data) {
    // Filter data for AR Aging chart group
    const arData = data.filter(item => item.chartGroup === 'AR Aging');
    // Transform to required format
    const transformedData = [];
    // Define the order of aging buckets
    const agingBuckets = ['Current', '1-30', '31-60', '61-90', '90+'];
    // For each aging bucket, find the corresponding data point
    agingBuckets.forEach(bucket => {
        const dataPoint = arData.find(item => {
            const bucketMap = {
                'Current': 'AR Aging Amount Due Current',
                '1-30': 'AR Aging Amount Due 1-30 Days',
                '31-60': 'AR Aging Amount Due 31-60 Days',
                '61-90': 'AR Aging Amount Due 61-90 Days',
                '90+': 'AR Aging Amount Due 90+ Days'
            };
            return item.DataPoint === bucketMap[bucket];
        });
        transformedData.push({
            id: (dataPoint === null || dataPoint === void 0 ? void 0 : dataPoint.id) || `${bucket}-aging`,
            range: bucket,
            amount: dataPoint ?
                (typeof dataPoint.value === 'string' ? parseFloat(dataPoint.value) : dataPoint.value)
                : 0
        });
    });
    return transformedData;
}
/**
 * Transforms raw data into Daily Orders format
 * @param data Raw data from the database
 * @returns Formatted Daily Orders data
 */
export function transformDailyOrders(data) {
    // Filter data for Daily Orders chart group
    const orderData = data.filter(item => item.chartGroup === 'Daily Orders');
    // Define the days we want to show (Today through Today-6)
    const days = ['Today', 'Yesterday', 'Day-2', 'Day-3', 'Day-4', 'Day-5', 'Day-6'];
    // Transform data
    const transformedData = days.map((day, index) => {
        const dataPoint = orderData.find(item => {
            const dayMap = {
                'Today': 'Daily Orders Today',
                'Yesterday': 'Daily Orders Yesterday',
                'Day-2': 'Daily Orders Day-2',
                'Day-3': 'Daily Orders Day-3',
                'Day-4': 'Daily Orders Day-4',
                'Day-5': 'Daily Orders Day-5',
                'Day-6': 'Daily Orders Day-6'
            };
            return item.DataPoint === dayMap[day];
        });
        // Calculate the date for this day
        const date = new Date();
        date.setDate(date.getDate() - index);
        const dateStr = date.toISOString().split('T')[0];
        // Parse value to number, defaulting to 0
        const value = dataPoint ?
            (typeof dataPoint.value === 'string' ? parseFloat(dataPoint.value) : Number(dataPoint.value))
            : 0;
        return {
            id: (dataPoint === null || dataPoint === void 0 ? void 0 : dataPoint.id) || `${day}-orders`,
            date: dateStr,
            orders: value,
            value: value
        };
    });
    // Sort by date descending (newest first)
    return transformedData.sort((a, b) => b.date.localeCompare(a.date));
}
/**
 * Transforms raw data into Web Orders format
 * @param data Raw data from the database
 * @returns Formatted Web Orders data
 */
export function transformWebOrders(data) {
    // Filter data for Web Orders chart group
    const webData = data.filter(item => item.chartGroup === 'Web Orders');
    // Get unique months and sort them chronologically
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Transform to required format
    const transformedData = [];
    // For each month, get orders and revenue values
    months.forEach(month => {
        const ordersItem = webData.find(item => item.DataPoint === `Web Orders Count ${month}`);
        const revenueItem = webData.find(item => item.DataPoint === `Web Orders Revenue ${month}`);
        // Parse values to numbers, defaulting to 0
        const ordersValue = ordersItem ?
            (typeof ordersItem.value === 'string' ? parseFloat(ordersItem.value) : Number(ordersItem.value))
            : 0;
        const revenueValue = revenueItem ?
            (typeof revenueItem.value === 'string' ? parseFloat(revenueItem.value) : Number(revenueItem.value))
            : 0;
        transformedData.push({
            id: `${month}-web-orders`,
            date: month,
            orders: ordersValue,
            revenue: revenueValue
        });
    });
    // Sort by month order
    return transformedData.sort((a, b) => months.indexOf(a.date) - months.indexOf(b.date));
}
