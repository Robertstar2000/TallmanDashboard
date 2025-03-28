import { NextResponse } from 'next/server';
import { getServerConfig, ServerConfig } from '@/lib/db/connections';
import { executeQuery } from '@/lib/db/query-executor';
import { executeTestQuery } from '@/lib/db/test-db';

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

interface TableSchema {
  columns: SchemaColumn[];
}

interface DatabaseSchema {
  [tableName: string]: TableSchema;
}

export async function POST(request: Request) {
  try {
    const { server } = await request.json();
    
    console.log(`GET-SCHEMA API: Received request to get schema for ${server} database`);
    
    // Get server configuration
    const serverConfig = getServerConfig(server);
    if (!serverConfig) {
      return NextResponse.json(
        { error: `Server configuration not found for ${server}` },
        { status: 404 }
      );
    }
    
    let schema: DatabaseSchema = {};
    
    if (server === 'P21') {
      // For P21 (SQL Server), get table and column information from system tables
      const tablesSql = `
        SELECT 
          t.name AS table_name,
          s.name AS schema_name
        FROM 
          sys.tables t
        INNER JOIN 
          sys.schemas s ON t.schema_id = s.schema_id
        ORDER BY 
          s.name, t.name
      `;
      
      try {
        const tablesResult = await executeQuery({
          server: 'P21',
          sql: tablesSql,
          testMode: false
        });
        
        if (tablesResult.success && tablesResult.data && Array.isArray(tablesResult.data)) {
          // Process each table to get its columns
          for (const table of tablesResult.data) {
            const tableName = table.table_name as string;
            const schemaName = table.schema_name as string;
            const fullTableName = `${schemaName}.${tableName}`;
            
            const columnsSql = `
              SELECT 
                c.name AS column_name,
                t.name AS data_type,
                c.max_length,
                c.is_nullable,
                CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS is_primary_key
              FROM 
                sys.columns c
              INNER JOIN 
                sys.types t ON c.user_type_id = t.user_type_id
              INNER JOIN 
                sys.tables tbl ON c.object_id = tbl.object_id
              INNER JOIN 
                sys.schemas s ON tbl.schema_id = s.schema_id
              LEFT JOIN 
                (
                  SELECT 
                    ic.column_id,
                    ic.object_id
                  FROM 
                    sys.index_columns ic
                  INNER JOIN 
                    sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
                  WHERE 
                    i.is_primary_key = 1
                ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
              WHERE 
                tbl.name = '${tableName}' AND s.name = '${schemaName}'
              ORDER BY 
                c.column_id
            `;
            
            const columnsResult = await executeQuery({
              server: 'P21',
              sql: columnsSql,
              testMode: false
            });
            
            if (columnsResult.success && columnsResult.data && Array.isArray(columnsResult.data)) {
              schema[fullTableName] = {
                columns: columnsResult.data.map((col: any) => ({
                  name: col.column_name,
                  type: col.data_type,
                  nullable: col.is_nullable === 1,
                  isPrimaryKey: col.is_primary_key === 1
                }))
              };
            }
          }
        }
      } catch (error) {
        console.error('Error getting P21 schema:', error);
        
        // Provide a fallback schema for common P21 tables
        schema = {
          'dbo.oe_hdr': {
            columns: [
              { name: 'id', type: 'int', nullable: false, isPrimaryKey: true },
              { name: 'order_date', type: 'datetime', nullable: true, isPrimaryKey: false },
              { name: 'order_amt', type: 'decimal', nullable: true, isPrimaryKey: false },
              { name: 'order_source', type: 'varchar', nullable: true, isPrimaryKey: false },
              { name: 'order_status', type: 'varchar', nullable: true, isPrimaryKey: false },
              { name: 'ship_date', type: 'datetime', nullable: true, isPrimaryKey: false },
              { name: 'close_date', type: 'datetime', nullable: true, isPrimaryKey: false }
            ]
          },
          'dbo.ar_open_items': {
            columns: [
              { name: 'id', type: 'int', nullable: false, isPrimaryKey: true },
              { name: 'amount_due', type: 'decimal', nullable: true, isPrimaryKey: false },
              { name: 'aging_bucket', type: 'varchar', nullable: true, isPrimaryKey: false },
              { name: 'invoice_date', type: 'datetime', nullable: true, isPrimaryKey: false },
              { name: 'due_date', type: 'datetime', nullable: true, isPrimaryKey: false }
            ]
          },
          'dbo.ap_invoices': {
            columns: [
              { name: 'id', type: 'int', nullable: false, isPrimaryKey: true },
              { name: 'invoice_amt', type: 'decimal', nullable: true, isPrimaryKey: false },
              { name: 'invoice_date', type: 'datetime', nullable: true, isPrimaryKey: false },
              { name: 'due_date', type: 'datetime', nullable: true, isPrimaryKey: false },
              { name: 'status', type: 'varchar', nullable: true, isPrimaryKey: false }
            ]
          },
          'dbo.ar_headers': {
            columns: [
              { name: 'id', type: 'int', nullable: false, isPrimaryKey: true },
              { name: 'ar_amount', type: 'decimal', nullable: true, isPrimaryKey: false },
              { name: 'invoice_date', type: 'datetime', nullable: true, isPrimaryKey: false },
              { name: 'due_date', type: 'datetime', nullable: true, isPrimaryKey: false },
              { name: 'status', type: 'varchar', nullable: true, isPrimaryKey: false }
            ]
          },
          'dbo.customer': {
            columns: [
              { name: 'id', type: 'int', nullable: false, isPrimaryKey: true },
              { name: 'cust_name', type: 'varchar', nullable: true, isPrimaryKey: false },
              { name: 'prospect_flag', type: 'varchar', nullable: true, isPrimaryKey: false },
              { name: 'created_date', type: 'datetime', nullable: true, isPrimaryKey: false },
              { name: 'cust_type', type: 'varchar', nullable: true, isPrimaryKey: false },
              { name: 'credit_limit', type: 'decimal', nullable: true, isPrimaryKey: false }
            ]
          },
          'dbo.inv_mast': {
            columns: [
              { name: 'item_id', type: 'varchar', nullable: false, isPrimaryKey: true },
              { name: 'item_desc', type: 'varchar', nullable: true, isPrimaryKey: false },
              { name: 'category', type: 'varchar', nullable: true, isPrimaryKey: false },
              { name: 'price', type: 'decimal', nullable: true, isPrimaryKey: false },
              { name: 'cost', type: 'decimal', nullable: true, isPrimaryKey: false },
              { name: 'qty_on_hand', type: 'int', nullable: true, isPrimaryKey: false },
              { name: 'reorder_level', type: 'int', nullable: true, isPrimaryKey: false }
            ]
          },
          'dbo.location_mst': {
            columns: [
              { name: 'loc_id', type: 'varchar', nullable: false, isPrimaryKey: true },
              { name: 'loc_name', type: 'varchar', nullable: true, isPrimaryKey: false },
              { name: 'city', type: 'varchar', nullable: true, isPrimaryKey: false },
              { name: 'state', type: 'varchar', nullable: true, isPrimaryKey: false }
            ]
          }
        };
      }
    } else if (server === 'POR') {
      // For POR (MS Access), get table information
      const tablesSql = `
        SELECT 
          Name AS table_name
        FROM 
          MSysObjects
        WHERE 
          Type = 1 AND Flags = 0
        ORDER BY 
          Name
      `;
      
      try {
        const tablesResult = await executeQuery({
          server: 'POR',
          sql: tablesSql,
          testMode: false
        });
        
        if (tablesResult.success && tablesResult.data && Array.isArray(tablesResult.data)) {
          // Process each table to get its columns
          for (const table of tablesResult.data) {
            const tableName = table.table_name as string;
            
            // Get sample data to infer columns
            const sampleSql = `
              SELECT TOP 1 * 
              FROM [${tableName}]
            `;
            
            try {
              const sampleResult = await executeQuery({
                server: 'POR',
                sql: sampleSql,
                testMode: false
              });
              
              if (sampleResult.success && sampleResult.data && Array.isArray(sampleResult.data) && sampleResult.data.length > 0) {
                const sampleRow = sampleResult.data[0];
                const columns = Object.keys(sampleRow).map(colName => ({
                  name: colName,
                  type: typeof sampleRow[colName] === 'number' ? 'Number' : 
                        typeof sampleRow[colName] === 'string' ? 'Text' : 
                        sampleRow[colName] instanceof Date ? 'Date' : 'Unknown',
                  nullable: true, // Assume nullable by default
                  isPrimaryKey: colName.toLowerCase() === 'id' // Assume ID is primary key
                }));
                
                schema[tableName] = { columns };
              }
            } catch (error) {
              console.error(`Error getting columns for table ${tableName}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error getting POR tables:', error);
        
        // Fallback to predefined schema for POR tables
        schema = {
          'Rentals': {
            columns: [
              { name: 'ID', type: 'Number', nullable: false, isPrimaryKey: true },
              { name: 'Status', type: 'Text', nullable: true, isPrimaryKey: false },
              { name: 'CreatedDate', type: 'Date', nullable: true, isPrimaryKey: false },
              { name: 'RentalValue', type: 'Number', nullable: true, isPrimaryKey: false },
              { name: 'CustomerID', type: 'Number', nullable: true, isPrimaryKey: false }
            ]
          },
          'Inventory': {
            columns: [
              { name: 'ID', type: 'Number', nullable: false, isPrimaryKey: true },
              { name: 'Location', type: 'Text', nullable: true, isPrimaryKey: false },
              { name: 'ItemID', type: 'Text', nullable: true, isPrimaryKey: false },
              { name: 'Quantity', type: 'Number', nullable: true, isPrimaryKey: false }
            ]
          },
          'Customers': {
            columns: [
              { name: 'ID', type: 'Number', nullable: false, isPrimaryKey: true },
              { name: 'Name', type: 'Text', nullable: true, isPrimaryKey: false },
              { name: 'CreatedDate', type: 'Date', nullable: true, isPrimaryKey: false },
              { name: 'IsProspect', type: 'Number', nullable: true, isPrimaryKey: false }
            ]
          },
          'PurchaseOrder': {
            columns: [
              { name: 'ID', type: 'Number', nullable: false, isPrimaryKey: true },
              { name: 'OrderDate', type: 'Date', nullable: true, isPrimaryKey: false },
              { name: 'Status', type: 'Text', nullable: true, isPrimaryKey: false },
              { name: 'Value', type: 'Number', nullable: true, isPrimaryKey: false }
            ]
          }
        };
      }
    } else {
      // For test database, provide a static schema
      schema = {
        'ar_open_items': {
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true },
            { name: 'amount_due', type: 'REAL', nullable: true, isPrimaryKey: false },
            { name: 'aging_bucket', type: 'TEXT', nullable: true, isPrimaryKey: false },
            { name: 'invoice_date', type: 'TEXT', nullable: true, isPrimaryKey: false }
          ]
        },
        'ar_headers': {
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true },
            { name: 'ar_amount', type: 'REAL', nullable: true, isPrimaryKey: false },
            { name: 'invoice_date', type: 'TEXT', nullable: true, isPrimaryKey: false }
          ]
        },
        'ap_invoices': {
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true },
            { name: 'invoice_amt', type: 'REAL', nullable: true, isPrimaryKey: false },
            { name: 'invoice_date', type: 'TEXT', nullable: true, isPrimaryKey: false }
          ]
        },
        'customer': {
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true },
            { name: 'prospect_flag', type: 'TEXT', nullable: true, isPrimaryKey: false },
            { name: 'created_date', type: 'TEXT', nullable: true, isPrimaryKey: false }
          ]
        },
        'oe_hdr': {
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true },
            { name: 'order_date', type: 'TEXT', nullable: true, isPrimaryKey: false },
            { name: 'order_amt', type: 'REAL', nullable: true, isPrimaryKey: false },
            { name: 'order_source', type: 'TEXT', nullable: true, isPrimaryKey: false }
          ]
        },
        'Rentals': {
          columns: [
            { name: 'ID', type: 'INTEGER', nullable: false, isPrimaryKey: true },
            { name: 'Status', type: 'TEXT', nullable: true, isPrimaryKey: false },
            { name: 'CreatedDate', type: 'TEXT', nullable: true, isPrimaryKey: false },
            { name: 'RentalValue', type: 'REAL', nullable: true, isPrimaryKey: false }
          ]
        },
        'Inventory': {
          columns: [
            { name: 'ID', type: 'INTEGER', nullable: false, isPrimaryKey: true },
            { name: 'Location', type: 'TEXT', nullable: true, isPrimaryKey: false },
            { name: 'Quantity', type: 'INTEGER', nullable: true, isPrimaryKey: false }
          ]
        }
      };
    }
    
    return NextResponse.json(schema);
  } catch (error) {
    console.error('GET-SCHEMA API: Error getting schema:', error);
    return NextResponse.json(
      { error: 'Failed to get schema', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
