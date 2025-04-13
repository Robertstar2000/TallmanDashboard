/**
 * Functions for generating and transforming SQL queries for MS Access database
 */
/**
 * Transforms a standard SQL query to be compatible with MS Access syntax
 * @param sqlExpression The original SQL expression
 * @param tableName The table name
 * @returns SQL expression compatible with MS Access
 */
export function generateAccessSql(sqlExpression, tableName) {
    // MS Access specific transformations
    let accessSql = sqlExpression
        // Table references
        .replace(new RegExp(`FROM ${tableName}`, 'g'), `FROM [${tableName}]`)
        // Date functions
        .replace(/date\('now'\)/g, 'Date()')
        .replace(/date\(date\)/g, 'Format([date], "Short Date")')
        .replace(/datetime\('now'\)/g, 'Date()')
        .replace(/datetime\('now', '-(\d+) day'\)/g, 'DateAdd("d", -$1, Date())')
        .replace(/GETDATE\(\)/g, 'Date()')
        .replace(/DATEADD\(day, -(\d+), GETDATE\(\)\)/g, 'DateAdd("d", -$1, Date())')
        // Date parts extraction
        .replace(/strftime\('%m', date\)/g, 'Month([date])')
        .replace(/strftime\('%Y', date\)/g, 'Year([date])')
        .replace(/MONTH\(date\)/g, 'Month([date])')
        .replace(/YEAR\(date\)/g, 'Year([date])')
        // SQL Server specific syntax removal
        .replace(/WITH \(NOLOCK\)/g, '')
        // Function replacements
        .replace(/COALESCE\(([^,]+), ([^)]+)\)/g, 'IIf(IsNull($1), $2, $1)')
        .replace(/ISNULL\(([^,]+), ([^)]+)\)/g, 'IIf(IsNull($1), $2, $1)')
        // TOP clause (already compatible but ensuring it's formatted correctly)
        .replace(/TOP (\d+)/g, 'TOP $1');
    return accessSql;
}
/**
 * Generates a month-based SQL query for MS Access
 * @param baseTable The base table name
 * @param valueColumn The column to aggregate
 * @param condition Optional WHERE condition
 * @param months Number of months to include
 * @returns MS Access compatible SQL query
 */
export function generateMonthAccessSql(baseTable, valueColumn, condition = '', months = 12) {
    const whereClause = condition ? ` AND ${condition}` : '';
    return `
    SELECT 
      Month([date]) AS month,
      Year([date]) AS year,
      Sum([${valueColumn}]) AS value
    FROM [${baseTable}]
    WHERE 
      [date] >= DateAdd("m", -${months}, Date())${whereClause}
    GROUP BY 
      Month([date]), 
      Year([date])
    ORDER BY 
      Year([date]), 
      Month([date])
  `;
}
/**
 * Generates a day-based SQL query for MS Access
 * @param baseTable The base table name
 * @param valueColumn The column to aggregate
 * @param condition Optional WHERE condition
 * @param days Number of days to include
 * @returns MS Access compatible SQL query
 */
export function generateDayAccessSql(baseTable, valueColumn, condition = '', days = 7) {
    const whereClause = condition ? ` AND ${condition}` : '';
    return `
    SELECT 
      Format([date], "yyyy-mm-dd") AS day,
      Sum([${valueColumn}]) AS value
    FROM [${baseTable}]
    WHERE 
      [date] >= DateAdd("d", -${days}, Date())${whereClause}
    GROUP BY 
      Format([date], "yyyy-mm-dd")
    ORDER BY 
      Format([date], "yyyy-mm-dd")
  `;
}
