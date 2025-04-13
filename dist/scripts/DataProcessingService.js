/**
 * Data Processing Service for Tallman Dashboard
 *
 * This service handles the processing of SQL expressions for chart data:
 * 1. Connects to the correct server (P21 or POR)
 * 2. Executes SQL expressions and transforms results into values
 * 3. Updates the local database with results
 * 4. Ensures data consistency across the dashboard
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ConnectionManager } from '../db/connection-manager';
import { saveSpreadsheetRow } from '../db/sqlite';
// Create a singleton execution state
export const executionState = {
    status: 'idle',
    activeRow: null,
    updatedData: [],
    error: undefined,
    totalRows: 0,
    processedRows: 0
};
/**
 * Data Processing Service
 *
 * Handles the execution of SQL expressions and updating the database
 */
export class DataProcessingService {
    constructor() {
        this.isRunning = false;
        this.abortController = null;
        this.serverConfigs = [];
        // Private constructor to enforce singleton pattern
    }
    /**
     * Get the singleton instance of DataProcessingService
     */
    static getInstance() {
        if (!DataProcessingService.instance) {
            DataProcessingService.instance = new DataProcessingService();
        }
        return DataProcessingService.instance;
    }
    /**
     * Stop the current processing
     */
    stop() {
        if (this.isRunning && this.abortController) {
            this.abortController.abort();
            this.isRunning = false;
            executionState.status = 'idle';
            executionState.activeRow = null;
        }
    }
    /**
     * Set server configurations
     */
    setServerConfigs(configs) {
        this.serverConfigs = configs;
    }
    /**
     * Start processing data rows
     */
    run(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRunning) {
                console.log('DataProcessingService is already running');
                return;
            }
            this.isRunning = true;
            this.abortController = new AbortController();
            // Reset execution state
            executionState.status = 'running';
            executionState.activeRow = null;
            executionState.updatedData = [...data];
            executionState.error = undefined;
            executionState.totalRows = data.length;
            executionState.processedRows = 0;
            try {
                yield this.processRows(data);
            }
            catch (error) {
                console.error('Error in DataProcessingService.run:', error);
                executionState.status = 'error';
                executionState.error = error instanceof Error ? error.message : 'Unknown error';
            }
            finally {
                this.isRunning = false;
                this.abortController = null;
            }
        });
    }
    /**
     * Process all rows in a continuous loop
     */
    processRows(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Sort the data by ID to ensure sequential processing
            const sortedData = [...data].sort((a, b) => {
                const idA = parseInt(a.id, 10);
                const idB = parseInt(b.id, 10);
                return idA - idB;
            });
            console.log(`Processing ${sortedData.length} rows in sequence`);
            // Track consecutive errors to prevent infinite error loops
            let consecutiveErrors = 0;
            const maxConsecutiveErrors = 3;
            // Continue processing until explicitly stopped
            while (this.isRunning && this.abortController && !this.abortController.signal.aborted) {
                console.log(`Starting a new processing cycle through all ${sortedData.length} rows`);
                // Process each row in sequence
                for (let i = 0; i < sortedData.length; i++) {
                    // Check if we should abort
                    if (!this.isRunning || !this.abortController || this.abortController.signal.aborted) {
                        console.log('Processing aborted');
                        break;
                    }
                    // Get the current row
                    const row = sortedData[i];
                    // Set the active row in the execution state
                    executionState.activeRow = row.id;
                    try {
                        console.log(`Processing row ${i + 1}/${sortedData.length}: ID ${row.id} - ${row.chartGroup} - ${row.variableName}`);
                        // Skip rows without SQL expressions
                        if (!row.sqlExpression || row.sqlExpression.trim() === '') {
                            console.log(`Skipping row ${row.id} - No SQL expression`);
                            continue;
                        }
                        // Process the row and get the updated row
                        const updatedRow = yield this.processRow(row);
                        // Save the updated row to the database
                        yield this.saveRowToDatabase(updatedRow);
                        // Increment processed rows counter
                        executionState.processedRows = (executionState.processedRows || 0) + 1;
                        // Reset consecutive errors counter on success
                        consecutiveErrors = 0;
                        // Add a small delay between rows to prevent overwhelming the server
                        yield new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay as per README
                    }
                    catch (error) {
                        console.error(`Error processing row ${row.id}:`, error);
                        // Update the row with the error
                        row.error = error instanceof Error ? error.message : 'Unknown error';
                        this.updateExecutionStateRow(row);
                        // Increment consecutive errors counter
                        consecutiveErrors++;
                        // If we've hit the maximum number of consecutive errors, abort
                        if (consecutiveErrors >= maxConsecutiveErrors) {
                            console.error(`Too many consecutive errors (${consecutiveErrors}), aborting`);
                            executionState.status = 'error';
                            executionState.error = `Too many consecutive errors: ${error instanceof Error ? error.message : 'Unknown error'}`;
                            this.isRunning = false;
                            break;
                        }
                        // Add a small delay after an error before continuing
                        yield new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay as per README
                        // Continue with the next row even if there was an error
                        continue;
                    }
                }
                // If we've been stopped or aborted during processing, break out of the loop
                if (!this.isRunning || !this.abortController || this.abortController.signal.aborted) {
                    break;
                }
                // Add a small delay between cycles
                console.log('Completed one full cycle, pausing briefly before restarting');
                yield new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay between cycles
            }
            // Set the final status
            if (this.abortController && !this.abortController.signal.aborted && executionState.status !== 'error') {
                console.log('Processing complete');
                executionState.status = 'complete';
            }
            else if (this.abortController && this.abortController.signal.aborted) {
                console.log('Processing was aborted');
                executionState.status = 'idle';
            }
            // Clear the active row
            executionState.activeRow = null;
        });
    }
    /**
     * Process a single row
     * Made public to allow direct processing of individual rows
     */
    processRow(row) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Execute the query for this row
                const queryResult = yield this.executeQueryForRow(row);
                // Format the value based on the chart group and variable name
                const formattedValue = this.formatValue(queryResult.value, row, queryResult.stringValue);
                // Create the updated row with the new value
                const updatedRow = Object.assign(Object.assign({}, row), { value: formattedValue, lastUpdated: new Date().toISOString() });
                // Add error information if there was an error
                if (queryResult.error) {
                    updatedRow.error = queryResult.error;
                    updatedRow.errorType = queryResult.errorType;
                    updatedRow.lastError = new Date().toISOString();
                }
                else {
                    // Clear any previous errors
                    updatedRow.error = undefined;
                    updatedRow.errorType = undefined;
                    updatedRow.lastError = undefined;
                }
                // Update the row in the execution state data
                this.updateExecutionStateRow(updatedRow);
                return updatedRow;
            }
            catch (error) {
                console.error(`Error processing row ${row.id}:`, error);
                // Preserve the existing value if possible
                const existingValue = row.value || "0";
                // Create an error row
                const errorRow = Object.assign(Object.assign({}, row), { value: existingValue, error: error instanceof Error ? error.message : 'Unknown error', errorType: 'execution', lastError: new Date().toISOString() });
                // Update the row in the execution state data
                this.updateExecutionStateRow(errorRow);
                return errorRow;
            }
        });
    }
    /**
     * Update a row in the execution state data
     */
    updateExecutionStateRow(updatedRow) {
        // Find the index of the row in the execution state data
        const index = executionState.updatedData.findIndex(row => row.id === updatedRow.id);
        // If the row exists, update it; otherwise, add it
        if (index !== -1) {
            executionState.updatedData[index] = updatedRow;
        }
        else {
            executionState.updatedData.push(updatedRow);
        }
    }
    /**
     * Save a row to the database
     */
    saveRowToDatabase(row) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield saveSpreadsheetRow(row);
                console.log(`Saved row ${row.id} to database`);
            }
            catch (error) {
                console.error(`Error saving row ${row.id} to database:`, error);
                throw error;
            }
        });
    }
    /**
     * Execute a query for a row
     */
    executeQueryForRow(row) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Get the SQL expression
            const sql = (_a = row.sqlExpression) === null || _a === void 0 ? void 0 : _a.trim();
            // Skip if no SQL expression is defined
            if (!sql) {
                return { value: 0, error: 'No SQL expression defined', errorType: 'syntax' };
            }
            try {
                // Use the appropriate server configuration based on the row's server name
                const serverConfig = this.serverConfigs.find(config => config.name === row.serverName);
                if (!serverConfig) {
                    throw new Error(`Server configuration not found for ${row.serverName}`);
                }
                // Get the connection manager
                const connectionManager = ConnectionManager.getInstance();
                // Execute the query using the connection manager
                const result = yield connectionManager.executeQuery(row.serverName, serverConfig, sql);
                // Check if we have a valid result
                if (result && result.length > 0) {
                    const resultRow = result[0];
                    // Check if the result has a value property
                    if ('value' in resultRow) {
                        // Try to convert the value to a number
                        const numericValue = parseFloat(resultRow.value);
                        if (!isNaN(numericValue)) {
                            return { value: numericValue, stringValue: resultRow.value };
                        }
                        else {
                            return { value: 0, stringValue: resultRow.value, error: 'Non-numeric value returned', errorType: 'execution' };
                        }
                    }
                    else {
                        // Try to find a value in the result
                        const keys = Object.keys(resultRow);
                        if (keys.length > 0) {
                            const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
                            const firstValue = resultRow[valueKey];
                            // Try to convert the value to a number
                            if (typeof firstValue === 'number') {
                                return { value: firstValue, stringValue: String(firstValue) };
                            }
                            else if (firstValue !== null && firstValue !== undefined) {
                                const parsedValue = parseFloat(String(firstValue));
                                if (!isNaN(parsedValue)) {
                                    return { value: parsedValue, stringValue: String(firstValue) };
                                }
                                else {
                                    return { value: 0, stringValue: String(firstValue), error: 'Non-numeric value returned', errorType: 'execution' };
                                }
                            }
                        }
                    }
                }
                // Default return if no value was extracted
                return { value: 0, error: 'No value returned from query', errorType: 'execution' };
            }
            catch (error) {
                console.error(`Error executing query for row ${row.id}:`, error);
                // Determine error type
                let errorType = 'execution';
                if (error instanceof Error) {
                    if (error.message.includes('connection') || error.message.includes('network')) {
                        errorType = 'connection';
                    }
                    else if (error.message.includes('syntax') || error.message.includes('invalid')) {
                        errorType = 'syntax';
                    }
                }
                return {
                    value: 0,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    errorType
                };
            }
        });
    }
    /**
     * Format a value based on the chart group and variable name
     */
    formatValue(value, row, stringValue) {
        // Default to returning the value as a string
        return value.toString();
    }
}
