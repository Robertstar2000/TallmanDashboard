const fs = require('fs');
const path = require('path');

// Table name mappings from incorrect names to correct schema names
const P21_TABLE_MAPPINGS = {
    'invoice_hdr': 'ar_invoices',
    'invoice_hd': 'ar_invoices', 
    'oe_hdr': 'sales_orders',
    'order_hdr': 'sales_orders',
    'customer_mst': 'customers',
    'inv_mast': 'products',
    'location_mst': 'inventory'
};

const POR_TABLE_MAPPINGS = {
    'rental_contract_id': 'contract_id',  // Column name fix
    'creation_date': 'created_date'       // Column name fix
};

// Column name mappings
const P21_COLUMN_MAPPINGS = {
    'total_amt_order': 'order_total',
    'amt_paid': 'amount_paid',
    'date_due': 'due_date',
    'date_': 'invoice_date',
    'order_date': 'order_date',
    'delete_flag': 'status'
};

const POR_COLUMN_MAPPINGS = {
    'amount': 'invoice_amount',
    'balance': 'balance_due',
    'delete_flag': 'status'
};

function fixSqlExpression(sqlExpression, serverName) {
    let fixedSql = sqlExpression;
    
    if (serverName === 'P21') {
        // Fix P21 table names
        Object.keys(P21_TABLE_MAPPINGS).forEach(oldTable => {
            const newTable = P21_TABLE_MAPPINGS[oldTable];
            const regex = new RegExp(`\\b${oldTable}\\b`, 'gi');
            fixedSql = fixedSql.replace(regex, newTable);
        });
        
        // Fix P21 column names
        Object.keys(P21_COLUMN_MAPPINGS).forEach(oldColumn => {
            const newColumn = P21_COLUMN_MAPPINGS[oldColumn];
            const regex = new RegExp(`\\b${oldColumn}\\b`, 'gi');
            fixedSql = fixedSql.replace(regex, newColumn);
        });
        
        // Fix P21 specific issues
        fixedSql = fixedSql.replace(/delete_flag = 'N'/gi, "status = 'Open'");
        fixedSql = fixedSql.replace(/delete_flag = 'Open'/gi, "status = 'Open'");
        
        // Add proper table schema prefix for P21 (SQL Server)
        fixedSql = fixedSql.replace(/FROM (\w+)/gi, 'FROM dbo.$1');
        fixedSql = fixedSql.replace(/JOIN (\w+)/gi, 'JOIN dbo.$1');
        
    } else if (serverName === 'POR') {
        // Fix POR specific issues  
        fixedSql = fixedSql.replace(/rental_contract_id/gi, 'contract_id');
        fixedSql = fixedSql.replace(/creation_date/gi, 'created_date');
        
        // Fix POR column names
        Object.keys(POR_COLUMN_MAPPINGS).forEach(oldColumn => {
            const newColumn = POR_COLUMN_MAPPINGS[oldColumn];
            const regex = new RegExp(`\\b${oldColumn}\\b`, 'gi');
            fixedSql = fixedSql.replace(regex, newColumn);
        });
        
        // Fix POR delete_flag references
        fixedSql = fixedSql.replace(/WHERE delete_flag = 'N'/gi, "WHERE status = 'Open'");
        fixedSql = fixedSql.replace(/AND delete_flag = 'N'/gi, "AND status = 'Open'");
        
        // Fix date functions for MS Access
        fixedSql = fixedSql.replace(/GETDATE\(\)/gi, 'Date()');
        fixedSql = fixedSql.replace(/DATEADD\(day,\s*(-?\d+),\s*Date\(\)\)/gi, 'DateAdd("d", $1, Date())');
        fixedSql = fixedSql.replace(/YEAR\(Date\(\)\)/gi, 'Year(Date())');
        fixedSql = fixedSql.replace(/MONTH\(([^)]+)\)/gi, 'Month($1)');
        fixedSql = fixedSql.replace(/YEAR\(([^)]+)\)/gi, 'Year($1)');
        
        // Remove SQL Server specific syntax
        fixedSql = fixedSql.replace(/ISNULL\(/gi, 'Nz(');
        fixedSql = fixedSql.replace(/WITH \(NOLOCK\)/gi, '');
        fixedSql = fixedSql.replace(/dbo\./gi, '');
    }
    
    return fixedSql.trim();
}

async function fixAllDataJson() {
    try {
        console.log('🔧 Starting table name and SQL expression fixes...');
        
        const allDataPath = path.join(__dirname, 'allData.json');
        const allData = JSON.parse(fs.readFileSync(allDataPath, 'utf8'));
        
        let fixedCount = 0;
        
        allData.forEach(item => {
            if (item.productionSqlExpression) {
                const originalSql = item.productionSqlExpression;
                const fixedSql = fixSqlExpression(originalSql, item.serverName);
                
                if (originalSql !== fixedSql) {
                    item.productionSqlExpression = fixedSql;
                    fixedCount++;
                    console.log(`✅ Fixed ${item.serverName} query for ${item.dataPoint}`);
                    console.log(`   Old: ${originalSql.substring(0, 80)}...`);
                    console.log(`   New: ${fixedSql.substring(0, 80)}...`);
                }
            }
        });
        
        // Write the corrected data back
        fs.writeFileSync(allDataPath, JSON.stringify(allData, null, 2));
        
        console.log(`\n🎉 Fixed ${fixedCount} SQL expressions!`);
        
        // Create cache refresh markers
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(dataDir, 'refresh_required'), new Date().toISOString());
        fs.writeFileSync(path.join(dataDir, 'cache-refresh.txt'), new Date().toISOString());
        fs.writeFileSync(path.join(dataDir, 'force_refresh.json'), JSON.stringify({
            timestamp: new Date().toISOString(),
            reason: "Fixed table names and SQL expressions to match database schema"
        }));
        
        console.log('📝 Created cache refresh markers');
        console.log('\n🚀 Table name fixes complete! Restart the backend to see updated data.');
        
    } catch (error) {
        console.error('❌ Error fixing table names:', error);
        process.exit(1);
    }
}

fixAllDataJson();
