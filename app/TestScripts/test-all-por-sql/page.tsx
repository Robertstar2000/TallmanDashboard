'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Divider, Tabs, Tab, List, ListItem, ListItemText, Chip, TextField, Alert } from '@mui/material';
import Link from 'next/link';
import { dashboardData as initialSpreadsheetData } from '../../../lib/db/single-source-data';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ padding: '20px' }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function TestAllPORSQLPage() {
  const [porExpressions, setPorExpressions] = useState<any[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [porFilePath, setPorFilePath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [testingIndex, setTestingIndex] = useState<number>(-1);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testErrors, setTestErrors] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedExpression, setSelectedExpression] = useState<any>(null);
  const [editedSql, setEditedSql] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [updateError, setUpdateError] = useState<string>('');
  const [successfulExpressions, setSuccessfulExpressions] = useState<any[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<{
    expressionId: number;
    dataPoint: string;
    originalSql: string;
    potentialTables: Array<{
      tableName: string;
      columnSimilarityScore: number;
      semanticSimilarityScore: number;
      combinedScore: number;
    }>;
  } | null>(null);

  // New state for interactive table matching
  const [currentMatching, setCurrentMatching] = useState<{
    expressionId: string;
    dataPoint: string;
    originalSql: string;
    currentTable: string;
    currentSql: string;
    result: any;
    remainingTables: string[];
    testedTables: string[];
    originalTableName: string;
  } | null>(null);

  // State for tracking testing progress
  const [currentTestingTable, setCurrentTestingTable] = useState<string>('');
  const [currentTestingExpression, setCurrentTestingExpression] = useState<any>(null);
  const [tableProgress, setTableProgress] = useState<{ current: number, total: number }>({ current: 0, total: 0 });
  const [tableColumns, setTableColumns] = useState<{ [tableName: string]: string[] }>({});
  const [selectedTable, setSelectedTable] = useState<string>('');

  // Function to try SQL expression with different tables
  const tryWithDifferentTables = async (expr: any, tables: string[]): Promise<void> => {
    // Extract the table name from the SQL
    const sql = expr.fixedSql;
    const tableMatch = sql.match(/FROM\s+([^\s,;()]+)/i);
    if (!tableMatch) {
      setTestErrors(prev => [...prev, {
        id: expr.id,
        dataPoint: expr.dataPoint,
        sql: expr.fixedSql,
        originalSql: expr.sql,
        error: 'Could not extract table name from SQL',
        hasNonZeroResult: false
      }]);
      return;
    }

    const originalTableName = tableMatch[1];
    const tablesToTry = [...tables];

    // Start with the interactive matching process
    await tryNextTable(expr, originalTableName, tablesToTry, []);
  };

  // Function to try the next table in the list
  const tryNextTable = async (
    expr: any,
    originalTableName: string,
    remainingTables: string[],
    testedTables: string[]
  ): Promise<void> => {
    if (remainingTables.length === 0) {
      // All tables have been tried without success
      setTestErrors(prev => [...prev, {
        id: expr.id,
        dataPoint: expr.dataPoint,
        sql: expr.fixedSql,
        originalSql: expr.sql,
        error: 'Failed with all available tables',
        testedTables,
        hasNonZeroResult: false
      }]);

      // Clear the current matching
      setCurrentMatching(null);
      setCurrentTestingTable('');
      setTableProgress({ current: 0, total: 0 });

      // Continue to the next expression
      continueTestingNextExpression();
      return;
    }

    // Get the next table to try
    const currentTable = remainingTables[0];
    const newRemainingTables = remainingTables.slice(1);
    const newTestedTables = [...testedTables, currentTable];

    // Update progress
    setCurrentTestingTable(currentTable);
    setTableProgress({
      current: testedTables.length + 1,
      total: testedTables.length + remainingTables.length
    });

    // Replace the table name
    let testSql = expr.fixedSql.replace(
      new RegExp(`FROM\\s+${originalTableName.replace(/\./g, '\\.')}\\b`, 'i'),
      `FROM ${currentTable}`
    );

    // Get columns for the current table if not already cached
    if (!tableColumns[currentTable]) {
      await getTableColumns(currentTable);
    }
    
    // Adjust column names in the SQL if we have column information
    if (tableColumns[currentTable] && tableColumns[currentTable].length > 0) {
      testSql = adjustSqlColumnNames(testSql, tableColumns[currentTable]);
    }

    try {
      const response = await fetch('/api/test-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sqlExpression: testSql,
          serverType: 'POR'
        }),
      });

      const data = await response.json();

      if (!data.error) {
        // Check if the result has a value property and it's non-zero
        const hasNonZeroResult = data.result &&
          (typeof data.result.value !== 'undefined' &&
            data.result.value !== null &&
            data.result.value !== 0);

        if (hasNonZeroResult) {
          // Found a successful match - show it to the user for acceptance or skipping
          setCurrentMatching({
            expressionId: expr.id,
            dataPoint: expr.dataPoint,
            originalSql: expr.sql,
            currentTable,
            currentSql: testSql,
            result: data.result,
            remainingTables: newRemainingTables,
            testedTables: newTestedTables,
            originalTableName
          });

          // Automatically switch to the interactive matching tab
          setTabValue(5);
          return;
        }
      }

      // This table didn't work, try the next one
      await tryNextTable(expr, originalTableName, newRemainingTables, newTestedTables);
    } catch (error) {
      // Continue to the next table on error
      console.log(`Error with table ${currentTable}:`, error);
      await tryNextTable(expr, originalTableName, newRemainingTables, newTestedTables);
    }
  };

  // Function to get columns for a table
  const getTableColumns = async (tableName: string) => {
    try {
      const response = await fetch('/api/get-table-columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName,
          serverType: 'POR'
        }),
      });

      const data = await response.json();
      
      if (!data.error && data.columns) {
        setTableColumns(prev => ({
          ...prev,
          [tableName]: data.columns
        }));
      }
      
      setSelectedTable(tableName);
    } catch (error) {
      console.error('Error fetching table columns:', error);
    }
  };

  // Accept the current match and continue testing
  const acceptCurrentMatch = () => {
    if (!currentMatching) return;

    // Add to successful results
    setTestResults(prev => [...prev, {
      id: currentMatching.expressionId,
      dataPoint: currentMatching.dataPoint,
      sql: currentMatching.originalSql,
      fixedSql: currentMatching.currentSql,
      tableName: currentMatching.currentTable,
      result: currentMatching.result
    }]);

    // Update the expression in the list
    setPorExpressions(prev => prev.map(expr => 
      expr.id === currentMatching.expressionId
        ? { ...expr, fixedSql: currentMatching.currentSql }
        : expr
    ));

    // Add to successful expressions for batch update
    setSuccessfulExpressions(prev => [
      ...prev,
      {
        id: currentMatching.expressionId,
        productionSqlExpression: currentMatching.currentSql
      }
    ]);

    // Clear the current matching
    setCurrentMatching(null);

    // Continue testing the next expression
    continueTestingNextExpression();
  };

  // Skip the current match and try the next table
  const skipCurrentMatch = async () => {
    if (!currentMatching) return;

    // Try the next table
    await tryNextTable(
      porExpressions.find(expr => expr.id === currentMatching.expressionId),
      currentMatching.originalTableName,
      currentMatching.remainingTables,
      currentMatching.testedTables
    );
  };

  // Function to continue testing the next expression
  const continueTestingNextExpression = () => {
    const nextIndex = testingIndex + 1;
    if (nextIndex < porExpressions.length) {
      setTestingIndex(nextIndex);
      const nextExpr = porExpressions[nextIndex];
      tryWithDifferentTables(nextExpr, availableTables);
    } else {
      // All expressions have been tested
      setTestingIndex(-1);
      setLoading(false);
    }
  };

  // Fix POR SQL expression with more advanced table matching
  const fixPORSqlExpression = (sql: string, availableTables: string[]): string => {
    if (!sql) return sql;

    // Fix common syntax issues for MS Access
    let fixedSql = sql;

    // Remove schema prefixes
    fixedSql = fixedSql.replace(/dbo\./gi, '');

    // Remove table hints
    fixedSql = fixedSql.replace(/WITH\s*\([^)]+\)/gi, '');

    // Fix date functions
    fixedSql = fixedSql.replace(/GETDATE\(\)/gi, 'Date()');

    // Fix DATEADD/DATEDIFF syntax
    fixedSql = fixedSql.replace(/DATEADD\((\w+),\s*([^,]+),\s*([^)]+)\)/gi,
      (match, interval, number, date) => `DateAdd('${interval}', ${number}, ${date})`);

    fixedSql = fixedSql.replace(/DATEDIFF\((\w+),\s*([^,]+),\s*([^)]+)\)/gi,
      (match, interval, date1, date2) => `DateDiff('${interval}', ${date1}, ${date2})`);

    // Fix NULL handling
    fixedSql = fixedSql.replace(/ISNULL\(([^,]+),\s*([^)]+)\)/gi,
      (match, expr, replacement) => `Nz(${expr}, ${replacement})`);

    return fixedSql;
  };

  // Get all POR SQL expressions
  const getAllPORSqlExpressions = () => {
    // Filter for POR SQL expressions (IDs 127-174)
    const porExpressions = initialSpreadsheetData
      .filter(item => {
        const id = parseInt(item.id);
        return id >= 127 && id <= 174;
      })
      .map(item => ({
        id: item.id,
        dataPoint: item.DataPoint,
        sql: item.productionSqlExpression,
        fixedSql: ''
      }));

    return porExpressions;
  };

  // Function to calculate string similarity (Levenshtein distance)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const track = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    return track[str2.length][str1.length];
  };
  
  // Function to sort tables by similarity to the original table name
  const sortTablesBySimilarity = (originalTable: string, tables: string[]): string[] => {
    // Remove any schema prefix (dbo.) from the original table name
    const cleanOriginalTable = originalTable.replace(/^dbo\./, '');
    
    // Sort tables by similarity (lower distance = more similar)
    return [...tables].sort((a, b) => {
      const distanceA = calculateSimilarity(cleanOriginalTable.toLowerCase(), a.toLowerCase());
      const distanceB = calculateSimilarity(cleanOriginalTable.toLowerCase(), b.toLowerCase());
      return distanceA - distanceB;
    });
  };
  
  // Function to find the closest matching column name
  const findClosestColumnMatch = (columnName: string, availableColumns: string[]): string | null => {
    if (!columnName || availableColumns.length === 0) return null;
    
    // Check for exact match first (case insensitive)
    const exactMatch = availableColumns.find(col => 
      col.toLowerCase() === columnName.toLowerCase()
    );
    
    if (exactMatch) return exactMatch;
    
    // Find closest match based on similarity
    let closestMatch = null;
    let minDistance = Number.MAX_SAFE_INTEGER;
    
    availableColumns.forEach(col => {
      const distance = calculateSimilarity(columnName.toLowerCase(), col.toLowerCase());
      
      // Consider it a match if the distance is less than half the length of the column name
      // This is a heuristic to avoid matching completely different columns
      if (distance < Math.min(columnName.length, col.length) * 0.5 && distance < minDistance) {
        minDistance = distance;
        closestMatch = col;
      }
    });
    
    return closestMatch;
  };
  
  // Function to adjust SQL with corrected column names
  const adjustSqlColumnNames = (sql: string, tableColumns: string[]): string => {
    if (!sql || tableColumns.length === 0) return sql;
    
    let adjustedSql = sql;
    
    // Extract column references from SQL
    const columnRegexes = [
      /SELECT\s+(.*?)\s+FROM/i,  // SELECT clause
      /WHERE\s+(.*?)(?:GROUP BY|ORDER BY|$)/i,  // WHERE clause
      /GROUP BY\s+(.*?)(?:ORDER BY|$)/i,  // GROUP BY clause
      /ORDER BY\s+(.*?)(?:$)/i,  // ORDER BY clause
    ];
    
    // Process each regex match
    columnRegexes.forEach(regex => {
      const match = adjustedSql.match(regex);
      if (!match || !match[1]) return;
      
      const clauseContent = match[1];
      let adjustedClauseContent = clauseContent;
      
      // Skip if it's just * or COUNT(*)
      if (clauseContent.trim() === '*' || clauseContent.toUpperCase().includes('COUNT(*)')) {
        return;
      }
      
      // Extract individual column references
      let columnMatches: RegExpMatchArray | null;
      const columnRegex = /([a-zA-Z0-9_]+)(?:\.[a-zA-Z0-9_]+)?/g;
      
      while ((columnMatches = columnRegex.exec(clauseContent)) !== null) {
        const originalColumn = columnMatches[1];
        
        // Skip common SQL keywords and functions
        const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
        if (sqlKeywords.includes(originalColumn.toUpperCase())) continue;
        
        // Find closest match for this column
        const closestMatch = findClosestColumnMatch(originalColumn, tableColumns);
        
        if (closestMatch && closestMatch !== originalColumn) {
          // Replace the column name in the clause content
          adjustedClauseContent = adjustedClauseContent.replace(
            new RegExp(`\\b${originalColumn}\\b`, 'g'), 
            closestMatch
          );
        }
      }
      
      // Replace the original clause content with the adjusted one
      if (adjustedClauseContent !== clauseContent) {
        adjustedSql = adjustedSql.replace(clauseContent, adjustedClauseContent);
      }
    });
    
    return adjustedSql;
  };
  
  // Function to check if columns in SQL are compatible with table columns
  const checkColumnCompatibility = async (sql: string, tableName: string): Promise<boolean> => {
    try {
      // Get columns for the table if not already cached
      if (!tableColumns[tableName]) {
        await getTableColumns(tableName);
      }
      
      const columns = tableColumns[tableName];
      if (!columns || columns.length === 0) {
        return true; // If we can't get columns, assume compatible
      }
      
      // Extract column names from SQL
      const columnMatches = sql.match(/SELECT\s+.*?FROM|WHERE\s+([^\s]+)\s*=|GROUP\s+BY\s+([^\s,]+)|ORDER\s+BY\s+([^\s,]+)/gi);
      if (!columnMatches) {
        return true; // If we can't extract columns, assume compatible
      }
      
      // Extract individual column names from the matches
      const sqlColumns: string[] = [];
      columnMatches.forEach(match => {
        // Handle SELECT clause
        if (match.toUpperCase().startsWith('SELECT')) {
          const selectPart = match.substring(6, match.toUpperCase().indexOf('FROM')).trim();
          // Skip if it's SELECT * or SELECT COUNT(*)
          if (selectPart === '*' || selectPart.toUpperCase().includes('COUNT(*)')) {
            return;
          }
          
          // Split by commas and extract column names
          const selectColumns = selectPart.split(',')
            .map(col => col.trim().split(' ')[0].replace(/^.*\./, '')) // Remove table prefix and aliases
            .filter(col => col !== '*' && !col.includes('(') && !col.includes(')'));
          
          sqlColumns.push(...selectColumns);
        } else {
          // Handle WHERE, GROUP BY, ORDER BY clauses
          const colName = match.replace(/WHERE\s+|GROUP\s+BY\s+|ORDER\s+BY\s+|=.*/gi, '').trim()
            .replace(/^.*\./, ''); // Remove table prefix
          
          if (colName && !colName.includes('(') && !colName.includes(')')) {
            sqlColumns.push(colName);
          }
        }
      });
      
      // Check if at least 50% of extracted columns exist in the table
      if (sqlColumns.length === 0) {
        return true; // No specific columns to check
      }
      
      const columnsLower = columns.map(c => c.toLowerCase());
      const matchingColumns = sqlColumns.filter(col => 
        columnsLower.includes(col.toLowerCase())
      );
      
      // Consider compatible if at least 50% of columns match
      return matchingColumns.length >= sqlColumns.length * 0.5;
    } catch (error) {
      console.error('Error checking column compatibility:', error);
      return true; // On error, assume compatible
    }
  };
  
  // Function to extract column names from SQL expression
  const extractColumnsFromSql = (sql: string): string[] => {
    if (!sql) return [];
    
    const columns: string[] = [];
    
    // Extract column references from SQL
    const columnRegexes = [
      /SELECT\s+(.*?)\s+FROM/i,  // SELECT clause
      /WHERE\s+(.*?)(?:GROUP BY|ORDER BY|$)/i,  // WHERE clause
      /GROUP BY\s+(.*?)(?:ORDER BY|$)/i,  // GROUP BY clause
      /ORDER BY\s+(.*?)(?:$)/i,  // ORDER BY clause
    ];
    
    // Process each regex match
    columnRegexes.forEach(regex => {
      const match = sql.match(regex);
      if (!match || !match[1]) return;
      
      const clauseContent = match[1];
      
      // Skip if it's just * or COUNT(*)
      if (clauseContent.trim() === '*' || clauseContent.toUpperCase().includes('COUNT(*)')) {
        return;
      }
      
      // Extract individual column references
      let columnMatches: RegExpMatchArray | null;
      const columnRegex = /([a-zA-Z0-9_]+)(?:\.[a-zA-Z0-9_]+)?/g;
      
      while ((columnMatches = columnRegex.exec(clauseContent)) !== null) {
        const columnName = columnMatches[1];
        
        // Skip common SQL keywords and functions
        const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
        if (sqlKeywords.includes(columnName.toUpperCase())) continue;
        
        // Add to columns array if not already there
        if (!columns.includes(columnName)) {
          columns.push(columnName);
        }
      }
    });
    
    return columns;
  };
  
  // Function to calculate column similarity score between SQL and table
  const calculateColumnSimilarityScore = (sqlColumns: string[], tableColumns: string[]): number => {
    if (!sqlColumns.length || !tableColumns.length) return 0;
    
    let matchScore = 0;
    const tableColumnsLower = tableColumns.map(col => col.toLowerCase());
    
    // For each column in the SQL, find the best match in the table
    sqlColumns.forEach(sqlCol => {
      // First check for exact match
      if (tableColumnsLower.includes(sqlCol.toLowerCase())) {
        matchScore += 1;
        return;
      }
      
      // Then check for similar match
      let bestMatchScore = 0;
      tableColumnsLower.forEach(tableCol => {
        const distance = calculateSimilarity(sqlCol.toLowerCase(), tableCol);
        const similarity = 1 - (distance / Math.max(sqlCol.length, tableCol.length));
        if (similarity > 0.7 && similarity > bestMatchScore) {  // 70% similarity threshold
          bestMatchScore = similarity;
        }
      });
      
      matchScore += bestMatchScore;
    });
    
    // Normalize score based on number of columns in SQL
    return matchScore / sqlColumns.length;
  };
  
  // Function to sort tables by column similarity to the original SQL
  const sortTablesByColumnSimilarity = async (
    sql: string, 
    tables: string[]
  ): Promise<string[]> => {
    // Extract columns from the SQL
    const sqlColumns = extractColumnsFromSql(sql);
    if (sqlColumns.length === 0) {
      // If no columns extracted, fall back to table name similarity
      return sortTablesBySimilarity(sql.match(/FROM\s+([^\s,;()]+)/i)?.[1] || '', tables);
    }
    
    // Get columns for each table if not already cached
    const tableScores: {table: string, score: number}[] = [];
    
    for (const table of tables) {
      // Get columns for the table if not already cached
      if (!tableColumns[table]) {
        await getTableColumns(table);
      }
      
      const columns = tableColumns[table] || [];
      const score = calculateColumnSimilarityScore(sqlColumns, columns);
      
      tableScores.push({
        table,
        score
      });
    }
    
    // Sort tables by score (higher is better)
    tableScores.sort((a, b) => b.score - a.score);
    
    // Return sorted table names
    return tableScores.map(item => item.table);
  };

  // Function to calculate semantic similarity between two strings
  const calculateSemanticSimilarity = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;
    
    // Convert to lowercase and split into words
    const words1 = str1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const words2 = str2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Count matching words
    let matchCount = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => {
        // Check for exact match or high similarity
        if (word2 === word1) return true;
        const distance = calculateSimilarity(word1, word2);
        return distance <= Math.min(word1.length, word2.length) * 0.3; // 70% similarity threshold
      })) {
        matchCount++;
      }
    });
    
    // Normalize score based on the shorter string's word count
    return matchCount / Math.min(words1.length, words2.length);
  };

  // Function to find potential table matches based on column and semantic similarity
  const findPotentialMatches = async (expr: any): Promise<void> => {
    // Extract columns from the SQL
    const sqlColumns = extractColumnsFromSql(expr.sql);
    if (sqlColumns.length === 0) {
      // If no columns extracted, continue with normal testing
      await testNextExpression(testingIndex + 1);
      return;
    }
    
    // Calculate potential matches for all tables
    const potentialTableMatches: Array<{
      tableName: string;
      columnSimilarityScore: number;
      semanticSimilarityScore: number;
      combinedScore: number;
    }> = [];
    
    for (const table of availableTables) {
      // Get columns for the table if not already cached
      if (!tableColumns[table]) {
        await getTableColumns(table);
      }
      
      const columns = tableColumns[table] || [];
      
      // Calculate column similarity score
      const columnScore = calculateColumnSimilarityScore(sqlColumns, columns);
      
      // Calculate semantic similarity between expression title and table name
      const semanticScore = calculateSemanticSimilarity(expr.dataPoint, table);
      
      // Calculate combined score (weighted average)
      const combinedScore = (columnScore * 0.7) + (semanticScore * 0.3);
      
      // Only include tables with a minimum combined score
      if (combinedScore > 0.3) {
        potentialTableMatches.push({
          tableName: table,
          columnSimilarityScore: columnScore,
          semanticSimilarityScore: semanticScore,
          combinedScore
        });
      }
    }
    
    // Sort by combined score (highest first)
    potentialTableMatches.sort((a, b) => b.combinedScore - a.combinedScore);
    
    // Take top 5 matches
    const topMatches = potentialTableMatches.slice(0, 5);
    
    if (topMatches.length > 0) {
      // Set potential matches for display
      setPotentialMatches({
        expressionId: expr.id,
        dataPoint: expr.dataPoint,
        originalSql: expr.sql,
        potentialTables: topMatches
      });
      
      // Switch to the potential matches tab
      setTabValue(6);
    } else {
      // No potential matches, continue with normal testing
      await testNextExpression(testingIndex + 1);
    }
  };

  // Function to skip all potential matches and continue testing
  const skipPotentialMatches = async () => {
    setPotentialMatches(null);
    await testNextExpression(testingIndex + 1);
  };

  // Function to select a potential match for testing
  const selectPotentialMatch = async (tableName: string) => {
    if (!potentialMatches) return;
    
    const expr = porExpressions[testingIndex];
    const originalTableName = expr.sql.match(/FROM\s+([^\s,;()]+)/i)?.[1] || '';
    
    // Replace the table name in the SQL
    let testSql = expr.sql.replace(
      new RegExp(`FROM\\s+${originalTableName.replace(/\./g, '\\.')}\\b`, 'i'),
      `FROM ${tableName}`
    );
    
    // Get columns for the selected table
    if (!tableColumns[tableName]) {
      await getTableColumns(tableName);
    }
    
    // Adjust column names in the SQL
    if (tableColumns[tableName] && tableColumns[tableName].length > 0) {
      testSql = adjustSqlColumnNames(testSql, tableColumns[tableName]);
    }
    
    try {
      const response = await fetch('/api/test-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sqlExpression: testSql,
          serverType: 'POR'
        }),
      });

      const data = await response.json();

      if (!data.error) {
        // Check if the result has a value property and it's non-zero
        const hasNonZeroResult = data.result &&
          (typeof data.result.value !== 'undefined' &&
            data.result.value !== null &&
            data.result.value !== 0);

        if (hasNonZeroResult) {
          // Found a successful match - show it to the user for acceptance or skipping
          setCurrentMatching({
            expressionId: expr.id,
            dataPoint: expr.dataPoint,
            originalSql: expr.sql,
            currentTable: tableName,
            currentSql: testSql,
            result: data.result,
            remainingTables: [],
            testedTables: [],
            originalTableName
          });

          // Clear potential matches
          setPotentialMatches(null);
          
          // Switch to the interactive matching tab
          setTabValue(5);
          return;
        }
      }
      
      // This table didn't work, continue with normal testing
      setPotentialMatches(null);
      await testNextExpression(testingIndex + 1);
    } catch (error) {
      // Continue with normal testing on error
      console.log(`Error with table ${tableName}:`, error);
      setPotentialMatches(null);
      await testNextExpression(testingIndex + 1);
    }
  };

  useEffect(() => {
    // Load all POR expressions
    const expressions = getAllPORSqlExpressions();
    setPorExpressions(expressions);

    // Get available tables on load
    const fetchAvailableTables = async () => {
      try {
        const response = await fetch('/api/test-por-sql');
        const data = await response.json();

        if (data.availableTables) {
          setAvailableTables(data.availableTables);
        }

        if (data.porFilePath) {
          setPorFilePath(data.porFilePath);
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
      }
    };
    fetchAvailableTables();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const selectExpression = (expr: any) => {
    setSelectedExpression(expr);
    setEditedSql(expr.fixedSql || expr.sql);
  };

  const updateSqlExpression = async () => {
    if (!selectedExpression) return;

    try {
      setUpdateStatus('Updating...');
      setUpdateError('');

      const response = await fetch('/api/update-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedExpression.id,
          productionSqlExpression: editedSql
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUpdateStatus('Updated successfully!');

        // Update the local state
        setPorExpressions(prev => prev.map(expr =>
          expr.id === selectedExpression.id
            ? { ...expr, sql: editedSql, fixedSql: editedSql }
            : expr
        ));

        // Update test results if this expression was tested
        setTestResults(prev => prev.map(result =>
          result.id === selectedExpression.id
            ? { ...result, sql: editedSql, originalSql: editedSql }
            : result
        ));

        // Update test errors if this expression had errors
        setTestErrors(prev => prev.map(error =>
          error.id === selectedExpression.id
            ? { ...error, sql: editedSql, originalSql: editedSql }
            : error
        ));
      } else {
        setUpdateError(data.error || 'Failed to update SQL expression');
      }
    } catch (error: any) {
      setUpdateError(error.message || 'An error occurred while updating');
    } finally {
      setTimeout(() => {
        setUpdateStatus('');
      }, 3000);
    }
  };

  // Test all SQL expressions
  const testAllExpressions = async () => {
    if (loading) return;
    
    setLoading(true);
    setTestResults([]);
    setTestErrors([]);
    setSuccessfulExpressions([]);
    setTestingIndex(0);
    
    // Reset the expressions with fixed SQL
    setPorExpressions(prev => prev.map(expr => ({
      ...expr,
      fixedSql: expr.sql
    })));
    
    try {
      if (porExpressions.length > 0) {
        // Start with the first expression
        await testNextExpression(0);
      }
    } catch (error) {
      console.error('Error testing expressions:', error);
    }
  };
  
  // Test the next expression
  const testNextExpression = async (index: number) => {
    if (index >= porExpressions.length) {
      setLoading(false);
      setTestingIndex(-1);
      setCurrentTestingExpression(null);
      setCurrentTestingTable('');
      setTableProgress({ current: 0, total: 0 });
      return;
    }
    
    setTestingIndex(index);
    const expr = porExpressions[index];
    setCurrentTestingExpression(expr);
    
    // Try to extract the table name from the SQL
    const tableMatch = expr.sql.match(/FROM\s+([^\s,;()]+)/i);
    if (!tableMatch) {
      // Can't extract table name, mark as error
      setTestErrors(prev => [...prev, {
        id: expr.id,
        dataPoint: expr.dataPoint,
        sql: expr.sql,
        originalSql: expr.sql,
        error: 'Could not extract table name from SQL',
        testedTables: [],
        hasNonZeroResult: false
      }]);
      
      // Continue to the next expression
      await testNextExpression(index + 1);
      return;
    }
    
    // Find potential matches first
    await findPotentialMatches(expr);
  };

  const updateAllSqlExpressions = async () => {
    if (!confirm('Are you sure you want to update all SQL expressions? This will overwrite the existing expressions in the database.')) {
      return;
    }

    setLoading(true);
    setUpdateStatus('Updating all SQL expressions...');
    setUpdateError('');

    try {
      // Get successful test results
      const successfulExpressions = testResults.map(result => ({
        id: result.id,
        productionSqlExpression: result.sql
      }));

      if (successfulExpressions.length === 0) {
        setUpdateError('No successful expressions to update');
        setLoading(false);
        return;
      }

      // Log what we're updating
      console.log(`Updating ${successfulExpressions.length} POR SQL expressions`);

      const response = await fetch('/api/update-sql-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expressions: successfulExpressions
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUpdateStatus(`Updated ${data.updatedCount} SQL expressions successfully! IDs: ${data.updatedIds.join(', ')}`);

        // Update the local state with the successful expressions
        const updatedExpressions = new Set(data.updatedIds);

        // Update the porExpressions state with the successful expressions
        setPorExpressions(prev => prev.map(expr => {
          if (updatedExpressions.has(expr.id)) {
            const matchingExpr = successfulExpressions.find(e => e.id === expr.id);
            if (matchingExpr) {
              return {
                ...expr,
                sql: matchingExpr.productionSqlExpression,
                fixedSql: matchingExpr.productionSqlExpression
              };
            }
          }
          return expr;
        }));
      } else {
        setUpdateError(data.error || 'Failed to update SQL expressions');
      }
    } catch (error: any) {
      setUpdateError(error.message || 'An error occurred while updating');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setUpdateStatus('');
      }, 5000);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Test All POR SQL Expressions</Typography>
      
      <Box mb={4}>
        <Typography>File Path: {porFilePath || 'Not loaded yet'}</Typography>
        <Typography>Available Tables: {availableTables.length}</Typography>
        <Typography>Total POR Expressions: {porExpressions.length}</Typography>

        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={testAllExpressions}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? 'Testing...' : 'Test All Expressions'}
          </Button>

          <Button
            variant="contained"
            color="secondary"
            onClick={updateAllSqlExpressions}
            disabled={loading || successfulExpressions.length === 0}
          >
            Update All Successful Expressions
          </Button>

          {loading && (
            <Box mt={2} display="flex" flexDirection="column">
              <Box display="flex" alignItems="center">
                <CircularProgress size={24} className="mr-2" />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  {testingIndex >= 0
                    ? `Testing expression ${testingIndex + 1} of ${porExpressions.length}...`
                    : 'Processing...'}
                </Typography>
              </Box>
              
              {currentTestingExpression && (
                <Box mt={1} ml={4}>
                  <Typography variant="body2">
                    <strong>Current Expression:</strong> {currentTestingExpression.dataPoint} (ID: {currentTestingExpression.id})
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ 
                    backgroundColor: '#f5f5f5', 
                    p: 1, 
                    mt: 1, 
                    borderRadius: '4px',
                    maxWidth: '100%',
                    overflow: 'auto'
                  }}>
                    {currentTestingExpression.sql}
                  </Typography>
                </Box>
              )}
              
              {currentTestingTable && (
                <Box mt={1} ml={4}>
                  <Typography variant="body2">
                    <strong>Testing Table:</strong> {currentTestingTable}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Progress:</strong> Table {tableProgress.current} of {tableProgress.total}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {updateStatus && (
            <Alert severity="success" sx={{ mt: 2 }}>{updateStatus}</Alert>
          )}

          {updateError && (
            <Alert severity="error" sx={{ mt: 2 }}>{updateError}</Alert>
          )}
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="POR SQL test tabs">
          <Tab label={`Successful (${testResults.length})`} value={0} />
          <Tab label={`Failed (${testErrors.length})`} value={1} />
          <Tab label={`All Expressions (${porExpressions.length})`} value={2} />
          <Tab label={`Available Tables (${availableTables.length})`} value={3} />
          <Tab label="Edit Expression" value={4} />
          {currentMatching && <Tab label="Interactive Matching" value={5} />}
          {potentialMatches && <Tab label="Potential Matches" value={6} />}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>Successful Expressions</Typography>
        {testResults.length === 0 ? (
          <p>No successful expressions yet. Run the test first.</p>
        ) : (
          <div className="space-y-4">
            {testResults.map((result) => (
              <div key={result.id} className="border p-4 rounded bg-green-50">
                <div className="flex justify-between">
                  <h3 className="font-bold">{result.dataPoint} (ID: {result.id})</h3>
                  <div className="flex space-x-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      Value: {result.result.value !== undefined ? result.result.value : 'N/A'}
                    </span>
                    {result.hasNonZeroResult ? (
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">Non-Zero Result</span>
                    ) : (
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded text-sm">Zero Result</span>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-semibold">SQL:</p>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{result.sql}</pre>
                </div>
                {result.originalSql !== result.sql && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Original SQL:</p>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{result.originalSql}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>Failed Expressions</Typography>
        {testErrors.length === 0 ? (
          <p>No failed expressions yet. Run the test first.</p>
        ) : (
          <div className="space-y-4">
            {testErrors.map((error) => (
              <div key={error.id} className="border p-4 rounded bg-red-50">
                <div className="flex justify-between">
                  <h3 className="font-bold">{error.dataPoint} (ID: {error.id})</h3>
                  {error.hasNonZeroResult === false && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded text-sm">Zero Result</span>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-semibold">Error:</p>
                  <pre className="bg-red-100 p-2 rounded text-sm overflow-x-auto">{error.error}</pre>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-semibold">SQL:</p>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{error.sql}</pre>
                </div>
                {error.originalSql !== error.sql && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Original SQL:</p>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{error.originalSql}</pre>
                  </div>
                )}
                {error.result && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Result:</p>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{JSON.stringify(error.result, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>All Expressions</Typography>
        <div className="space-y-4">
          {porExpressions.map((expr) => (
            <div key={expr.id} className="border p-4 rounded bg-gray-50">
              <h3 className="font-bold">{expr.dataPoint} (ID: {expr.id})</h3>
              <div className="mt-2">
                <p className="text-sm font-semibold">SQL:</p>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{expr.sql}</pre>
              </div>
            </div>
          ))}
        </div>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom>Available Tables in POR Database</Typography>
        
        <Box display="flex">
          <Box width="30%" pr={2} sx={{ borderRight: '1px solid #ddd' }}>
            <Typography variant="subtitle1" gutterBottom>Tables</Typography>
            <List dense component="div" style={{ maxHeight: '500px', overflow: 'auto' }}>
              {availableTables.map((table, index) => (
                <ListItem 
                  key={index}
                  onClick={() => getTableColumns(table)}
                  sx={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedTable === table ? '#e3f2fd' : 'transparent'
                  }}
                >
                  <ListItemText primary={table} />
                </ListItem>
              ))}
            </List>
          </Box>
          
          <Box width="70%" pl={2}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedTable ? `Columns in ${selectedTable}` : 'Select a table to view columns'}
            </Typography>
            {selectedTable && tableColumns[selectedTable] ? (
              <List dense component="div" style={{ maxHeight: '500px', overflow: 'auto' }}>
                {tableColumns[selectedTable].map((column, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={column} />
                  </ListItem>
                ))}
              </List>
            ) : selectedTable ? (
              <CircularProgress size={24} />
            ) : null}
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Typography variant="h6" gutterBottom>Edit SQL Expression</Typography>
        {selectedExpression ? (
          <>
            <Typography variant="subtitle1">
              {selectedExpression.dataPoint} (ID: {selectedExpression.id})
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>Original SQL:</Typography>
            <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '8px' }}>
              {selectedExpression.originalSql || selectedExpression.sql}
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>Edit SQL:</Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              value={editedSql}
              onChange={(e) => setEditedSql(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={updateSqlExpression}
              disabled={loading}
            >
              Update SQL Expression
            </Button>

            {updateStatus && (
              <Alert severity="success" sx={{ mt: 2 }}>{updateStatus}</Alert>
            )}

            {updateError && (
              <Alert severity="error" sx={{ mt: 2 }}>{updateError}</Alert>
            )}
          </>
        ) : (
          <Typography>
            Select an expression from the Successful or Failed tabs to edit it.
          </Typography>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        {currentMatching && (
          <>
            <Typography variant="h6" gutterBottom>Interactive Table Matching</Typography>
            <Typography variant="subtitle1">
              {currentMatching.dataPoint} (ID: {currentMatching.expressionId})
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Current Table:</Typography>
            <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '8px' }}>
              {currentMatching.currentTable}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Current SQL:</Typography>
            <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '8px' }}>
              {currentMatching.currentSql}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Result:</Typography>
            <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '8px' }}>
              {JSON.stringify(currentMatching.result, null, 2)}
            </Typography>
            <Box mt={3}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={acceptCurrentMatch}
                sx={{ mr: 2 }}
              >
                Accept Match
              </Button>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={skipCurrentMatch}
              >
                Skip Match
              </Button>
            </Box>
          </>
        )}
        {!currentMatching && (
          <Typography>No current matching to display.</Typography>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        {potentialMatches && (
          <>
            <Typography variant="h6" gutterBottom>Potential Matches</Typography>
            <Typography variant="subtitle1">
              {potentialMatches.dataPoint} (ID: {potentialMatches.expressionId})
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Original SQL:</Typography>
            <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '8px' }}>
              {potentialMatches.originalSql}
            </Typography>
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Potential Table Matches:</Typography>
              {potentialMatches.potentialTables.map((match, index) => (
                <Box key={index} p={2} border="1px solid #ddd" borderRadius="4px" mb={2}>
                  <Typography variant="body1">
                    <strong>Table:</strong> {match.tableName}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Column Similarity:</strong> {(match.columnSimilarityScore * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body1">
                    <strong>Semantic Similarity:</strong> {(match.semanticSimilarityScore * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body1">
                    <strong>Combined Score:</strong> {(match.combinedScore * 100).toFixed(1)}%
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => selectPotentialMatch(match.tableName)}
                    sx={{ mt: 2 }}
                  >
                    Try This Table
                  </Button>
                </Box>
              ))}
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={skipPotentialMatches}
              >
                Skip All Potential Matches
              </Button>
            </Box>
          </>
        )}
        {!potentialMatches && (
          <Typography>No potential matches to display.</Typography>
        )}
      </TabPanel>
    </div>
  );
}
