var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { saveSpreadsheetRow, getChartData, updateAllRows } from '@/lib/db/sqlite';
import { ConnectionManager } from '@/lib/db/connection-manager';
import { DataProcessingService, executionState } from '@/lib/services/DataProcessingService';
import { ExecutionHighlighter } from '@/lib/services/ExecutionHighlighter';
/**
 * Execution state for tracking progress
 */
export { executionState };
/**
 * Background worker for processing spreadsheet rows
 */
export class BackgroundWorker {
    constructor() {
        this.serverConfigs = [];
        this.executionQueue = [];
        this.isProcessingQueue = false;
        this.activeRowId = null;
        this.processingStartTime = 0;
        this.processingTimes = new Map();
        this.dataProcessingService = DataProcessingService.getInstance();
        this.executionHighlighter = ExecutionHighlighter.getInstance();
    }
    /**
     * Get the singleton instance of BackgroundWorker
     */
    static getInstance() {
        if (!BackgroundWorker.instance) {
            BackgroundWorker.instance = new BackgroundWorker();
        }
        return BackgroundWorker.instance;
    }
    /**
     * Start the background worker
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Starting background worker...');
            try {
                // Load the server configurations
                yield this.loadServerConfigs();
                // Set the server configs in the data processing service
                this.dataProcessingService.setServerConfigs(this.serverConfigs);
                // Load the chart data
                const data = yield getChartData(true);
                // Queue all rows for processing
                this.queueRows(data);
                // Start processing the queue
                this.processQueue();
                console.log('Background worker started successfully');
                executionState.status = 'running';
            }
            catch (error) {
                console.error('Error starting background worker:', error);
                executionState.status = 'error';
                executionState.error = error instanceof Error ? error.message : 'Unknown error';
            }
        });
    }
    /**
     * Stop the background worker
     */
    stop() {
        console.log('Stopping background worker...');
        this.isProcessingQueue = false;
        this.executionQueue = [];
        this.dataProcessingService.stop();
        executionState.status = 'idle';
        // Clear any active row highlighting
        this.executionHighlighter.clearActiveRow();
        console.log('Background worker stopped');
    }
    /**
     * Get the current execution state
     */
    getExecutionState() {
        return executionState;
    }
    /**
     * Update the spreadsheet with the latest data
     */
    updateSpreadsheet() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Updating spreadsheet with latest data...');
            try {
                // Get the updated data from the execution state
                const updatedData = executionState.updatedData;
                // Update all rows in the database
                yield updateAllRows(updatedData);
                console.log(`Updated ${updatedData.length} rows in the spreadsheet`);
            }
            catch (error) {
                console.error('Error updating spreadsheet:', error);
            }
        });
    }
    /**
     * Queue rows for processing
     */
    queueRows(rows) {
        console.log(`Queueing ${rows.length} rows for processing...`);
        // Filter out rows without SQL expressions
        const validRows = rows.filter(row => row.sqlExpression &&
            row.sqlExpression.trim() !== '');
        this.executionQueue = [...validRows];
        console.log(`Queued ${this.executionQueue.length} valid rows for processing`);
        // Update execution state
        if (executionState.totalRows !== undefined) {
            executionState.totalRows = this.executionQueue.length;
        }
        if (executionState.processedRows !== undefined) {
            executionState.processedRows = 0;
        }
    }
    /**
     * Process the queue of rows
     */
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.isProcessingQueue) {
                console.log('Already processing queue, skipping...');
                return;
            }
            this.isProcessingQueue = true;
            console.log('Starting to process queue...');
            while (this.isProcessingQueue && this.executionQueue.length > 0) {
                // Get the next row to process
                const row = this.executionQueue.shift();
                if (!row) {
                    continue;
                }
                try {
                    // Set the active row
                    this.activeRowId = ((_a = row.id) === null || _a === void 0 ? void 0 : _a.toString()) || null;
                    executionState.activeRow = this.activeRowId;
                    // Step 1: Highlight the current row being processed
                    console.log(`Step 1: Highlighting row ${row.id} (${row.chartGroup} - ${row.DataPoint})...`);
                    this.highlightActiveRow(row);
                    // Record the start time
                    this.processingStartTime = Date.now();
                    // Step 2: Mark the row as executing
                    console.log(`Step 2: Marking row ${row.id} as executing...`);
                    this.executionHighlighter.markRowAsExecuting(row);
                    // Step 3: Execute the SQL expression
                    console.log(`Step 3: Executing SQL for row ${row.id}...`);
                    const updatedRow = yield this.dataProcessingService.processRow(row);
                    // Record the processing time
                    const processingTime = Date.now() - this.processingStartTime;
                    this.processingTimes.set(((_b = row.id) === null || _b === void 0 ? void 0 : _b.toString()) || 'unknown', processingTime);
                    // Step 4: Update the dashboard with the result
                    console.log(`Step 4: Updating dashboard for row ${row.id}...`);
                    yield this.updateDashboard(updatedRow);
                    // Step 5: Mark the row as completed
                    console.log(`Step 5: Marking row ${row.id} as completed...`);
                    const success = !updatedRow.error;
                    this.executionHighlighter.markRowAsCompleted(row, success);
                    // Increment processed rows count
                    if (executionState.processedRows !== undefined) {
                        executionState.processedRows += 1;
                    }
                    // Wait for 2 seconds before processing the next row (as per README specs)
                    console.log(`Waiting 2 seconds before processing next row...`);
                    yield new Promise(resolve => setTimeout(resolve, 2000));
                }
                catch (error) {
                    console.error(`Error processing row ${row.id}:`, error);
                    // Mark the row as failed
                    if (row) {
                        this.executionHighlighter.markRowAsCompleted(row, false);
                    }
                }
            }
            // When all rows are processed, update the execution state
            if (this.executionQueue.length === 0) {
                executionState.status = 'complete';
                executionState.activeRow = null;
                this.activeRowId = null;
                // Update the spreadsheet with all processed data
                yield this.updateSpreadsheet();
            }
            this.isProcessingQueue = false;
            console.log('Finished processing queue');
        });
    }
    /**
     * Highlight the active row being processed
     */
    highlightActiveRow(row) {
        console.log(`Highlighting row ${row.id} as active...`);
        // Use the execution highlighter to highlight the row
        this.executionHighlighter.highlightRow(row);
        // Update the row's status to 'active' in the execution state
        const updatedData = executionState.updatedData.map(item => {
            if (item.id === row.id) {
                return Object.assign(Object.assign({}, item), { status: 'active' });
            }
            return item;
        });
        executionState.updatedData = updatedData;
    }
    /**
     * Update the dashboard with the result of processing a row
     */
    updateDashboard(row) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Updating dashboard with result for row ${row.id}...`);
            // Update the row in the execution state with the new value
            const updatedData = executionState.updatedData.map(item => {
                if (item.id === row.id) {
                    return Object.assign(Object.assign({}, item), { value: row.value, status: 'completed', lastUpdated: new Date().toISOString() });
                }
                return item;
            });
            executionState.updatedData = updatedData;
            // Save the updated row to the database
            try {
                yield saveSpreadsheetRow(row);
                console.log(`Saved updated row ${row.id} to database`);
            }
            catch (error) {
                console.error(`Error saving row ${row.id} to database:`, error);
            }
        });
    }
    /**
     * Load server configurations
     */
    loadServerConfigs() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Loading server configurations...');
            try {
                // Get the connection manager instance
                const connectionManager = ConnectionManager.getInstance();
                // Get all server configurations
                this.serverConfigs = yield connectionManager.getAllServerConfigs();
                console.log(`Loaded ${this.serverConfigs.length} server configurations`);
            }
            catch (error) {
                console.error('Error loading server configurations:', error);
                throw error;
            }
        });
    }
}
