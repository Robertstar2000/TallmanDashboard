'use client';
// Type guards - using any to avoid TypeScript errors with property access
function isMetricData(item) {
    return item && item.chartGroup === 'Metrics';
}
function isProductData(item) {
    return item && 'value' in item && item.chartGroup !== 'Metrics';
}
function isHistoricalData(item) {
    return item && 'historicalDate' in item;
}
function isAccountsPayableData(item) {
    return item && 'accountsPayableDate' in item;
}
function isCustomersData(item) {
    return item && 'customersDate' in item;
}
function isInventoryData(item) {
    return item && 'inventoryValueDate' in item;
}
function isSiteDistributionData(item) {
    return item && 'historicalDate' in item && 'columbus' in item;
}
function isARAgingData(item) {
    return item && 'arAgingDate' in item;
}
// Function to transform raw data into spreadsheet rows
function transformToSpreadsheetRows(rawData) {
    return rawData.map(item => {
        if (!item)
            return {
                id: '',
                name: '',
                chartGroup: '',
                chartName: '',
                category: '',
                variableName: '',
                server: '',
                sqlExpression: '',
                tableName: '',
                value: ''
            };
        // Base properties that all items have
        const base = {
            id: item.id || '',
            name: item.name || '',
            chartGroup: item.chartGroup || '',
            chartName: item.chartName || '',
            category: item.category || item.chartGroup || '',
            variableName: item.variableName || '',
            server: item.server || '',
            sqlExpression: item.sqlExpression || '',
            tableName: item.tableName || '',
            value: item.value || 0
        };
        // Add specific properties based on the item type
        if (isHistoricalData(item)) {
            return Object.assign(Object.assign({}, base), { historicalDate: item.historicalDate });
        }
        else if (isAccountsPayableData(item)) {
            return Object.assign(Object.assign({}, base), { accountsPayableDate: item.accountsPayableDate });
        }
        else if (isCustomersData(item)) {
            return Object.assign(Object.assign({}, base), { customersDate: item.customersDate });
        }
        else if (isInventoryData(item)) {
            return Object.assign(Object.assign({}, base), { inventoryValueDate: item.inventoryValueDate });
        }
        else if (isSiteDistributionData(item)) {
            return Object.assign(Object.assign({}, base), { historicalDate: item.historicalDate });
        }
        else if (isARAgingData(item)) {
            return Object.assign(Object.assign({}, base), { arAgingDate: item.arAgingDate });
        }
        else if (isMetricData(item)) {
            return Object.assign(Object.assign({}, base), { metricType: item.metricType });
        }
        // Default case
        return base;
    });
}
// Add a new function to get a transformer by name
function getTransformer(name) {
    const transformers = {
        'double': (value) => value * 2,
        'triple': (value) => value * 3,
        'percentage': (value) => value / 100,
        'inverse': (value) => -value,
        'square': (value) => value * value,
    };
    return transformers[name] || null;
}
// Transform functions for dashboard data
function transformHistoricalData(rawData) {
    const filteredData = rawData.filter(item => {
        if (!item)
            return false;
        return (item.chartName === 'Historical Data' || item.chartName === 'Monthly Sales');
    });
    if (!filteredData.length) {
        console.warn('No historical data found');
        return [];
    }
    console.log(`Found ${filteredData.length} historical data items`);
    // Group data by month
    const monthlyData = {};
    filteredData.forEach(item => {
        // Extract month from variable name if possible
        let month = '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (item.variableName) {
            for (const m of months) {
                if (item.variableName.includes(m)) {
                    month = m;
                    break;
                }
            }
        }
        // If no month found, try to extract from ID or use a default
        if (!month && item.id) {
            const idNum = parseInt(item.id);
            if (!isNaN(idNum) && idNum >= 1 && idNum <= 12) {
                month = months[idNum - 1];
            }
            else {
                month = 'Jan'; // Default
            }
        }
        if (!monthlyData[month]) {
            monthlyData[month] = {
                id: `historical-${month}`,
                date: month,
                sales: 0,
                orders: 0
            };
        }
        // Update the appropriate field based on server
        if (item.serverName === 'P21') {
            monthlyData[month].sales = parseFloat(item.value) || 0;
        }
        else if (item.serverName === 'POR') {
            monthlyData[month].orders = parseFloat(item.value) || 0;
        }
    });
    return Object.values(monthlyData);
}
// MODIFIED: Ensure values are directly used from the admin spreadsheet
function transformMetrics(rawData) {
    const metricItems = rawData.filter(item => item && item.chartName === 'Key Metrics');
    return metricItems.map(item => {
        var _a;
        return ({
            id: item.id || `metric-${item.variableName}`,
            name: ((_a = item.variableName) === null || _a === void 0 ? void 0 : _a.toLowerCase().replace(/ /g, '_')) || '',
            // Directly use the value from the spreadsheet without additional processing
            value: typeof item.value === 'string' ? parseFloat(item.value) || 0 : (item.value || 0),
            change: 0, // Default to 0 since change is not in RawMetricData
            trend: 'neutral',
            color: 'blue' // Default color
        });
    });
}
function transformAccountsPayable(rawData) {
    const filteredData = rawData.filter(item => {
        if (!item)
            return false;
        return (item.chartName === 'Accounts' || item.chartName === 'Accounts Payable');
    });
    if (!filteredData.length) {
        console.warn('No accounts payable data found');
        return [];
    }
    console.log(`Found ${filteredData.length} accounts payable data items`);
    // Group by date
    const dateData = {};
    filteredData.forEach(item => {
        const date = item.accountsPayableDate || new Date().toISOString().split('T')[0];
        if (!dateData[date]) {
            dateData[date] = {
                id: `accounts-${date}`,
                date: date,
                payable: 0,
                receivable: 0,
                overdue: 0
            };
        }
        // Update based on variable name
        if (item.variableName === 'Current') {
            dateData[date].receivable = parseFloat(item.value) || 0;
        }
        else if (item.variableName === '30 Days') {
            dateData[date].payable = parseFloat(item.value) || 0;
        }
        else if (item.variableName === '60 Days' || item.variableName === '90 Days') {
            dateData[date].overdue += parseFloat(item.value) || 0;
        }
    });
    return Object.values(dateData);
}
function transformCustomers(rawData) {
    const filteredData = rawData.filter(item => item && item.chartName === 'Customer Metrics');
    return filteredData.map(item => ({
        id: item.id || `customer-${item.variableName}`,
        date: new Date().toISOString().split('T')[0],
        newCustomers: parseFloat(item.value) || 0
    }));
}
function transformDailyShipments(rawData) {
    const filteredData = rawData.filter(item => item && item.chartName === 'Daily Orders');
    return filteredData.map(item => ({
        id: item.id || `daily-${item.variableName}`,
        date: item.variableName,
        orders: parseFloat(item.value) || 0
    }));
}
function transformProducts(rawData) {
    const filteredData = rawData.filter(item => item && item.chartName === 'Products');
    return filteredData.map(item => ({
        id: item.id || `product-${item.variableName}`,
        category: item.variableName || '',
        inStock: parseFloat(item.value) || 0,
        onOrder: 0
    }));
}
function transformSiteDistribution(rawData) {
    // First, try to find items with the chart name "Site Distribution"
    let filteredData = rawData.filter(item => {
        if (!item)
            return false;
        return item.chartName === 'Site Distribution';
    });
    // If no items found, try to find items with site distribution data
    if (!filteredData.length) {
        filteredData = rawData.filter(item => {
            if (!item)
                return false;
            return isSiteDistributionData(item);
        });
    }
    if (!filteredData.length) {
        console.warn('No site distribution data found');
        return [];
    }
    console.log(`Found ${filteredData.length} site distribution data items`);
    // Transform the data
    return filteredData.map(item => ({
        id: item.id || `site-${item.variableName}`,
        name: item.variableName || '',
        value: parseFloat(item.value) || 0
    }));
}
function transformInventory(rawData) {
    const filteredData = rawData.filter(item => {
        if (!item)
            return false;
        return item.chartName === 'Inventory';
    });
    if (!filteredData.length) {
        console.warn('No inventory data found');
        return [];
    }
    console.log(`Found ${filteredData.length} inventory data items`);
    // Transform the data
    return filteredData.map(item => {
        const value = parseFloat(item.value) || 0;
        return {
            id: item.id || `inventory-${item.variableName}`,
            inStock: value,
            onOrder: 0
        };
    });
}
function transformPOROverview(rawData) {
    const filteredData = rawData.filter(item => item && item.chartName === 'POR Overview');
    return filteredData.map(item => ({
        id: item.id || `por-${item.variableName}`,
        date: new Date().toISOString().split('T')[0],
        newRentals: parseFloat(item.value) || 0,
        openRentals: 0,
        rentalValue: 0
    }));
}
function transformARData(rawData) {
    // First, try to find items with the chart name "AR Aging"
    let filteredData = rawData.filter(item => {
        if (!item)
            return false;
        return (item.chartName === 'AR Aging' || item.chartName === 'Accounts Receivable Aging');
    });
    if (!filteredData.length) {
        console.warn('No AR aging data found');
        return [];
    }
    console.log(`Found ${filteredData.length} AR aging data items`);
    // Group by aging category
    const agingData = {};
    filteredData.forEach(item => {
        let range = '';
        // Determine range based on variable name
        if (item.variableName === 'Current') {
            range = 'Current';
        }
        else if (item.variableName === '30 Days') {
            range = '1-30 Days';
        }
        else if (item.variableName === '60 Days') {
            range = '31-60 Days';
        }
        else if (item.variableName === '90 Days') {
            range = '61-90 Days';
        }
        else if (item.variableName === '120 Days') {
            range = '90+ Days';
        }
        else {
            range = item.variableName || 'Unknown';
        }
        if (!agingData[range]) {
            agingData[range] = {
                id: `ar-${range}`,
                range: range,
                amount: 0
            };
        }
        // Add value to the appropriate category
        agingData[range].amount += parseFloat(item.value) || 0;
    });
    return Object.values(agingData);
}
function transformDailyOrders(rawData) {
    const filteredData = rawData.filter(item => {
        if (!item)
            return false;
        return item.chartName === 'Daily Orders';
    });
    if (!filteredData.length) {
        console.warn('No daily orders data found');
        return [];
    }
    console.log(`Found ${filteredData.length} daily orders data items`);
    // Map day names to numbers
    const dayMap = {
        'sunday': '1',
        'monday': '2',
        'tuesday': '3',
        'wednesday': '4',
        'thursday': '5',
        'friday': '6',
        'saturday': '7',
        'sun': '1',
        'mon': '2',
        'tue': '3',
        'wed': '4',
        'thu': '5',
        'fri': '6',
        'sat': '7'
    };
    // Transform the data
    return filteredData.map(item => {
        let day = '';
        // Try to determine day from variable name
        if (item.variableName) {
            const lowerVar = item.variableName.toLowerCase();
            // Check if it's a number 1-7
            if (/^[1-7]$/.test(lowerVar)) {
                day = lowerVar;
            }
            // Check if it's a day name
            else {
                for (const [dayName, dayNum] of Object.entries(dayMap)) {
                    if (lowerVar.includes(dayName)) {
                        day = dayNum;
                        break;
                    }
                }
            }
        }
        // Default to Sunday if no day found
        if (!day) {
            day = '1';
        }
        return {
            id: item.id || `daily-${day}`,
            date: day,
            orders: parseFloat(item.value) || 0
        };
    });
}
function transformWebOrders(rawData) {
    const filteredData = rawData.filter(item => {
        if (!item)
            return false;
        return item.chartName === 'Web Orders';
    });
    if (!filteredData.length) {
        console.warn('No web orders data found');
        return [];
    }
    console.log(`Found ${filteredData.length} web orders data items`);
    // Group by month
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    // Pre-populate with empty data for all months
    months.forEach((month, index) => {
        const date = `${month} ${currentYear}`;
        monthlyData[date] = {
            id: `web-${index + 1}`,
            date: date,
            orders: 0,
            revenue: 0
        };
    });
    // Fill in actual data
    filteredData.forEach(item => {
        let monthName = '';
        // Try to extract month from variable name
        if (item.variableName) {
            for (const month of months) {
                if (item.variableName.includes(month)) {
                    monthName = month;
                    break;
                }
            }
        }
        // If no month found, use current month
        if (!monthName) {
            monthName = months[new Date().getMonth()];
        }
        const date = `${monthName} ${currentYear}`;
        // Update orders or revenue based on variable name
        if (item.variableName && item.variableName.toLowerCase().includes('revenue')) {
            monthlyData[date].revenue = parseFloat(item.value) || 0;
        }
        else {
            monthlyData[date].orders = parseFloat(item.value) || 0;
        }
    });
    return Object.values(monthlyData);
}
function transformDashboardData(rawData) {
    return {
        metrics: transformMetrics(rawData),
        historicalData: transformHistoricalData(rawData),
        accounts: transformAccountsPayable(rawData),
        customerMetrics: transformCustomers(rawData),
        inventory: transformInventory(rawData),
        porOverview: transformPOROverview(rawData),
        siteDistribution: transformSiteDistribution(rawData),
        arAging: transformARData(rawData),
        dailyOrders: transformDailyOrders(rawData),
        webOrders: transformWebOrders(rawData)
    };
}
export { transformToSpreadsheetRows, transformDashboardData, transformMetrics, transformHistoricalData, transformAccountsPayable, transformCustomers, transformDailyShipments, transformProducts, transformSiteDistribution, transformInventory, transformPOROverview, transformARData, transformDailyOrders, transformWebOrders, getTransformer };
