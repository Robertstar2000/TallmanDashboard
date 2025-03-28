import { executeAdminQuery, saveSpreadsheetRow } from '@/lib/db/sqlite';
import { executeTestQuery } from '@/lib/db/test-db';
import { executionState } from './state';
import { SpreadsheetRow } from '@/lib/types/dashboard';
import { getServerConfig } from '@/lib/db/connections';
import { executeQuery } from '@/lib/db/query-executor';
import { getDb } from '@/lib/db/sqlite';
import { ConnectionManager } from '@/lib/db/connection-manager';

// Function to generate a test value based on row data
function generateTestValue(row: SpreadsheetRow): number {
  try {
    // Use row ID and other properties to generate a consistent value
    const hash = row.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const chartFactor = row.chartGroup ? row.chartGroup.length * 2 : 1;
    const varFactor = row.variableName ? row.variableName.length : 1;
    
    // Base value between 100-999
    let baseValue = (hash % 900) + 100;
    
    // Apply chart and variable factors
    if (row.serverName === 'P21') {
      // P21 values tend to be higher
      baseValue = Math.round(baseValue * 1.2);
    } else if (row.serverName === 'POR') {
      // POR values tend to be lower
      baseValue = Math.round(baseValue * 0.8);
    }
    
    // Adjust based on chart type
    if (row.chartGroup?.includes('Revenue') || row.chartGroup?.includes('Sales')) {
      baseValue *= 10; // Revenue numbers are typically larger
    } else if (row.chartGroup?.includes('Count') || row.chartGroup?.includes('Quantity')) {
      baseValue = Math.round(baseValue / 10); // Count numbers are typically smaller
    }
    
    // Add some variance based on variable name
    const variance = varFactor % 5;
    baseValue = baseValue + variance;
    
    // Ensure value is reasonable
    return Math.min(Math.max(baseValue, 1), 100000);
  } catch (error) {
    console.error('Error generating test value:', error);
    return 100; // Default fallback
  }
}

// Improved transformer function to handle different types of transformations
function transformValue(value: number, transformer?: string): number {
  if (!transformer) return value;
  
  try {
    console.log(`Applying transformer: ${transformer} to value: ${value}`);
    
    // Handle percentage transformations
    if (transformer.includes('%')) {
      if (transformer === '%') {
        return value * 100; // Convert decimal to percentage
      } else if (transformer === '/%') {
        return value / 100; // Convert percentage to decimal
      }
    }
    
    // Handle basic math operations
    if (transformer.startsWith('*')) {
      const factor = parseFloat(transformer.substring(1));
      if (!isNaN(factor)) return value * factor;
    } else if (transformer.startsWith('/')) {
      const divisor = parseFloat(transformer.substring(1));
      if (!isNaN(divisor) && divisor !== 0) return value / divisor;
    } else if (transformer.startsWith('+')) {
      const addend = parseFloat(transformer.substring(1));
      if (!isNaN(addend)) return value + addend;
    } else if (transformer.startsWith('-')) {
      const subtrahend = parseFloat(transformer.substring(1));
      if (!isNaN(subtrahend)) return value - subtrahend;
    }
    
    // Handle rounding
    if (transformer === 'round') {
      return Math.round(value);
    } else if (transformer === 'floor') {
      return Math.floor(value);
    } else if (transformer === 'ceil') {
      return Math.ceil(value);
    }
    
    // Handle decimal precision
    if (transformer.startsWith('toFixed')) {
      const precision = parseInt(transformer.substring(7));
      if (!isNaN(precision)) {
        return parseFloat(value.toFixed(precision));
      }
    }
    
    // Default: return original value if transformer not recognized
    console.warn(`Unrecognized transformer: ${transformer}, using original value`);
    return value;
  } catch (error) {
    console.error(`Error applying transformer ${transformer}:`, error);
    return value; // Return original value on error
  }
}

// Background worker for processing spreadsheet rows
export class BackgroundWorker {
  private static instance: BackgroundWorker;
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;
  private testMode: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  static getInstance(): BackgroundWorker {
    if (!BackgroundWorker.instance) {
      BackgroundWorker.instance = new BackgroundWorker();
    }
    return BackgroundWorker.instance;
  }
  
