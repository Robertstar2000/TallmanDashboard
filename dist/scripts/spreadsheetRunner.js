/*
  This module handles the background processing of the spreadsheet rows.
  When the program starts, it will initialize all spreadsheet variables to 0.
  Then, it will process each row's SQL expression sequentially in the background.
  The processing will continue until the stopSpreadsheetProcessing() function is called (e.g., when a stop button is pressed).
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
import { initialSpreadsheetState } from './spreadsheet';
import { getDashboardVariables, updateDashboardVariable } from '@/lib/db/admin';
import { executeP21Query } from '@/lib/services/p21';
import { DatabaseManager } from '@/lib/db/database-connection';
let processingInterval = null;
let processingActive = false;
let processingIndex = 0;
let isInitializing = false;
// Convert AdminVariable to DashboardVariable using initialState as template
function convertToDashboardVariable(adminVar) {
    if (!adminVar.variableName)
        return null;
    const template = initialSpreadsheetState.variables[adminVar.variableName];
    if (!template)
        return null;
    return Object.assign(Object.assign({}, template), { value: adminVar.value || 0, id: adminVar.variableName, name: adminVar.variableName });
}
// Function to initialize all spreadsheet variables to zero
function initializeSpreadsheetVariables() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isInitializing)
            return;
        isInitializing = true;
        try {
            console.log('Initializing spreadsheet variables...');
            // Check database connection first
            const dbManager = DatabaseManager.getInstance();
            const connectionState = dbManager.getConnectionState();
            if (!connectionState.p21Connected) {
                console.error('Cannot initialize variables: P21 database not connected');
                // Dispatch connection error event
                if (typeof window !== 'undefined') {
                    const event = new CustomEvent('spreadsheetProcessingUpdate', {
                        detail: {
                            error: 'P21 database not connected. Please connect to the database first.',
                            status: 'error'
                        }
                    });
                    window.dispatchEvent(event);
                }
                return;
            }
            const variables = yield getDashboardVariables();
            if (!Array.isArray(variables) || variables.length === 0) {
                console.error('No dashboard variables found during initialization');
                return;
            }
            console.log(`Found ${variables.length} variables to initialize`);
            for (const variable of variables) {
                if (!variable || !variable.id) {
                    console.error('Invalid variable found:', variable);
                    continue;
                }
                try {
                    yield updateDashboardVariable(variable.id.toString(), 'value', '0');
                    console.log(`Initialized variable ${variable.variableName || variable.id} to 0`);
                }
                catch (error) {
                    console.error(`Failed to initialize variable ${variable.variableName || variable.id}:`, error);
                }
            }
            processingIndex = 0;
            console.log('Spreadsheet variables initialization complete');
            // Dispatch success event
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('spreadsheetProcessingUpdate', {
                    detail: {
                        status: 'idle',
                        message: 'Variables initialized successfully'
                    }
                });
                window.dispatchEvent(event);
            }
        }
        catch (error) {
            console.error('Error initializing spreadsheet variables:', error);
            // Dispatch error event
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('spreadsheetProcessingUpdate', {
                    detail: {
                        error: error instanceof Error ? error.message : String(error),
                        status: 'error'
                    }
                });
                window.dispatchEvent(event);
            }
        }
        finally {
            isInitializing = false;
        }
    });
}
// Execute SQL query based on mode (test or production)
function executeSQLQuery(sqlExpression, serverType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!sqlExpression) {
                console.error('Empty SQL expression provided');
                return 0;
            }
            console.log(`Executing ${serverType} query: ${sqlExpression}`);
            const result = yield executeP21Query(sqlExpression, serverType);
            if (typeof result !== 'string') {
                console.error(`Invalid query result type. Expected string but got ${typeof result}:`, result);
                return 0;
            }
            const numericResult = parseFloat(result);
            if (isNaN(numericResult)) {
                console.error(`Could not convert result to number:`, result);
                return 0;
            }
            return numericResult;
        }
        catch (error) {
            console.error(`Error executing ${serverType} query:`, error);
            return process.env.NODE_ENV === 'production' ? 0 : -1;
        }
    });
}
// Processes the next row (i.e., the next spreadsheet variable) sequentially.
function processNextRow(isRealTime) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const variables = yield getDashboardVariables();
            if (!Array.isArray(variables) || variables.length === 0) {
                console.error('No variables found to process');
                return;
            }
            if (processingIndex >= variables.length) {
                processingIndex = 0;
                console.log('Reset processing index to 0');
                return;
            }
            const currentVariable = variables[processingIndex];
            if (!currentVariable) {
                console.error(`No variable found at index ${processingIndex}`);
                processingIndex++;
                return;
            }
            const variableId = currentVariable.id || currentVariable.name;
            console.log(`Processing variable: ${currentVariable.variableName || variableId} (${processingIndex + 1}/${variables.length})`);
            if (!currentVariable.sqlExpression) {
                console.log(`No SQL expression for variable ${currentVariable.variableName || variableId}, skipping`);
                processingIndex++;
                return;
            }
            const result = yield executeSQLQuery(currentVariable.sqlExpression, (currentVariable.serverName || 'P21'));
            yield updateDashboardVariable(variableId, 'value', result.toString());
            console.log(`Updated ${currentVariable.variableName || variableId} with value: ${result}`);
            // Dispatch event for UI update
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('spreadsheetProcessingUpdate', {
                    detail: {
                        variable: currentVariable,
                        status: 'running'
                    }
                });
                window.dispatchEvent(event);
            }
            processingIndex++;
        }
        catch (error) {
            console.error('Error processing row:', error);
            // Dispatch error event for UI update
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('spreadsheetProcessingUpdate', {
                    detail: {
                        error: error instanceof Error ? error.message : String(error),
                        status: 'error'
                    }
                });
                window.dispatchEvent(event);
            }
        }
    });
}
// Starts the background processing of spreadsheet rows. This should be called on program start.
export function startSpreadsheetProcessing(isRealTime) {
    return __awaiter(this, void 0, void 0, function* () {
        if (processingActive)
            return; // Prevent multiple start calls
        try {
            // Initialize variables to zero first
            yield initializeSpreadsheetVariables();
            // Start processing
            processingActive = true;
            processingIndex = 0;
            // Process first row immediately
            yield processNextRow(isRealTime);
            // Then start the processing loop
            processingInterval = setInterval(() => {
                processNextRow(isRealTime);
            }, 5000);
        }
        catch (error) {
            console.error('Error starting spreadsheet processing:', error);
            yield stopSpreadsheetProcessing();
        }
    });
}
// Stops the background processing. Typically called when a stop button is pressed.
export function stopSpreadsheetProcessing() {
    return __awaiter(this, void 0, void 0, function* () {
        if (processingInterval) {
            clearInterval(processingInterval);
            processingInterval = null;
        }
        processingActive = false;
        processingIndex = 0;
        // Reset all variables to zero
        yield initializeSpreadsheetVariables();
    });
}
// Export current processing status for debugging if needed
export function isProcessingActive() {
    return processingActive;
}
