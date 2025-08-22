const fs = require('fs');
const path = require('path');

async function fixP21TableNames() {
    console.log('=== Fixing P21 Table Names in allData.json ===\n');
    
    // Read current allData.json
    const allDataPath = path.join(__dirname, '..', 'allData.json');
    const allData = JSON.parse(fs.readFileSync(allDataPath, 'utf8'));
    
    console.log(`Found ${allData.length} metrics in allData.json`);
    
    // Map of incorrect table names to correct P21 table names
    const tableNameMap = {
        'ar_invoices': 'ar_open_item',  // P21 standard AR table
        'ap_invoices': 'ap_open_item',  // P21 standard AP table
        'sales_orders': 'oe_hdr',       // P21 standard order header table
        'customers': 'customer_mst',    // P21 standard customer master
        'inventory': 'inv_mast',        // P21 standard inventory master
        'products': 'inv_mast'          // Same as inventory in P21
    };
    
    // Column name corrections for P21
    const columnNameMap = {
        'invoice_balance': 'amount',
        'invoice_amt': 'amount', 
        'invoice_date': 'invoice_date',
        'due_date': 'due_date',
        'status': 'void_flag',  // P21 uses void_flag instead of status
        'created_date': 'date_created',
        'order_date': 'order_date',
        'customer_id': 'customer_id'
    };
    
    let updatedCount = 0;
    
    // Update P21 entries
    allData.forEach(item => {
        if (item.serverName === 'P21') {
            let updated = false;
            
            // Fix table name in tableName field
            if (tableNameMap[item.tableName]) {
                console.log(`Updating table: ${item.tableName} -> ${tableNameMap[item.tableName]} for ${item.variableName}`);
                item.tableName = tableNameMap[item.tableName];
                updated = true;
            }
            
            // Fix SQL expression
            let sql = item.productionSqlExpression;
            
            // Replace table names in SQL
            Object.entries(tableNameMap).forEach(([oldTable, newTable]) => {
                const regex = new RegExp(`\\b${oldTable}\\b`, 'g');
                if (sql.includes(oldTable)) {
                    sql = sql.replace(regex, newTable);
                    updated = true;
                }
            });
            
            // Replace column names in SQL
            Object.entries(columnNameMap).forEach(([oldCol, newCol]) => {
                const regex = new RegExp(`\\b${oldCol}\\b`, 'g');
                if (sql.includes(oldCol)) {
                    sql = sql.replace(regex, newCol);
                    updated = true;
                }
            });
            
            // Fix P21-specific SQL syntax issues
            // Replace status = 'Open' with void_flag = 'N' (P21 convention)
            if (sql.includes("status = 'Open'")) {
                sql = sql.replace(/status = 'Open'/g, "void_flag = 'N'");
                updated = true;
            }
            
            // Update the SQL expression
            if (updated) {
                item.productionSqlExpression = sql;
                updatedCount++;
                console.log(`Updated SQL for ${item.variableName}`);
            }
        }
    });
    
    if (updatedCount > 0) {
        // Backup original file
        const backupPath = allDataPath + '.backup-' + new Date().toISOString().replace(/[:.]/g, '-');
        fs.copyFileSync(allDataPath, backupPath);
        console.log(`\n📁 Backup created: ${backupPath}`);
        
        // Write updated file
        fs.writeFileSync(allDataPath, JSON.stringify(allData, null, 2));
        console.log(`\n✅ Updated ${updatedCount} P21 metrics in allData.json`);
        
        // Show sample of changes
        console.log('\n📋 Sample updated queries:');
        allData.filter(item => item.serverName === 'P21').slice(0, 3).forEach(item => {
            console.log(`${item.variableName}: ${item.productionSqlExpression.substring(0, 80)}...`);
        });
        
    } else {
        console.log('\n⚠️ No P21 table names needed updating');
    }
}

fixP21TableNames().catch(console.error);
