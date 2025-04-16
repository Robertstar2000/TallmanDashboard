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
    console.log('transformDashboardData: raw input data:', JSON.stringify(data));
    const result = {
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
    console.log('transformDashboardData: transformed output:', JSON.stringify(result));
    return result;
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
    console.log('transformKeyMetrics input:', JSON.stringify(data));
    // Filter data for Key Metrics chart group
    const keyMetricsData = data.filter(item => item.chartGroup === 'Key Metrics');
    // Transform to required format
    const out = keyMetricsData.map(item => ({
        id: item.id || item.rowId || item.variableName,
        name: item.DataPoint || item.name || '',
        value: typeof item.value === 'string' ? parseFloat(item.value) : item.value,
        variable: item.variableName,
        chartGroup: item.chartGroup,
        chartName: item.chartName,
        color: getMetricColor(item.name || item.DataPoint || '')
    }));
    console.log('transformKeyMetrics output:', JSON.stringify(out));
    return out;
}
/**
 * Transforms raw data into Historical Data format
 * @param data Raw data from the database
 * @returns Formatted Historical Data
 */
export function transformHistoricalData(data) {
    console.log('transformHistoricalData input:', JSON.stringify(data));
    // Filter data for Historical Data chart group
    const historicalData = data.filter(item => item.chartGroup === 'Historical Data');
    // Group by axisStep (month)
    const grouped = {};
    historicalData.forEach(item => {
        const axis = item.axisStep || item.month || item.date;
        if (!axis) return;
        if (!grouped[axis]) grouped[axis] = { id: `${axis}-history`, date: axis };
        // For HistoricalDataChart.jsx: expects p21, por as Y fields
        const key = item.serverName ? item.serverName.toLowerCase() : item.variableName;
        grouped[axis][key] = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
    });
    // Output array with expected fields
    const out = Object.values(grouped);
    console.log('transformHistoricalData output:', JSON.stringify(out));
    return out;
}
/**
 * Transforms raw data into Accounts format
 * @param data Raw data from the database
 * @returns Formatted Accounts data
 */
export function transformAccountsData(data) {
    console.log('transformAccountsData input:', JSON.stringify(data));
    // Filter data for Accounts chart group
    const accountsData = data.filter(item => item.chartGroup === 'Accounts');
    // Group by axisStep (month)
    const grouped = {};
    accountsData.forEach(item => {
        const axis = item.axisStep || item.month || item.date;
        if (!axis) return;
        if (!grouped[axis]) grouped[axis] = { id: `${axis}-accounts`, date: axis };
        // For AccountsPayableChart.jsx: expects value1, value2, value3, etc.
        grouped[axis][item.variableName] = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
    });
    // Output array with expected fields
    const out = Object.values(grouped);
    console.log('transformAccountsData output:', JSON.stringify(out));
    return out;
}
/**
 * Transforms raw data into Customer Metrics format
 * @param data Raw data from the database
 * @returns Formatted Customer Metrics data
 */
export function transformCustomerMetrics(data) {
    console.log('transformCustomerMetrics input:', JSON.stringify(data));
    // Filter data for Customer Metrics chart group
    const customerData = data.filter(item => item.chartGroup === 'Customer Metrics');
    // Group by axisStep (month)
    const grouped = {};
    customerData.forEach(item => {
        const axis = item.axisStep || item.month || item.date;
        if (!axis) return;
        if (!grouped[axis]) grouped[axis] = { id: `${axis}-customers`, date: axis };
        // For CustomerMetricsChart.jsx: expects value1, value2, ...
        grouped[axis][item.variableName] = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
    });
    const out = Object.values(grouped);
    console.log('transformCustomerMetrics output:', JSON.stringify(out));
    return out;
}
/**
 * Transforms raw data into Inventory format
 * @param data Raw data from the database
 * @returns Formatted Inventory data
 */
export function transformInventory(data) {
    console.log('transformInventory input:', JSON.stringify(data));
    // Filter data for Inventory chart group
    const inventoryData = data.filter(item => item.chartGroup === 'Inventory');
    // Group by axisStep (department)
    const grouped = {};
    inventoryData.forEach(item => {
        const axis = item.axisStep || item.department;
        if (!axis) return;
        if (!grouped[axis]) grouped[axis] = { id: `${axis}-inventory`, department: axis };
        grouped[axis][item.variableName] = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
    });
    const out = Object.values(grouped);
    console.log('transformInventory output:', JSON.stringify(out));
    return out;
}
/**
 * Transforms raw data into POR Overview format
 * @param data Raw data from the database
 * @returns Formatted POR Overview data
 */
export function transformPOROverview(data) {
    console.log('transformPOROverview input:', JSON.stringify(data));
    // Filter data for POR Overview chart group
    const porData = data.filter(item => item.chartGroup === 'POR Overview');
    // Group by axisStep (month)
    const grouped = {};
    porData.forEach(item => {
        const axis = item.axisStep || item.month || item.date;
        if (!axis) return;
        if (!grouped[axis]) grouped[axis] = { id: `${axis}-por`, date: axis };
        // For POROverviewChart.jsx: expects value as Y
        grouped[axis]['value'] = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
    });
    const out = Object.values(grouped);
    console.log('transformPOROverview output:', JSON.stringify(out));
    return out;
}
/**
 * Transforms raw data into Site Distribution format
 * @param data Raw data from the database
 * @returns Formatted Site Distribution data
 */
