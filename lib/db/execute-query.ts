/**
 * Execute Query Module
 * 
 * This module provides functions to execute queries against different database servers.
 */

import fetch from 'node-fetch';

// Set the correct POR database path from memory
const POR_DB_PATH = 'C:\\Users\\BobM\\OneDrive\\Desktop\\POR.MDB';

/**
 * Execute a query against a database server
 * 
 * @param serverName The server to execute the query against (P21 or POR)
 * @param query The SQL query to execute
 * @param tableName Optional table name for context
 * @returns The query result
 */
export async function executeQuery(serverName: string, query: string, tableName?: string): Promise<any> {
  try {
    console.log(`Executing query on ${serverName} server: ${query}`);
    
    if (serverName === 'POR') {
      return executeAccessQuery(query);
    } else {
      return executeP21Query(query);
    }
  } catch (error) {
    console.error(`Error executing query on ${serverName}:`, error);
    throw error;
  }
}

/**
 * Execute a query against the P21 database
 * 
 * @param query The SQL query to execute
 * @returns The query result
 */
async function executeP21Query(query: string): Promise<any> {
  try {
    const response = await fetch('http://localhost:3000/api/executeQuery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        server: 'P21',
        query
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`P21 query execution failed: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`P21 query execution failed: ${result.error}`);
    }
    
    return result.data || result;
  } catch (error) {
    console.error('Error executing P21 query:', error);
    throw error;
  }
}

/**
 * Execute a query against the POR database
 * 
 * @param query The SQL query to execute
 * @returns The query result
 */
async function executeAccessQuery(query: string): Promise<any> {
  try {
    const response = await fetch('http://localhost:3000/api/executeAccessQuery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filePath: process.env.POR_FILE_PATH || POR_DB_PATH,
        sql: query
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`POR query execution failed: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`POR query execution failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error executing POR query:', error);
    throw error;
  }
}
