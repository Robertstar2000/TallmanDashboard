/*
  This module handles the background processing of the spreadsheet rows.
  When the program starts, it will initialize all spreadsheet variables to 0.
  Then, it will process each row's SQL expression sequentially in the background.
  The processing will continue until the stopSpreadsheetProcessing() function is called (e.g., when a stop button is pressed).
*/

import { initialSpreadsheetState } from './spreadsheet';
import { DashboardVariable, AdminVariable } from '@/lib/types/dashboard';
import { getAllVariables, updateDashboardVariable } from '@/lib/db/admin';
import { executeP21Query } from '@/lib/services/p21';

let processingInterval: NodeJS.Timeout | null = null;
let processingActive = false;
let processingIndex = 0;
let isInitializing = false;

// Convert AdminVariable to DashboardVariable using initialState as template
function convertToDashboardVariable(adminVar: AdminVariable): DashboardVariable | null {
  const template = initialSpreadsheetState.variables[adminVar.name || ''];
  if (!template) return null;
  
  return {
    ...template,
    value: Number(adminVar.value || 0),
    id: adminVar.name || '',
    name: adminVar.name || ''
  };
}

// Function to initialize all spreadsheet variables to zero
async function initializeSpreadsheetVariables(): Promise<void> {
  if (isInitializing) return;
  isInitializing = true;
  
  try {
    const variables = await getAllVariables();
    for (const variable of variables) {
      await updateDashboardVariable(variable.name || '', 'value', '0');
    }
    processingIndex = 0;
  } finally {
    isInitializing = false;
  }
}

// Execute SQL query based on mode (test or production)
async function executeSQLQuery(variable: DashboardVariable, isRealTime: boolean): Promise<number> {
  if (isRealTime && variable.prodSqlExpression) {
    try {
      const result = await executeP21Query(
        variable.prodSqlExpression,
        variable.prodDataDictionary || variable.p21DataDictionary
      );
      if (Array.isArray(result) && result.length > 0) {
        const firstRow = result[0];
        const firstValue = Object.values(firstRow)[0];
        return typeof firstValue === 'number' ? firstValue : 0;
      }
    } catch (error) {
      console.error('SQL Query execution error:', error);
    }
  }
  return 0;
}

// Processes the next row (i.e., the next spreadsheet variable) sequentially.
async function processNextRow(isRealTime: boolean): Promise<void> {
  if (isInitializing || !processingActive) return;
  
  try {
    const variables = await getAllVariables();
    if (!variables.length) return;
    
    // Process current row
    const variable = variables[processingIndex];
    if (variable) {
      const dashboardVar = convertToDashboardVariable(variable);
      if (dashboardVar) {
        const newValue = await executeSQLQuery(dashboardVar, isRealTime);
        await updateDashboardVariable(variable.name || '', 'value', String(newValue));
      }
    }
    
    // Move to next row
    processingIndex = (processingIndex + 1) % variables.length;
  } catch (error) {
    console.error('Error processing row:', error);
  }
}

// Starts the background processing of spreadsheet rows. This should be called on program start.
export async function startSpreadsheetProcessing(isRealTime: boolean): Promise<void> {
  if (processingActive) return; // Prevent multiple start calls
  
  try {
    // Initialize variables to zero first
    await initializeSpreadsheetVariables();
    
    // Start processing
    processingActive = true;
    processingIndex = 0;
    
    // Process first row immediately
    await processNextRow(isRealTime);
    
    // Then start the processing loop
    processingInterval = setInterval(() => {
      processNextRow(isRealTime);
    }, 5000);
  } catch (error) {
    console.error('Error starting spreadsheet processing:', error);
    await stopSpreadsheetProcessing();
  }
}

// Stops the background processing. Typically called when a stop button is pressed.
export async function stopSpreadsheetProcessing(): Promise<void> {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
  processingActive = false;
  processingIndex = 0;
  
  // Reset all variables to zero
  await initializeSpreadsheetVariables();
}

// Export current processing status for debugging if needed
export function isProcessingActive(): boolean {
  return processingActive;
}
