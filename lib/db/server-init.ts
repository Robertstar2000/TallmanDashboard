/**
 * Server initialization functions
 * This file contains functions that should be run when the server starts
 */

import { loadChartDataFromInitFile } from './sqlite';

// Flag to track if initialization has been performed
let initialized = false;

/**
 * Initialize the server
 * This function should be called when the server starts
 */
export async function initializeServer(): Promise<void> {
  // Only initialize once
  if (initialized) {
    console.log('Server already initialized, skipping');
    return;
  }
  
  console.log('Initializing server...');
  
  try {
    // Load chart data from the initialization file
    await loadChartDataFromInitFile();
    
    // Mark as initialized
    initialized = true;
    
    console.log('Server initialization complete');
  } catch (error) {
    console.error('Error initializing server:', error);
    throw error;
  }
}

// Call initializeServer when this module is imported
// This ensures that the server is initialized when the application starts
initializeServer().catch(error => {
  console.error('Failed to initialize server:', error);
});