export function transformSiteDistribution(data) {
    console.log('transformSiteDistribution input:', JSON.stringify(data));
    // Filter data for Site Distribution chart group
    const siteData = data.filter(item => item.chartGroup === 'Site Distribution');
    // Group by axisStep (site/location)
    const grouped = {};
    siteData.forEach(item => {
        const axis = item.axisStep || item.site || item.location_id;
        if (!axis) return;
        if (!grouped[axis]) grouped[axis] = { id: `${axis}-site-distribution`, site: axis };
        grouped[axis][item.variableName] = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
    });
    const out = Object.values(grouped);
    console.log('transformSiteDistribution output:', JSON.stringify(out));
    return out;
}
/**
 * Transforms raw data into AR Aging format
 * @param data Raw data from the database
 * @returns Formatted AR Aging data
 */
export function transformARAgingData(data) {
    console.log('transformARAgingData input:', JSON.stringify(data));
    // Filter data for AR Aging chart group
    const arData = data.filter(item => item.chartGroup === 'AR Aging');
    // Transform to required format
    const transformedData = [];
    // Define the order of aging buckets
    const agingBuckets = [...new Set(arData.map(item => item.axisStep || item.DataPoint))].filter(Boolean);
    // For each aging bucket, find the corresponding data point
    agingBuckets.forEach(bucket => {
        const dataPoint = arData.find(item => {
            return (item.axisStep || item.DataPoint) === bucket;
        });
        transformedData.push({
            id: (dataPoint === null || dataPoint === void 0 ? void 0 : dataPoint.id) || `${bucket}-aging`,
            range: bucket,
            amount: dataPoint ?
                (typeof dataPoint.value === 'string' ? parseFloat(dataPoint.value) : dataPoint.value)
                : 0
        });
    });
    console.log('transformARAgingData output:', JSON.stringify(transformedData));
    return transformedData;
}
/**
 * Transforms raw data into Daily Orders format
 * @param data Raw data from the database
 * @returns Formatted Daily Orders data
 */
export function transformDailyOrders(data) {
    console.log('transformDailyOrders input:', JSON.stringify(data));
    // Filter data for Daily Orders chart group
    const orderData = data.filter(item => item.chartGroup === 'Daily Orders');
    // Define the days we want to show (Today through Today-6)
    const days = [...new Set(orderData.map(item => item.axisStep || item.date))].filter(Boolean);
    // Transform data
    const transformedData = days.map((day, index) => {
        const dataPoint = orderData.find(item => {
            return (item.axisStep || item.date) === day;
        });
        // Calculate the date for this day
        let dateStr = day;
        if (!/\d{4}-\d{2}-\d{2}/.test(day)) {
            const date = new Date();
            date.setDate(date.getDate() - index);
            dateStr = date.toISOString().split('T')[0];
        }
        const value = dataPoint ? (typeof dataPoint.value === 'string' ? parseFloat(dataPoint.value) : Number(dataPoint.value)) : 0;
        return {
            id: (dataPoint?.id) || `${day}-orders`,
            date: dateStr,
            orders: value,
            value: value // For DailyOrdersChart.jsx: expects value for line
        };
    });
    // Sort by date ascending
    const out = transformedData.sort((a, b) => a.date.localeCompare(b.date));
    console.log('transformDailyOrders output:', JSON.stringify(out));
    return out;
}
/**
 * Transforms raw data into Web Orders format
 * @param data Raw data from the database
 * @returns Formatted Web Orders data
 */
export function transformWebOrders(data) {
    console.log('transformWebOrders input:', JSON.stringify(data));
    // Filter data for Web Orders chart group
    const webData = data.filter(item => item.chartGroup === 'Web Orders');
    // Get unique months and sort them chronologically
    const months = [...new Set(webData.map(item => item.axisStep || item.month || item.date))].filter(Boolean);
    // Transform to required format
    const transformedData = [];
    // For each month, get orders and revenue values
    months.forEach(month => {
        const ordersItem = webData.find(item => (item.axisStep || item.month || item.date) === month && item.variableName === 'Orders');
        const revenueItem = webData.find(item => (item.axisStep || item.month || item.date) === month && item.variableName === 'Revenue');
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
            value: ordersValue, // For WebOrdersChart.jsx: expects value for orders line
            orders: ordersValue,
            revenue: revenueValue
        });
    });
    // Sort by month order
    const out = transformedData.sort((a, b) => months.indexOf(a.date) - months.indexOf(b.date));
    console.log('transformWebOrders output:', JSON.stringify(out));
    return out;
}
/**
 * Transforms raw data into Site Distribution format
 * @param data Raw data from the database
 * @returns Formatted Site Distribution data
 */
export function transformSiteDistribution(data) {
    console.log('transformSiteDistribution input:', JSON.stringify(data));
    // Filter data for Site Distribution chart group
    const siteData = data.filter(item => item.chartGroup === 'Site Distribution');
    const out = siteData.map(item => ({
        id: item.id || item.rowId || item.variableName,
        name: item.DataPoint || item.name || '',
        value: typeof item.value === 'string' ? parseFloat(item.value) : item.value
    }));
    console.log('transformSiteDistribution output:', JSON.stringify(out));
    return out;
}