  // Add stop method to fix the error in reset route
  stop() {
    if (this.isRunning) {
      console.log('Stopping background worker');
      
      // Set the running flag to false first to break out of the continuous loop
      this.isRunning = false;
      
      // Then abort any in-progress operations
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
      
      // Update execution state to reflect that processing has stopped
      executionState.status = 'idle';
      executionState.activeRow = null;
      console.log('Background worker stopped, execution state updated to idle');
    } else {
      console.log('Background worker is not running, nothing to stop');
    }
  }
  
  public async run(data: SpreadsheetRow[]): Promise<void> {
    console.log(`WORKER: Run method called with ${data?.length || 0} rows`);
    
    // If already running, don't start again
    if (this.isRunning) {
      console.log('WORKER: Already running, ignoring run request');
      return;
    }
    
    // Set running flag
    this.isRunning = true;
    
    // Create a new abort controller
    this.abortController = new AbortController();
    
    // Set execution state
    executionState.status = 'running';
    executionState.error = null;
    executionState.activeRow = null;
    
    console.log('WORKER: Starting background processing');
    
    try {
      // Process the rows in the background
      this.processRows(data).catch(error => {
        console.error('WORKER: Unhandled error in processRows:', error);
        executionState.status = 'error';
        executionState.error = error instanceof Error ? error.message : 'Unknown error in background worker';
        this.isRunning = false;
      });
      
      console.log('WORKER: Background processing started');
    } catch (error) {
      console.error('WORKER: Error starting background processing:', error);
      executionState.status = 'error';
      executionState.error = error instanceof Error ? error.message : 'Unknown error starting background worker';
      this.isRunning = false;
    }
  }
  
