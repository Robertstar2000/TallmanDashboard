/**
 * SQL Validator module
 * 
 * This module provides functions to validate SQL queries to prevent SQL injection
 * and ensure only safe operations are performed.
 */

// Allowlist of permissible SQL fragments in expressions
const ALLOWED_SQL_FRAGMENTS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT',
  'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL'
];

/**
 * Validates a SQL query to ensure it's safe to execute
 * 
 * @param sql The SQL query to validate
 * @returns boolean indicating if the SQL is valid and safe
 */
export function validateSql(sql: string): boolean {
  // Basic validation to prevent SQL injection
  const upperSql = sql.toUpperCase();
  
  // Only allow SELECT statements
  if (!upperSql.trim().startsWith('SELECT')) {
    console.warn('SQL Validation: Query must start with SELECT');
    return false;
  }
  
  // Disallow multiple statements
  if (upperSql.includes(';')) {
    console.warn('SQL Validation: Multiple statements are not allowed');
    return false;
  }
  
  // Disallow dangerous keywords
  if (upperSql.includes('DROP') || upperSql.includes('DELETE') || 
      upperSql.includes('UPDATE') || upperSql.includes('INSERT') || 
      upperSql.includes('CREATE') || upperSql.includes('ALTER') ||
      upperSql.includes('TRUNCATE') || upperSql.includes('EXEC')) {
    console.warn('SQL Validation: Dangerous keywords detected');
    return false;
  }
  
  return true;
}

/**
 * Sanitizes a SQL query by removing potentially dangerous parts
 * 
 * @param sql The SQL query to sanitize
 * @returns Sanitized SQL query
 */
export function sanitizeSql(sql: string): string {
  // Basic sanitization
  return sql.replace(/;/g, '');
}
