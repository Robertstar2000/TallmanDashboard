/**
 * Utility to fix POR SQL expressions to use proper MS Access/Jet SQL syntax
 */
import { dashboardData as initialSpreadsheetData } from './single-source-data';
// Map of known table names in POR database to their actual names
const TABLE_NAME_MAP = {
    // Add mappings as we discover them
    'SOMAST': 'AccountingTransaction',
    'Rentals': 'AccountingTransaction',
    'Contracts': 'AccountingTransaction',
    'PurchaseOrder': 'AccountingTransaction',
    'Orders': 'AccountingTransaction',
    'Transactions': 'AccountingTransaction',
    'RentalContracts': 'AccountingTransaction',
    'Invoices': 'AccountingTransaction',
    'Customer': 'Customer',
    'Customers': 'Customer',
    'Inventory': 'Inventory',
    'Items': 'Inventory',
    'Products': 'Inventory',
    'Vendors': 'Vendor',
    'Suppliers': 'Vendor'
};
// Map of known column names for specific tables
const COLUMN_NAME_MAP = {
    'AccountingTransaction': {
        'SO_DATE': 'TransactionDate',
        'OrderType': 'TransactionType',
        'RentalStatus': 'Status',
        'ContractDate': 'TransactionDate',
        'RentalDate': 'TransactionDate',
        'CreatedDate': 'DateCreated',
        'Status': 'TransactionStatus',
        'OrderStatus': 'TransactionStatus',
        'OrderDate': 'TransactionDate',
        'Amount': 'TotalAmount',
        'Value': 'TotalAmount'
    },
    'Customer': {
        'CustomerID': 'CustomerNumber',
        'CustomerName': 'Name',
        'CustomerType': 'Type',
        'CustomerStatus': 'Status'
    },
    'Inventory': {
        'ItemID': 'ItemNumber',
        'ItemName': 'Description',
        'ItemType': 'Type',
        'ItemStatus': 'Status',
        'Quantity': 'QuantityOnHand',
        'OnOrder': 'QuantityOnOrder'
    }
};
/**
 * Fix a POR SQL expression to use proper MS Access/Jet SQL syntax
 *
 * MS Access/Jet SQL requirements:
 * - No schema prefixes (no "dbo.")
 * - No table hints (no "WITH (NOLOCK)")
 * - Uses Date() for current date
 * - Uses DateAdd/DateDiff with quoted interval types
 * - Uses Nz() for NULL handling
 * - Month() and Year() functions for date parts
 * - String literals use single quotes
 */
export function fixPORSqlExpression(sql, availableTables = []) {
    if (!sql)
        return sql;
    // Extract table name from SQL
    const tableMatch = sql.match(/FROM\s+([^\s,;()]+)/i);
    const tableName = tableMatch ? tableMatch[1].replace(/dbo\./i, '') : null;
    // Check if table exists in the database
    const tableExists = tableName && availableTables.length > 0 &&
        availableTables.some(t => t.toLowerCase() === tableName.toLowerCase());
    // If table doesn't exist, try to find a suitable replacement
    if (tableName && !tableExists) {
        // Try to find the table in our mapping
        const mappedTable = TABLE_NAME_MAP[tableName];
        if (mappedTable && availableTables.some(t => t.toLowerCase() === mappedTable.toLowerCase())) {
            sql = sql.replace(new RegExp(`FROM\\s+${tableName.replace(/\./g, '\\.')}\\b`, 'i'), `FROM ${mappedTable}`);
            // Also fix column names if we have mappings for them
            if (COLUMN_NAME_MAP[mappedTable]) {
                for (const [oldCol, newCol] of Object.entries(COLUMN_NAME_MAP[mappedTable])) {
                    sql = sql.replace(new RegExp(`\\b${oldCol}\\b`, 'gi'), newCol);
                }
            }
        }
        else {
            // Try to find a similar table name
            const possibleTables = availableTables.filter(t => t.toLowerCase().includes('transaction') ||
                t.toLowerCase().includes('accounting') ||
                t.toLowerCase().includes('customer') ||
                t.toLowerCase().includes('inventory'));
            if (possibleTables.length > 0) {
                // Use the first matching table as a best guess
                sql = sql.replace(new RegExp(`FROM\\s+${tableName.replace(/\./g, '\\.')}\\b`, 'i'), `FROM ${possibleTables[0]}`);
                // Add this mapping to our table map for future use
                console.log(`Adding new table mapping: ${tableName} -> ${possibleTables[0]}`);
                TABLE_NAME_MAP[tableName] = possibleTables[0];
            }
        }
    }
    // Fix date functions
    sql = sql.replace(/GETDATE\(\)/gi, 'Date()');
    // Fix DATEADD/DATEDIFF syntax
    sql = sql.replace(/DATEADD\((\w+),\s*([^,]+),\s*([^)]+)\)/gi, (match, interval, number, date) => `DateAdd('${interval}', ${number}, ${date})`);
    sql = sql.replace(/DATEDIFF\((\w+),\s*([^,]+),\s*([^)]+)\)/gi, (match, interval, date1, date2) => `DateDiff('${interval}', ${date1}, ${date2})`);
    // Fix NULL handling
    sql = sql.replace(/ISNULL\(([^,]+),\s*([^)]+)\)/gi, (match, expr, replacement) => `Nz(${expr}, ${replacement})`);
    // Remove schema prefixes
    sql = sql.replace(/dbo\./gi, '');
    // Remove table hints
    sql = sql.replace(/WITH\s*\([^)]+\)/gi, '');
    return sql;
}
/**
 * Get all POR SQL expressions from the spreadsheet data
 */
export function getAllPORSqlExpressions() {
    return initialSpreadsheetData
        .filter(item => item.serverName === 'POR' && item.sqlExpression)
        .map(item => ({
        id: item.id,
        dataPoint: item.DataPoint || `POR Expression ${item.id}`,
        sql: item.sqlExpression
    }));
}
/**
 * Fix all POR SQL expressions in the spreadsheet data
 */
export function fixAllPORSqlExpressions(availableTables = []) {
    const expressions = getAllPORSqlExpressions();
    return expressions.map(expr => ({
        id: expr.id,
        dataPoint: expr.dataPoint,
        originalSql: expr.sql,
        fixedSql: fixPORSqlExpression(expr.sql, availableTables)
    }));
}
