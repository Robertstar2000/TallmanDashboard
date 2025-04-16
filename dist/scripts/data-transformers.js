'use client';
// Type guards
function isMetricData(item) {
    return item.chartGroup === 'Metrics';
}
function isProductData(item) {
    return 'value' in item && item.chartGroup !== 'Metrics';
}
function isHistoricalData(item) {
    return 'historicalDate' in item;
}
function isAccountsPayableData(item) {
    return 'accountsPayableDate' in item;
}
function isCustomersData(item) {
    return 'customersDate' in item;
}
function isInventoryData(item) {
    return 'inventoryValueDate' in item;
}
function isSiteDistributionData(item) {
    return 'historicalDate' in item && 'columbus' in item;
}
// Helper function to clean up SQL expressions with embedded newlines and brackets
function cleanSqlExpression(sql) {
    if (!sql)
        return '';
    // Replace newlines and extra spaces
    let cleanedSql = sql.replace(/\s+/g, ' ').trim();
    // Fix MS Access date functions that might be split across lines
    cleanedSql = cleanedSql.replace(/DatePart\(\s*'m'\s*,\s*\[\s*RentalDate\s*\]\s*\)/g, "DatePart('m', [RentalDate])");
    cleanedSql = cleanedSql.replace(/DatePart\(\s*'yyyy'\s*,\s*\[\s*RentalDate\s*\]\s*\)/g, "DatePart('yyyy', [RentalDate])");
    return cleanedSql;
}
// Helper function to get chart name from either chartName field or chartGroup field
function getChartName(item) {
    if (item.chartName) {
        return item.chartName;
    }
    return item.chartGroup || '';
}
// Helper function to parse DataPoint into variable name and time component
function parseDataPoint(dataPoint) {
    if (!dataPoint)
        return { variableName: '', timeComponent: '' };
    // Check if DataPoint contains a comma
    if (dataPoint.includes(',')) {
        const [variableName, timeComponent] = dataPoint.split(',').map(part => part.trim());
        return { variableName, timeComponent };
    }
    // If no comma, try to extract month or time component
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (const month of months) {
        if (dataPoint.includes(month)) {
            const variableName = dataPoint.substring(0, dataPoint.indexOf(month)).trim();
            const timeComponent = month;
            return { variableName, timeComponent };
        }
    }
    // Try to extract numeric time components (e.g., "1-30 Days")
    const timePatterns = [
        /(\d+-\d+\s+Days)/i,
        /(\d+\+\s+Days)/i,
        /Today-(\d+)/i,
        /(\d+\s+Days)/i
    ];
    for (const pattern of timePatterns) {
        const match = dataPoint.match(pattern);
        if (match) {
            const timeComponent = match[0];
            const variableName = dataPoint.replace(timeComponent, '').trim();
            return { variableName, timeComponent };
        }
    }
    // Default case: just return the whole string as variable name
    return { variableName: dataPoint, timeComponent: '' };
}
// Function to transform raw data into spreadsheet rows
function transformToSpreadsheetRows(rawData) {
    return rawData.map(item => {
        // Base properties that all items have
        const base = {
            id: item.id || '',
            name: item.name || item.DataPoint || '',
            chartGroup: item.chartGroup || '',
            chartName: item.chartName || '',
            category: item.category || item.chartGroup || '',
            variableName: item.variableName || '',
            server: item.server || '',
            sqlExpression: cleanSqlExpression(item.sqlExpression) || '',
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
        else if (isMetricData(item)) {
            return Object.assign(Object.assign({}, base), { metricType: item.metricType });
        }
        else if (isProductData(item)) {
            return Object.assign(Object.assign({}, base), { category: item.category });
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
        const chartName = getChartName(item);
        return (chartName === 'Historical Data' || chartName === 'Monthly Sales' ||
            item.chartGroup === 'Historical Data' || item.chartGroup === 'Monthly Sales');
    });
    if (!filteredData.length) {
        console.warn('No historical data found');
        return [];
    }
    console.log(`Found ${filteredData.length} historical data items`);
    // Group by month, pivot variableName
    const monthlyData = {};
    filteredData.forEach(item => {
        // Extract month from DataPoint or variable name if possible
        let month = '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (item.DataPoint) {
            const { timeComponent } = parseDataPoint(item.DataPoint);
            if (months.includes(timeComponent)) {
                month = timeComponent;
            }
        }
        if (!month && item.variableName) {
            for (const m of months) {
                if (item.variableName.includes(m)) {
                    month = m;
                    break;
                }
            }
        }
        if (!month && item.id) {
            const idNum = parseInt(item.id);
            if (!isNaN(idNum) && idNum >= 1 && idNum <= 12) {
                month = months[idNum - 1];
            } else {
                month = 'Jan';
            }
        }
        if (!monthlyData[month]) {
            monthlyData[month] = { id: `historical-${month}`, date: month };
        }
        // Use variableName as key
        let key = (item.variableName || '').toLowerCase().replace(/[^a-z0-9]/gi, '_');
        if (!key) key = 'value';
        monthlyData[month][key] = parseFloat(item.value) || 0;
    });
    return Object.values(monthlyData);
}
function transformAccountsPayable(rawData) {
    const filteredData = rawData.filter(item => {
        if (!item) return false;
        const chartName = getChartName(item);
        return (chartName === 'Accounts' || chartName === 'Accounts Payable' ||
            item.chartGroup === 'Accounts' || item.chartGroup === 'Accounts Payable');
    });
    if (!filteredData.length) {
        console.warn('No accounts payable data found');
        return [];
    }
    console.log(`Found ${filteredData.length} accounts payable data items`);
    // Group by date, then pivot variableName to property
    const dateData = {};
    filteredData.forEach(item => {
        // Use date, fallback to id or today
        const date = item.accountsPayableDate || item.date || item.DataPoint || new Date().toISOString().split('T')[0];
        if (!dateData[date]) {
            dateData[date] = { id: `accounts-${date}`, date };
        }
        // Use variableName as the key
        let key = (item.variableName || '').toLowerCase().replace(/[^a-z0-9]/gi, '_');
        if (!key) key = 'value';
        dateData[date][key] = parseFloat(item.value) || 0;
    });
    // Return as array, preserving all variable columns
    return Object.values(dateData);
}
function transformCustomerMetrics(rawData) {
    const filteredData = rawData.filter(item => {
        if (!item) return false;
        const chartName = getChartName(item);
        return chartName === 'Customer Metrics' || item.chartGroup === 'Customer Metrics';
    });
    if (!filteredData.length) {
        console.warn('No customer metrics data found');
        return [];
    }
    // Group by date, then pivot variableName to property
    const dateData = {};
    filteredData.forEach(item => {
        const date = item.date || item.customerMetricsDate || item.DataPoint || new Date().toISOString().split('T')[0];
        if (!dateData[date]) {
            dateData[date] = { id: `customer-metrics-${date}`, date };
        }
        let key = (item.variableName || '').toLowerCase().replace(/[^a-z0-9]/gi, '_');
        if (!key) key = 'value';
        dateData[date][key] = parseFloat(item.value) || 0;
    });
    return Object.values(dateData);
}
function transformInventory(rawData) {
    const filteredData = rawData.filter(item => {
        if (!item) return false;
        return item.chartGroup === 'Inventory';
    });
    if (!filteredData.length) {
        console.warn('No inventory data found');
        return [];
    }
    // Group by department or variableName
    const deptData = {};
    filteredData.forEach(item => {
        const dept = item.department || item.variableName || 'Unknown';
        if (!deptData[dept]) {
            deptData[dept] = { id: item.id || `inventory-${dept}`, department: dept };
        }
        let key = (item.variableName || '').toLowerCase().replace(/[^a-z0-9]/gi, '_');
        if (!key) key = 'value';
        deptData[dept][key] = parseFloat(item.value) || 0;
    });
    return Object.values(deptData);
}
function transformPOROverview(rawData) {
    const filteredData = rawData.filter(item => item && item.chartGroup === 'POR Overview');
    if (!filteredData.length) {
        console.warn('No POR overview data found');
        return [];
    }
    // Group by date, then pivot variableName to property
    const dateData = {};
    filteredData.forEach(item => {
        const date = item.date || item.porOverviewDate || item.DataPoint || new Date().toISOString().split('T')[0];
        if (!dateData[date]) {
            dateData[date] = { id: item.id || `por-${date}`, date };
        }
        let key = (item.variableName || '').toLowerCase().replace(/[^a-z0-9]/gi, '_');
        if (!key) key = 'value';
        dateData[date][key] = parseFloat(item.value) || 0;
    });
    return Object.values(dateData);
}
function transformARData(rawData) {
    // First, try to find items with the chart name "AR Aging"
    let filteredData = rawData.filter(item => {
        if (!item) return false;
        const chartName = getChartName(item);
        return (chartName === 'AR Aging' || chartName === 'Accounts Receivable Aging' ||
            item.chartGroup === 'AR Aging' || item.chartGroup === 'Accounts Receivable Aging');
    });
    if (!filteredData.length) {
        console.warn('No AR aging data found');
        return [];
    }
    // Group by range, then pivot variableName if needed
    const agingData = {};
    filteredData.forEach(item => {
        let range = '';
        if (item.variableName) {
            range = item.variableName;
        } else if (item.range) {
            range = item.range;
        } else {
            range = 'Unknown';
        }
        if (!agingData[range]) {
            agingData[range] = { id: `ar-${range}`, range };
        }
        let key = (item.variableName || '').toLowerCase().replace(/[^a-z0-9]/gi, '_');
        if (!key) key = 'amount';
        agingData[range][key] = parseFloat(item.value) || 0;
    });
    return Object.values(agingData);
}
function transformDailyOrders(rawData) {
    const filteredData = rawData.filter(item => {
        if (!item) return false;
        return item.chartGroup === 'Daily Orders';
    });
    if (!filteredData.length) {
        console.warn('No daily orders data found');
        return [];
    }
    // Group by day, pivot variableName
    const dayData = {};
    filteredData.forEach(item => {
        let day = '';
        if (item.variableName) {
            day = item.variableName;
        } else if (item.day) {
            day = item.day;
        } else {
            day = 'Unknown';
        }
        if (!dayData[day]) {
            dayData[day] = { id: item.id || `daily-${day}`, day };
        }
        let key = (item.variableName || '').toLowerCase().replace(/[^a-z0-9]/gi, '_');
        if (!key) key = 'orders';
        dayData[day][key] = parseFloat(item.value) || 0;
    });
    return Object.values(dayData);
}
function transformWebOrders(rawData) {
    const filteredData = rawData.filter(item => {
        if (!item) return false;
        return item.chartGroup === 'Web Orders';
    });
    if (!filteredData.length) {
        console.warn('No web orders data found');
        return [];
    }
    // Group by month, pivot variableName
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    filteredData.forEach(item => {
        // Extract month from variableName or DataPoint
        let month = '';
        if (item.DataPoint) {
            const { timeComponent } = parseDataPoint(item.DataPoint);
            if (months.includes(timeComponent)) {
                month = timeComponent;
            }
        }
        if (!month && item.variableName) {
            for (const m of months) {
                if (item.variableName.includes(m)) {
                    month = m;
                    break;
                }
            }
        }
        if (!month && item.id) {
            const idNum = parseInt(item.id);
            if (!isNaN(idNum) && idNum >= 1 && idNum <= 12) {
                month = months[idNum - 1];
            } else {
                month = months[new Date().getMonth()];
            }
        }
        if (!monthlyData[month]) {
            monthlyData[month] = { id: `weborder-${month}`, date: month };
        }
        // Use variableName as key
        let key = (item.variableName || '').toLowerCase().replace(/[^a-z0-9]/gi, '_');
        if (!key) key = 'value';
        monthlyData[month][key] = parseFloat(item.value) || 0;
    });
    return Object.values(monthlyData);
}
function transformMetrics(rawData) {
    const metricItems = rawData.filter(item => {
        if (!item)
            return false;
        const chartName = getChartName(item);
        return chartName === 'Key Metrics' || item.chartGroup === 'Key Metrics';
    });
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
function transformDashboardData(rawData) {
    return {
        metrics: transformMetrics(rawData),
        historicalData: transformHistoricalData(rawData),
        accounts: transformAccountsPayable(rawData),
        customerMetrics: transformCustomerMetrics(rawData),
        inventory: transformInventory(rawData),
        porOverview: transformPOROverview(rawData),
        siteDistribution: transformSiteDistribution(rawData),
        arAging: transformARData(rawData),
        dailyOrders: transformDailyOrders(rawData),
        webOrders: transformWebOrders(rawData)
    };
}
export { transformToSpreadsheetRows, transformDashboardData, transformMetrics, transformHistoricalData, transformAccountsPayable, transformCustomerMetrics, transformDailyShipments, transformProducts, transformSiteDistribution, transformInventory, transformPOROverview, transformARData, transformDailyOrders, transformWebOrders, getTransformer, parseDataPoint, cleanSqlExpression };
