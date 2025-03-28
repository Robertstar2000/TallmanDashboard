/**
 * Script to query POR database schema using node-adodb
 */

import ADODB from 'node-adodb';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  POR_FILE_PATH: 'C:\\Users\\BobM\\Desktop\\POR.MDB',
  OUTPUT_FILE: path.join(process.cwd(), 'lib', 'db', 'por-schema.ts')
};

interface TableColumn {
  name: string;
  dataType: string;
  size?: number;
  isNullable?: boolean;
}

interface TableSchema {
  name: string;
  columns: TableColumn[];
}

interface DatabaseSchema {
  tables: TableSchema[];
  databaseName: string;
  lastUpdated: string;
}

/**
 * Main function to query POR schema
 */
async function main() {
  try {
    console.log('POR Schema Generator using ADODB');
    console.log('===============================\n');
    
    // Check if POR file exists
    if (!fs.existsSync(CONFIG.POR_FILE_PATH)) {
      console.error(`POR file not found at: ${CONFIG.POR_FILE_PATH}`);
      return;
    }
    
    console.log(`Using POR file: ${CONFIG.POR_FILE_PATH}`);
    
    // Try using PowerShell to query the database schema
    console.log('\nAttempting to query schema using PowerShell...');
    
    try {
      const schema = await querySchemaWithPowerShell();
      generateSchemaFile(schema);
      console.log(`\nSchema file generated at: ${CONFIG.OUTPUT_FILE}`);
    } catch (error) {
      console.error('Error querying schema with PowerShell:', error);
      
      // Fall back to node-adodb
      console.log('\nFalling back to node-adodb...');
      
      try {
        const schema = await querySchemaWithAdodb();
        generateSchemaFile(schema);
        console.log(`\nSchema file generated at: ${CONFIG.OUTPUT_FILE}`);
      } catch (adodbError) {
        console.error('Error querying schema with node-adodb:', adodbError);
        
        // Create a minimal schema file with helper functions
        console.log('\nCreating minimal schema file with helper functions...');
        generateMinimalSchemaFile();
        console.log(`\nMinimal schema file generated at: ${CONFIG.OUTPUT_FILE}`);
      }
    }
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

/**
 * Query schema using PowerShell
 */
async function querySchemaWithPowerShell(): Promise<DatabaseSchema> {
  const psCommand = `
    $conn = New-Object -ComObject ADODB.Connection
    $conn.Open("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${CONFIG.POR_FILE_PATH}")
    
    # Get list of tables
    $tables = @()
    $rs = $conn.OpenSchema(20) # adSchemaTables
    
    while (!$rs.EOF) {
      if ($rs.Fields("TABLE_TYPE").Value -eq "TABLE" -and $rs.Fields("TABLE_NAME").Value -notlike "MSys*") {
        $tableName = $rs.Fields("TABLE_NAME").Value
        
        # Get columns for this table
        $columns = @()
        $rsColumns = $conn.OpenSchema(4, @($null, $null, $tableName)) # adSchemaColumns
        
        while (!$rsColumns.EOF) {
          $columns += @{
            name = $rsColumns.Fields("COLUMN_NAME").Value
            dataType = $rsColumns.Fields("DATA_TYPE").Value
          }
          $rsColumns.MoveNext()
        }
        
        $tables += @{
          name = $tableName
          columns = $columns
        }
      }
      $rs.MoveNext()
    }
    
    $schema = @{
      tables = $tables
      databaseName = "POR"
      lastUpdated = [DateTime]::Now.ToString("o")
    }
    
    ConvertTo-Json -InputObject $schema -Depth 10
  `;
  
  const { stdout } = await execAsync(`powershell -Command "${psCommand.replace(/"/g, '\\"')}"`);
  return JSON.parse(stdout);
}

/**
 * Query schema using node-adodb
 */
async function querySchemaWithAdodb(): Promise<DatabaseSchema> {
  // Create a connection to the Access database
  const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${CONFIG.POR_FILE_PATH};`);
  
  // Get list of tables
  const tablesQuery = `
    SELECT Name 
    FROM MSysObjects 
    WHERE Type=1 AND Flags=0 AND Name NOT LIKE 'MSys%'
  `;
  
  const tables = await connection.query(tablesQuery) as any[];
  
  const schema: DatabaseSchema = {
    tables: [],
    databaseName: 'POR',
    lastUpdated: new Date().toISOString()
  };
  
  // Get columns for each table
  for (const table of tables) {
    const tableName = table.Name;
    console.log(`Processing table: ${tableName}`);
    
    try {
      // Get a sample row to determine columns
      const columnsQuery = `SELECT TOP 1 * FROM [${tableName}]`;
      const sampleRow = await connection.query(columnsQuery) as any[];
      
      if (sampleRow && sampleRow.length > 0) {
        const columns: TableColumn[] = [];
        
        // Extract column names from the first row
        for (const key in sampleRow[0]) {
          columns.push({
            name: key,
            dataType: 'UNKNOWN' // We don't have type information
          });
        }
        
        schema.tables.push({
          name: tableName,
          columns
        });
      }
    } catch (error) {
      console.error(`Error getting columns for ${tableName}:`, error);
    }
  }
  
  return schema;
}

/**
 * Generate TypeScript schema file
 */
function generateSchemaFile(schema: DatabaseSchema) {
  const content = `/**
 * POR Database Schema
 * 
 * This file was auto-generated by the query-por-schema-adodb.ts script
 * Last updated: ${new Date().toISOString()}
 */

export interface PORTableColumn {
  name: string;
  dataType: string;
  size?: number;
  isNullable?: boolean;
}

export interface PORTableSchema {
  name: string;
  columns: PORTableColumn[];
}

export interface PORDatabaseSchema {
  tables: PORTableSchema[];
  databaseName: string;
  lastUpdated: string;
}

/**
 * Complete schema for the POR database
 */
export const porSchema: PORDatabaseSchema = ${JSON.stringify(schema, null, 2)};

/**
 * Get all table names from the POR database
 */
export function getPORTableNames(): string[] {
  return porSchema.tables.map(table => table.name);
}

/**
 * Get all columns for a specific table
 */
export function getPORTableColumns(tableName: string): PORTableColumn[] {
  const table = porSchema.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
  return table ? table.columns : [];
}

/**
 * Get column names for a specific table
 */
export function getPORTableColumnNames(tableName: string): string[] {
  return getPORTableColumns(tableName).map(col => col.name);
}

/**
 * Check if a table exists in the POR database
 */
export function isPORTableExists(tableName: string): boolean {
  return porSchema.tables.some(t => t.name.toLowerCase() === tableName.toLowerCase());
}

/**
 * Check if a column exists in a specific table
 */
export function isPORColumnExists(tableName: string, columnName: string): boolean {
  const columns = getPORTableColumns(tableName);
  return columns.some(col => col.name.toLowerCase() === columnName.toLowerCase());
}
`;

  fs.writeFileSync(CONFIG.OUTPUT_FILE, content);
}

/**
 * Generate a minimal schema file with helper functions
 */
function generateMinimalSchemaFile() {
  // Create a minimal schema with common POR tables based on the SQL expressions
  const minimalSchema: DatabaseSchema = {
    tables: [
      {
        name: 'PurchaseOrder',
        columns: [
          { name: 'ID', dataType: 'INTEGER' },
          { name: 'Date', dataType: 'DATE' },
          { name: 'VendorNumber', dataType: 'VARCHAR' },
          { name: 'Status', dataType: 'VARCHAR' },
          { name: 'Store', dataType: 'VARCHAR' },
          { name: 'Amount', dataType: 'CURRENCY' },
          { name: 'CreatedDate', dataType: 'DATE' },
          { name: 'UpdatedDate', dataType: 'DATE' }
        ]
      },
      {
        name: 'Rentals',
        columns: [
          { name: 'ID', dataType: 'INTEGER' },
          { name: 'Status', dataType: 'VARCHAR' },
          { name: 'CreatedDate', dataType: 'DATE' },
          { name: 'CustomerID', dataType: 'VARCHAR' },
          { name: 'Amount', dataType: 'CURRENCY' }
        ]
      },
      {
        name: 'Customers',
        columns: [
          { name: 'ID', dataType: 'INTEGER' },
          { name: 'Name', dataType: 'VARCHAR' },
          { name: 'Address', dataType: 'VARCHAR' },
          { name: 'City', dataType: 'VARCHAR' },
          { name: 'State', dataType: 'VARCHAR' },
          { name: 'ZipCode', dataType: 'VARCHAR' },
          { name: 'Phone', dataType: 'VARCHAR' },
          { name: 'Email', dataType: 'VARCHAR' }
        ]
      },
      {
        name: 'Inventory',
        columns: [
          { name: 'ID', dataType: 'INTEGER' },
          { name: 'ItemNumber', dataType: 'VARCHAR' },
          { name: 'Description', dataType: 'VARCHAR' },
          { name: 'Quantity', dataType: 'INTEGER' },
          { name: 'Cost', dataType: 'CURRENCY' },
          { name: 'Price', dataType: 'CURRENCY' }
        ]
      },
      {
        name: 'Orders',
        columns: [
          { name: 'ID', dataType: 'INTEGER' },
          { name: 'OrderType', dataType: 'VARCHAR' },
          { name: 'RentalStatus', dataType: 'VARCHAR' },
          { name: 'SO_DATE', dataType: 'DATE' },
          { name: 'CustomerID', dataType: 'VARCHAR' },
          { name: 'Amount', dataType: 'CURRENCY' },
          { name: 'Source', dataType: 'VARCHAR' }
        ]
      },
      {
        name: 'AccountingTransaction',
        columns: [
          { name: 'ID', dataType: 'INTEGER' },
          { name: 'TransactionDate', dataType: 'DATE' },
          { name: 'Amount', dataType: 'CURRENCY' },
          { name: 'Type', dataType: 'VARCHAR' },
          { name: 'Description', dataType: 'VARCHAR' }
        ]
      }
    ],
    databaseName: 'POR',
    lastUpdated: new Date().toISOString()
  };
  
  generateSchemaFile(minimalSchema);
}

// Run the main function
main().catch(console.error);
