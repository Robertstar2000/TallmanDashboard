const fs = require('fs');

// Read the current allData.json
const allDataPath = './allData.json';
const allData = JSON.parse(fs.readFileSync(allDataPath, 'utf8'));

console.log('Fixing server assignments...');

let changes = 0;

allData.forEach((item, index) => {
    const shouldUsePOR = 
        // POR Overview entries
        item.chartGroup === 'POR_OVERVIEW' ||
        // Historical Data entries that are specifically POR variables
        (item.chartGroup === 'HISTORICAL_DATA' && 
         (item.variableName.includes('HistoricalPOR') || item.dataPoint.includes('POR Sales')));
    
    const currentServer = item.serverName;
    const targetServer = shouldUsePOR ? 'POR' : 'P21';
    
    if (currentServer !== targetServer) {
        console.log(`ID ${item.id}: ${item.variableName} - ${currentServer} -> ${targetServer}`);
        item.serverName = targetServer;
        
        // If changing from POR to P21, need to update SQL syntax
        if (currentServer === 'POR' && targetServer === 'P21') {
            // Convert MS Access syntax to SQL Server syntax
            let sql = item.productionSqlExpression;
            
            // Replace MS Access functions with SQL Server equivalents
            sql = sql.replace(/Nz\(([^,]+),\s*0\)/g, 'ISNULL($1, 0)');
            sql = sql.replace(/DATE\(\)/g, 'GETDATE()');
            sql = sql.replace(/YEAR\(DATE\(\)\)/g, 'YEAR(GETDATE())');
            
            // Update table references based on the table name
            if (item.tableName === 'vendor_invoices') {
                // These should actually be from P21 ap_invoices table
                sql = sql.replace(/vendor_invoices/g, 'dbo.ap_invoices WITH (NOLOCK)');
                sql = sql.replace(/invoice_amount/g, 'invoice_amt');
                item.tableName = 'ap_invoices';
                item.valueColumn = 'invoice_amt';
            } else if (item.tableName === 'customer_invoices') {
                // These should be from P21 ar_invoices table
                sql = sql.replace(/customer_invoices/g, 'dbo.ar_invoices WITH (NOLOCK)');
                sql = sql.replace(/balance_due/g, 'invoice_balance');
                item.tableName = 'ar_invoices';
                item.valueColumn = 'invoice_balance';
            } else if (item.tableName === 'customers') {
                sql = sql.replace(/customers/g, 'dbo.customers WITH (NOLOCK)');
            }
            
            item.productionSqlExpression = sql;
        }
        // If changing from P21 to POR, need to update SQL syntax
        else if (currentServer === 'P21' && targetServer === 'POR') {
            // Convert SQL Server syntax to MS Access syntax
            let sql = item.productionSqlExpression;
            
            // Replace SQL Server functions with MS Access equivalents
            sql = sql.replace(/ISNULL\(([^,]+),\s*0\)/g, 'Nz($1, 0)');
            sql = sql.replace(/GETDATE\(\)/g, 'DATE()');
            sql = sql.replace(/YEAR\(GETDATE\(\)\)/g, 'YEAR(DATE())');
            
            // Remove SQL Server specific syntax
            sql = sql.replace(/dbo\./g, '');
            sql = sql.replace(/WITH \(NOLOCK\)/g, '');
            
            item.productionSqlExpression = sql;
        }
        
        changes++;
    }
});

// Write the updated data back
fs.writeFileSync(allDataPath, JSON.stringify(allData, null, 2));

console.log(`\nFixed ${changes} server assignments.`);

// Create cache refresh markers
const refreshMarker = new Date().toISOString();
fs.writeFileSync('./data/refresh_required', refreshMarker);
fs.writeFileSync('./data/force_refresh.json', JSON.stringify({
    timestamp: refreshMarker,
    reason: "Fixed server assignments - POR vs P21",
    action: "FORCE_BACKGROUND_WORKER_REFRESH"
}, null, 2));

console.log('Created cache refresh markers.');
