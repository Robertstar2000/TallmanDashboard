"use strict";
/**
 * Query Worker for Tallman Dashboard
 *
 * This worker handles the sequential processing of SQL expressions
 * for each row in the dashboard data.
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
const DELAY_BETWEEN_ROWS = 2000; // 2 seconds delay between rows
self.onmessage = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, payload } = event.data;
    if (type === 'START') {
        const { rows, serverConfigs } = payload;
        try {
            // Process each row sequentially
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                // Notify main thread that we're starting a new row
                self.postMessage({
                    type: 'START_ROW',
                    payload: {
                        index: i,
                        id: row.id,
                        chartGroup: row.chartGroup,
                        variableName: row.variableName
                    }
                });
                try {
                    // Get the server configuration for this row
                    const serverConfig = serverConfigs.find((config) => config.name === row.serverName);
                    // Execute the SQL expression for this row
                    const result = yield executeQuery(row, serverConfig);
                    // Notify main thread that the row is complete with the result
                    self.postMessage({
                        type: 'ROW_COMPLETE',
                        payload: {
                            index: i,
                            id: row.id,
                            result: result
                        }
                    });
                }
                catch (rowError) {
                    // Report error for this specific row but continue processing
                    self.postMessage({
                        type: 'ROW_COMPLETE',
                        payload: {
                            index: i,
                            id: row.id,
                            error: rowError instanceof Error ? rowError.message : 'Unknown error',
                            result: { value: 0 }
                        }
                    });
                }
                // Wait before processing next row
                if (i < rows.length - 1) {
                    yield new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ROWS));
                }
            }
            // Notify main thread that all rows are complete
            self.postMessage({ type: 'COMPLETE' });
        }
        catch (error) {
            self.postMessage({
                type: 'ERROR',
                payload: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    else if (type === 'STOP') {
        // Handle stop request
        self.postMessage({ type: 'COMPLETE' });
    }
});
/**
 * Execute a query for a specific row
 *
 * This is a placeholder function as the actual query execution
 * will happen in the main thread. The worker just simulates
 * the processing time.
 */
function executeQuery(row, serverConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        // In a real implementation, this would execute the query
        // For now, we'll just simulate processing time
        yield new Promise(resolve => setTimeout(resolve, 500));
        // Return a placeholder result
        return {
            value: 100, // Placeholder value
            timestamp: new Date().toISOString()
        };
    });
}