  private async processRows(data: SpreadsheetRow[]): Promise<void> {
    console.log(`WORKER: processRows called with ${data?.length || 0} rows`);
    
    if (!data || data.length === 0) {
      console.error('WORKER: No data provided to processRows');
      executionState.status = 'error';
      executionState.error = 'No data provided to process';
      this.isRunning = false;
      return;
    }
    
    // Important: Create a deep copy of the data to avoid reference issues
    // We need to maintain the exact same order as displayed in the admin spreadsheet
    const processData = JSON.parse(JSON.stringify(data));
    executionState.updatedData = processData;
    
    console.log(`WORKER: Processing ${processData.length} rows in production mode`);
    
    // Track consecutive errors to prevent infinite error loops
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    
    // Sort the data by ID to ensure sequential processing
    const sortedData = [...processData].sort((a, b) => {
      // Convert IDs to numbers for proper numerical sorting
      const idA = parseInt(a.id, 10);
      const idB = parseInt(b.id, 10);
      return idA - idB;
    });
    
    console.log(`WORKER: Sorted data for sequential processing by ID`);
    
    // Continue processing until explicitly stopped
    while (this.isRunning && this.abortController && !this.abortController.signal.aborted) {
      console.log(`WORKER: Starting a new processing cycle through all ${sortedData.length} rows in ID order`);
      
      // Process each row in sequence
      for (let i = 0; i < sortedData.length; i++) {
        // Check if we should abort
        if (!this.isRunning || !this.abortController || this.abortController.signal.aborted) {
          console.log('WORKER: Processing aborted');
          break;
        }
        
        // Get the current row
        const row = sortedData[i];
        
        // Set the active row in the execution state
        executionState.activeRow = row.id;
        
        // Update the execution state with the current row
        this.updateExecutionStateRow(row);
        
        try {
          // Process the row
          console.log(`WORKER: Processing row ${i + 1}/${sortedData.length}: ID ${row.id} - ${row.chartGroup} - ${row.variableName}`);
          
          // Determine the mode (production or test)
          const mode = 'production';
          
          // Process the row and get the updated row
          const updatedRow = await this.processRow(row, mode);
          
          // Save the updated row to the database
          await this.saveRowToDatabase(updatedRow);
          
          // Reset consecutive errors counter on success
          consecutiveErrors = 0;
          
          // Add a small delay between rows to prevent overwhelming the server
          // This also gives time for the UI to update
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`WORKER: Error processing row ${row.id}:`, error);
          
          // Update the row with the error
          row.error = error instanceof Error ? error.message : 'Unknown error';
          this.updateExecutionStateRow(row);
          
          // Increment consecutive errors counter
          consecutiveErrors++;
          
          // If we've hit the maximum number of consecutive errors, abort
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error(`WORKER: Too many consecutive errors (${consecutiveErrors}), aborting`);
            executionState.status = 'error';
            executionState.error = `Too many consecutive errors: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.isRunning = false;
            break;
          }
          
          // Continue with the next row even if there was an error
          // This ensures we don't stop after the first error
          continue;
        }
      }
      
      // If we've been stopped or aborted during processing, break out of the loop
      if (!this.isRunning || !this.abortController || this.abortController.signal.aborted) {
        break;
      }
      
      // Add a small delay between cycles
      console.log('WORKER: Completed one full cycle, pausing briefly before restarting from the first row');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Set the final status
    if (this.abortController && !this.abortController.signal.aborted && executionState.status !== 'error') {
      console.log('WORKER: Processing complete');
      executionState.status = 'complete';
    } else if (this.abortController && this.abortController.signal.aborted) {
      console.log('WORKER: Processing was aborted');
      executionState.status = 'idle';
    }
    
    // Clear the active row
    executionState.activeRow = null;
    
    // Clear the abort controller
    this.abortController = null;
    
    // Clear the running flag
    this.isRunning = false;
  }

  private async processRow(row: SpreadsheetRow, mode: string): Promise<SpreadsheetRow> {
    console.log(`WORKER: Processing row ${row.id} - ${row.chartGroup} - ${row.variableName} (${mode} mode)`);
    
    try {
      // Execute the query for this row
      const queryResult = await this.executeQueryForRow(row);
      console.log(`WORKER: Query result for row ${row.id}:`, queryResult);
      
      // Check if we should preserve the existing value
      let valueToFormat = queryResult.value;
      
      // If query returned zero but we have an existing non-zero value, use the existing value
      if (valueToFormat === 0 && row.value && parseFloat(row.value) !== 0) {
        console.log(`WORKER: Query returned zero but row has existing non-zero value ${row.value}, using existing value for formatting`);
        valueToFormat = parseFloat(row.value);
      }
      
      // Format the value based on the chart group and variable name
      const formattedValue = this.formatValue(valueToFormat, row, queryResult.stringValue);
      console.log(`WORKER: Formatted value for row ${row.id}: ${formattedValue}`);
      
      // Create the updated row with the new value
      const updatedRow = {
        ...row,
        value: formattedValue,
        lastUpdated: new Date().toISOString(),
      };
      
      // Add error information if there was an error
      if (queryResult.error) {
        updatedRow.error = queryResult.error;
        updatedRow.errorType = queryResult.errorType;
        updatedRow.lastError = new Date().toISOString();
      } else {
        // Clear any previous errors
        updatedRow.error = undefined;
        updatedRow.errorType = undefined;
        updatedRow.lastError = undefined;
      }
      
      // Update the row in the execution state data
      this.updateExecutionStateRow(updatedRow);
      
      return updatedRow;
    } catch (error) {
      console.error(`WORKER: Error processing row ${row.id}:`, error);
      
      // Preserve the existing value if possible
      const existingValue = row.value || "0";
      
      // Create an error row
      const errorRow = {
        ...row,
        value: existingValue, // Keep the existing value
        lastUpdated: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error in processRow',
        errorType: 'other' as 'connection' | 'execution' | 'syntax' | 'other',
        lastError: new Date().toISOString()
      };
      
      // Update the row in the execution state data
      this.updateExecutionStateRow(errorRow);
      
      return errorRow;
    }
  }
  
  /**
   * Format a value based on the chart group and variable name
   */
  private formatValue(value: number, row: SpreadsheetRow, stringValue?: string): string {
    console.log(`WORKER: Formatting value ${value} for row ${row.id} - ${row.chartGroup} - ${row.variableName}`);
    
    // If we have a string value, use it directly
    if (stringValue !== undefined) {
      console.log(`WORKER: Using string value "${stringValue}" directly`);
      return stringValue;
    }
    
    // If the value is a diagnostic code (1, 2, 3), preserve it as is
    if (value === 1 || value === 2 || value === 3) {
      console.log(`WORKER: Value is a diagnostic code ${value}, preserving as is`);
      return value.toString();
    }
    
    // If the value is exactly 0, check if we should preserve the existing value
    // Note: This should be redundant now as we're handling this in processRow,
    // but keeping as a safety measure
    if (value === 0 && row.value && parseFloat(row.value) !== 0) {
      console.log(`WORKER: Value is 0 but row has existing non-zero value ${row.value}, preserving existing value`);
      return row.value;
    }
    
    // Format based on chart group
    const chartGroup = row.chartGroup?.toLowerCase() || '';
    const variableName = row.variableName?.toLowerCase() || '';
    
    // Format currency values
    if (
      chartGroup.includes('account') || 
      chartGroup.includes('aging') || 
      (chartGroup.includes('key metric') && (
        variableName.includes('sales') || 
        variableName.includes('revenue') || 
        variableName.includes('profit')
      ))
    ) {
      // Format as currency
      console.log(`WORKER: Formatting ${value} as currency for ${chartGroup} - ${variableName}`);
      return this.formatCurrency(value);
    }
    
    // Format percentage values
    if (
      variableName.includes('percent') || 
      variableName.includes('rate') || 
      variableName.includes('margin')
    ) {
      // Format as percentage
      console.log(`WORKER: Formatting ${value} as percentage for ${chartGroup} - ${variableName}`);
      return this.formatPercentage(value);
    }
    
    // Format count values
    if (
      variableName.includes('count') || 
      variableName.includes('number') || 
      variableName.includes('orders') || 
      variableName.includes('customers')
    ) {
      // Format as integer
      console.log(`WORKER: Formatting ${value} as integer for ${chartGroup} - ${variableName}`);
      return Math.round(value).toString();
    }
    
    // Default formatting for other values
    if (value === Math.round(value)) {
      // Integer values
      console.log(`WORKER: Formatting ${value} as integer (default)`);
      return value.toString();
    } else {
      // Decimal values with 2 decimal places
      console.log(`WORKER: Formatting ${value} with 2 decimal places (default)`);
      return value.toFixed(2);
    }
  }
  
  /**
   * Format a value as currency
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  /**
   * Format a value as percentage
   */
  private formatPercentage(value: number): string {
    // Convert to percentage (multiply by 100)
    const percentage = value < 1 ? value * 100 : value;
    
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentage / 100);
  }

  /**
   * Execute a query for a row
   */
  private async executeQueryForRow(row: SpreadsheetRow): Promise<{ 
    value: number, 
    stringValue?: string, 
    error?: string, 
    errorType?: 'connection' | 'execution' | 'syntax' | 'other' 
  }> {
    console.log(`WORKER: Executing query for row ${row.id} - ${row.chartGroup} - ${row.variableName}`);
    
    // Get the SQL expression
    const sql = row.productionSqlExpression?.trim();
    
    // Skip if no SQL expression is defined
    if (!sql) {
      console.log(`WORKER: No SQL expression defined for row ${row.id}, skipping`);
      return { value: 2, error: 'No SQL expression defined', errorType: 'syntax' };
    }
    
    // Add schema prefix if not already present and server is P21
    let modifiedSql = sql;
    if (row.serverName === 'P21' && !sql.includes('dbo.')) {
      // Common P21 table names to add schema prefix to
      const p21Tables = [
        'oe_hdr', 'oe_line', 'invoice_hdr', 'invoice_line', 
        'customer', 'inv_mast', 'ar_open_items', 'ap_open_items'
      ];
      
      // Add dbo. prefix to each table name
      p21Tables.forEach(tableName => {
        // Use regex to match table names that aren't already prefixed
        const regex = new RegExp(`(?<![.\\w])${tableName}\\b`, 'g');
        modifiedSql = modifiedSql.replace(regex, `dbo.${tableName}`);
      });
      
      console.log(`WORKER: Modified SQL with schema prefixes: ${modifiedSql}`);
    }
    
    // Verify the query has a date filter if it's a COUNT query on oe_hdr
    if (row.serverName === 'P21' && 
        modifiedSql.toLowerCase().includes('count(*)') && 
        modifiedSql.toLowerCase().includes('oe_hdr') && 
        !modifiedSql.toLowerCase().includes('order_date')) {
      console.log(`WORKER: WARNING - COUNT query on oe_hdr without date filter detected!`);
      
      // For the "Total Orders" metric, ensure we have a date filter
      if (row.chartGroup === 'Key Metrics' && row.variableName === 'Total Orders') {
        console.log(`WORKER: Adding date filter to Total Orders query`);
        // Add date filter if not present
        if (!modifiedSql.toLowerCase().includes('where')) {
          modifiedSql = `${modifiedSql} WHERE order_date >= DATEADD(day, -7, GETDATE())`;
        } else if (!modifiedSql.toLowerCase().includes('order_date')) {
          // If WHERE clause exists but no date filter, add it with AND
          modifiedSql = modifiedSql.replace(/where\s+/i, 'WHERE order_date >= DATEADD(day, -7, GETDATE()) AND ');
        }
        console.log(`WORKER: Modified SQL with date filter: ${modifiedSql}`);
      }
    }
    
    // Log the server and SQL expression
    console.log(`WORKER: Executing query in production mode, testMode=${this.testMode}, server=${row.serverName}`);
    console.log(`WORKER: SQL query: ${modifiedSql}`);
    
    let value = 0;
    let stringValue: string | undefined = undefined;
    let error: string | undefined = undefined;
    let errorType: 'connection' | 'execution' | 'syntax' | 'other' | undefined = undefined;
    
    // In production mode, make a direct API call to execute the query
    // This will use our new fresh connection implementation
    console.log(`WORKER: Executing query for row ${row.id} with fresh connection`);
    
    try {
      let result;
      
      // Use the appropriate method based on server type
      if (row.serverName === 'P21') {
        result = await ConnectionManager.executeP21Query(modifiedSql);
      } else if (row.serverName === 'POR') {
        const porFilePath = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\OneDrive\\Desktop\\POR.MDB';
        result = await ConnectionManager.executeAccessQuery(
          { type: 'POR', filePath: porFilePath },
          modifiedSql
        );
      } else {
        throw new Error(`Unknown server type: ${row.serverName}`);
      }
      
      console.log(`WORKER: Query executed successfully, result:`, JSON.stringify(result).substring(0, 200));
      
      // Check if we have a valid result from the query
      if (result && result.length > 0) {
        const resultRow = result[0];
        console.log(`WORKER: First row of result data:`, JSON.stringify(resultRow));
        
        // The API now normalizes all results to include a 'value' property
        if ('value' in resultRow) {
          // Check if the value is a number or string
          if (typeof resultRow.value === 'number') {
            value = resultRow.value;
            console.log(`WORKER: Found numeric 'value' property with value ${value}`);
          } else if (resultRow.value !== null && resultRow.value !== undefined) {
            // Try to convert string values to numbers
            const parsedValue = parseFloat(String(resultRow.value));
            if (!isNaN(parsedValue)) {
              value = parsedValue;
              console.log(`WORKER: Converted string 'value' property to number: ${value}`);
            } else {
              // Handle non-numeric string values
              stringValue = String(resultRow.value);
              value = 0; // Set a default numeric value
              console.log(`WORKER: Found non-numeric string 'value' property with value "${stringValue}"`);
            }
          }
        } else {
          // Fallback to old behavior if for some reason the value property is missing
          const keys = Object.keys(resultRow);
          if (keys.length > 0) {
            // Try to find a key named 'value' or similar first
            const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
            const firstValue = resultRow[valueKey];
            
            // Check if the first value is a number or string
            if (typeof firstValue === 'number') {
              value = firstValue;
              console.log(`WORKER: Using numeric first column '${valueKey}' with value ${value}`);
            } else if (firstValue !== null && firstValue !== undefined) {
              // Try to convert string values to numbers
              const parsedValue = parseFloat(String(firstValue));
              if (!isNaN(parsedValue)) {
                value = parsedValue;
                console.log(`WORKER: Converted string first column '${valueKey}' to number: ${value}`);
              } else {
                // Handle non-numeric string values
                stringValue = String(firstValue);
                value = 0; // Set a default numeric value
                console.log(`WORKER: Using non-numeric string first column '${valueKey}' with value "${stringValue}"`);
              }
            }
          }
        }
      }
      
      // Check if we have a valid result from the query
      if (stringValue !== undefined) {
        console.log(`WORKER: Extracted string value "${stringValue}" from query result`);
        return { value: 0, stringValue, error: undefined, errorType: undefined };
      } else if (value !== undefined && value !== null) {
        console.log(`WORKER: Extracted numeric value ${value} from query result`);
        
        // IMPORTANT: Only return 0 if the query actually returned 0, not if parsing failed
        if (value === 0) {
          console.log(`WORKER: Query returned exactly zero, keeping as zero`);
          
          // If there's an existing non-zero value and this is a zero result,
          // check if we should preserve the existing value
          if (row.value && parseFloat(row.value) !== 0) {
            console.log(`WORKER: Query returned zero but row has existing non-zero value ${row.value}, preserving existing value`);
            return { 
              value: parseFloat(row.value), 
              error: undefined, 
              errorType: undefined 
            };
          }
        }
        
        return { value, error: undefined, errorType: undefined };
      } else {
        // If there was an existing value, preserve it
        if (row.value && parseFloat(row.value) !== 0) {
          console.log(`WORKER: Query returned no value, but row has existing value ${row.value}, preserving it`);
          return { 
            value: parseFloat(row.value), 
            error: 'Query returned no value but preserving existing value', 
            errorType: 'execution' 
          };
        }
        
        // Only if no value was returned at all and no existing value, use error code 3 (empty result)
        console.log(`WORKER: Query returned no value, setting diagnostic code 3`);
        return { value: 3, error: 'Query returned no value', errorType: 'execution' };
      }
    } catch (error) {
      console.error(`WORKER: Error executing query:`, error);
      
      // If there was an existing value, preserve it
      if (row.value && parseFloat(row.value) !== 0) {
        console.log(`WORKER: Query execution failed, but row has existing value ${row.value}, preserving it`);
        return { 
          value: parseFloat(row.value), 
          error: error instanceof Error ? error.message : 'Unknown error executing query',
          errorType: 'execution' 
        };
      }
      
      // If no existing value, return error code 0 (query execution error)
      return { 
        value: 0, 
        error: error instanceof Error ? error.message : 'Unknown error executing query',
        errorType: 'execution'
      };
    }
  }

  /**
   * Update a row in the execution state
   */
  private updateExecutionStateRow(row: SpreadsheetRow) {
    // Find the row in the updated data array
    const index = executionState.updatedData.findIndex(r => r.id === row.id);
    
    // Log the current state of updated data
    console.log(`WORKER: Current execution state has ${executionState.updatedData.length} rows`);
    console.log(`WORKER: Updating execution state for row ${row.id} with value: ${row.value}`);
    
    // If the row exists, update it
    if (index !== -1) {
      executionState.updatedData[index] = { ...row };
      console.log(`WORKER: Updated existing row in execution state at index ${index}`);
    } else {
      // Otherwise, add it to the array
      executionState.updatedData.push({ ...row });
      console.log(`WORKER: Added new row to execution state, now has ${executionState.updatedData.length} rows`);
    }
    
    // Ensure the value is properly set in the execution state
    const updatedRow = executionState.updatedData.find(r => r.id === row.id);
    if (updatedRow) {
      console.log(`WORKER: Verified row ${row.id} in execution state has value: ${updatedRow.value}`);
    }
  }
  
  /**
   * Save a row to the database
   */
  private async saveRowToDatabase(row: SpreadsheetRow) {
    try {
      console.log(`WORKER: Saving row ${row.id} to database with value: ${row.value}`);
      
      // Save directly to database
      await saveSpreadsheetRow(row);
      
      console.log(`WORKER: Row ${row.id} saved to database successfully`);
      
      // Verify the row was added to the execution state
      const updatedRow = executionState.updatedData.find(r => r.id === row.id);
      if (updatedRow) {
        console.log(`WORKER: Verified row ${row.id} in execution state has value: ${updatedRow.value}`);
      }
    } catch (error) {
      console.error(`WORKER: Error saving row ${row.id} to database:`, error);
    }
  }

  /**
   * Test method for P21 direct access
   * @param sql SQL query to execute
   * @returns Query result
   */
  private async testP21DirectAccess(sql: string): Promise<any[]> {
    try {
      // Use the DSN from environment or default to P21Play
      const dsn = process.env.P21_DSN || 'P21Play';
      
      console.log('Testing P21 direct access with ODBC DSN:', dsn);
      
      // Use the ODBC driver for P21 connections
      const odbc = require('odbc');
      
      // Connect using the DSN that's already configured in Windows
      const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
      console.log('ODBC connection string:', connectionString);
      
      console.log('Connecting to ODBC data source...');
      const connection = await odbc.connect(connectionString);
      console.log('Connected successfully to ODBC data source!');
      
      // Execute the query
      console.log('Executing query:', sql);
      try {
        const result = await connection.query(sql);
        console.log('Query executed successfully, raw result:', result);
        
        // Close the connection
        await connection.close();
        
        // Handle empty result sets properly
        if (!result || result.length === 0) {
          console.log('Query returned no results, returning empty result indicator');
          return [{ value: 3 }]; // 3 = empty result
        }
        
        // Log the result for debugging
        console.log('P21 query result structure:', JSON.stringify(result));
        
        // Process the result to ensure it has a 'value' property
        // This is important for compatibility with the rest of the application
        const processedResult = result.map((row: any) => {
          // If the row already has a 'value' property, keep it as is
          if ('value' in row) {
            // Convert string values to numbers when appropriate
            if (typeof row.value === 'string') {
              const parsedValue = parseFloat(row.value);
              if (!isNaN(parsedValue)) {
                return { ...row, value: parsedValue };
              }
            }
            return row;
          }
          
          // Otherwise, extract the first column value and create a new object with a 'value' property
          const keys = Object.keys(row);
          if (keys.length > 0) {
            // Try to find a key named 'value' or similar first
            const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
            const firstValue = row[valueKey];
            
            // Try to convert the value to a number if it's a string
            let numericValue = firstValue;
            if (typeof firstValue === 'string') {
              const parsedValue = parseFloat(firstValue);
              if (!isNaN(parsedValue)) {
                numericValue = parsedValue;
              }
            }
            
            console.log(`Processed row: Created value property with ${numericValue} from column ${valueKey}`);
            return { ...row, value: numericValue };
          }
          
          // Fallback if the row is empty
          return { value: 0 };
        });
        
        console.log('Processed result:', processedResult);
        return processedResult;
      } catch (queryError: any) {
        console.error('Query execution error:', queryError);
        
        // Close the connection
        await connection.close();
        
        // Return a result with a value of 0 to indicate error
        return [{ value: 0, error: queryError.message, errorType: 'execution' }];
      }
    } catch (error: any) {
      console.error('P21 direct access test failed:', error);
      
      // Return a result with a value of 0 to indicate error
      return [{ value: 0, error: error.message, errorType: 'connection' }];
    }
  }

  /**
   * Test method for POR direct access
   * @param sql SQL query to execute
   * @returns Query result
   */
  private async testPORDirectAccess(sql: string): Promise<any[]> {
    console.log(`WORKER: Testing POR direct access with query: ${sql}`);
    try {
      // Get any stored POR connection details from environment variables
      const config: any = {};
      
      if (process.env.POR_FILE_PATH) {
        config.filePath = process.env.POR_FILE_PATH;
      }
      
      console.log(`WORKER: POR config:`, config);
      
      // Call the API to execute the query
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/executeQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server: 'POR',
          config,
          query: sql
        }),
      });

      const result = await response.json();
      console.log(`WORKER: POR query result:`, result);
      
      if (!response.ok || !result.success) {
        console.error(`WORKER: POR query failed:`, result.error || response.statusText);
        return [{ 
          value: 0, 
          error: result.error || `API call failed: ${response.statusText}`,
          errorType: result.errorType || 'execution'
        }];
      }

      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        console.log(`WORKER: POR query returned no data`);
        return [{ value: 3 }]; // 3 = empty result
      }

      // Process the result to ensure it has a 'value' property
      const processedResult = result.data.map((row: any) => {
        // If the row already has a 'value' property, keep it as is
        if ('value' in row) {
          // Convert string values to numbers when appropriate
          if (typeof row.value === 'string') {
            const parsedValue = parseFloat(row.value);
            if (!isNaN(parsedValue)) {
              return { ...row, value: parsedValue };
            }
          }
          return row;
        }
        
        // Otherwise, extract the first column value and create a new object with a 'value' property
        const keys = Object.keys(row);
        if (keys.length > 0) {
          // Try to find a key named 'value' or similar first
          const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
          const firstValue = row[valueKey];
          
          // Try to convert the value to a number if it's a string
          let numericValue = firstValue;
          if (typeof firstValue === 'string') {
            const parsedValue = parseFloat(firstValue);
            if (!isNaN(parsedValue)) {
              numericValue = parsedValue;
            }
          }
          
          console.log(`Processed row: Created value property with ${numericValue} from column ${valueKey}`);
          return { ...row, value: numericValue };
        }
        
        // Fallback if the row is empty or if there was an error
        return { value: 0 };
      });
      
      return processedResult;
    } catch (error: any) {
      console.error(`WORKER: Error in testPORDirectAccess:`, error);
      // Return a result with a value of 0 to indicate error
      return [{ value: 0, error: error.message, errorType: 'connection' }];
    }
  }

  /**
   * Execute a test query
   * @param sql SQL query to execute
   * @returns Query result
   */
  private async executeTestQuery(sql: string): Promise<any[]> {
    console.log(`WORKER: Executing test query: ${sql}`);
    try {
      // In test mode, we should actually execute the query against our test database
      // rather than just generating a random value
      
      // Call the API to execute the query
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/executeQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server: 'TEST',
          query: sql,
          testMode: true
        }),
      });

      const result = await response.json();
      console.log(`WORKER: Test query result:`, result);
      
      if (!response.ok || !result.success) {
        console.error(`WORKER: Test query failed:`, result.error || response.statusText);
        return [{ 
          value: 0, 
          error: result.error || `API call failed: ${response.statusText}`,
          errorType: result.errorType || 'execution'
        }];
      }

      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        console.log(`WORKER: Test query returned no data`);
        return [{ value: 3 }]; // 3 = empty result
      }

      // Process the result to ensure it has a 'value' property
      const processedResult = result.data.map((row: any) => {
        // If the row already has a 'value' property, keep it as is
        if ('value' in row) {
          // Convert string values to numbers when appropriate
          if (typeof row.value === 'string') {
            const parsedValue = parseFloat(row.value);
            if (!isNaN(parsedValue)) {
              return { ...row, value: parsedValue };
            }
          }
          return row;
        }
        
        // Otherwise, extract the first column value and create a new object with a 'value' property
        const keys = Object.keys(row);
        if (keys.length > 0) {
          // Try to find a key named 'value' or similar first
          const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
          const firstValue = row[valueKey];
          
          // Try to convert the value to a number if it's a string
          let numericValue = firstValue;
          if (typeof firstValue === 'string') {
            const parsedValue = parseFloat(firstValue);
            if (!isNaN(parsedValue)) {
              numericValue = parsedValue;
            }
          }
          
          console.log(`Processed row: Created value property with ${numericValue} from column ${valueKey}`);
          return { ...row, value: numericValue };
        }
        
        // Fallback if the row is empty or if there was an error
        return { value: 0 };
      });
      
      return processedResult;
    } catch (error: any) {
      console.error(`WORKER: Error in executeTestQuery:`, error);
      // Return a result with a value of 0 to indicate error
      return [{ value: 0, error: error.message, errorType: 'execution' }];
    }
  }
}
