// This file should contain CLIENT-SIDE functions for interacting with the backend API
// related to database operations, and shared types.

// Do NOT include server-side 'better-sqlite3' logic here.

// Import necessary types used by client components and API functions
import { ServerConfig, DatabaseConnection } from './types';

// --- API Connection Test Functions ---

// Define the ConnectionTestResult interface (used by client components)
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

// Function to test P21 connection via API
export async function apiTestP21Connection(config: DatabaseConnection): Promise<ConnectionTestResult> {
  // Base URL should ideally come from config/env
  const apiUrl = '/api/connection/test'; // Use relative path for client-side fetch
  try {
    console.log('Testing P21 connection via API with config:', config);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Send the config object directly, adding the 'type' property
      body: JSON.stringify({ ...config, type: 'P21' }), 
    });

    const responseBody = await response.text(); // Read body first
    console.log('API P21 Test Response Status:', response.status);
    console.log('API P21 Test Response Body:', responseBody);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`; 
      try {
        const errorData = JSON.parse(responseBody);
        errorMessage = errorData.message || errorMessage;
      } catch (e) { /* Ignore JSON parse error */ }
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseBody);
    } catch (e) {
      console.error('Failed to parse successful P21 test response:', e);
      throw new Error('Failed to parse successful response from server.');
    }

  } catch (error) {
    console.error("API P21 Connection Test Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred during P21 test',
    };
  }
}

// Function to test POR connection via API
export async function apiTestPORConnection(config: DatabaseConnection): Promise<ConnectionTestResult> {
  const apiUrl = '/api/connection/test'; // Use relative path for client-side fetch
  try {
    console.log('Testing POR connection via API with config:', config);
    const response = await fetch(apiUrl, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Send the config object directly, adding the 'type' property
      body: JSON.stringify({ ...config, type: 'POR' }), 
    });

    const responseBody = await response.text(); // Read body first
    console.log('API POR Test Response Status:', response.status);
    console.log('API POR Test Response Body:', responseBody);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`; 
      try {
        const errorData = JSON.parse(responseBody);
        errorMessage = errorData.message || errorMessage;
      } catch (e) { /* Ignore JSON parse error */ }
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseBody);
    } catch (e) {
      console.error('Failed to parse successful POR test response:', e);
      throw new Error('Failed to parse successful response from server.');
    }

  } catch (error) {
    console.error("API POR Connection Test Error:", error);
     return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred during POR test',
    };
  }
}

// --- Client-Side API Functions ---

// TODO: Implement API endpoint and full logic for getting admin variables
export async function apiGetAdminVariables(): Promise<ServerConfig[]> {
  const apiUrl = '/api/admin/connection-settings'; // Use the correct endpoint
  console.log('Client: Fetching admin variables from API...');
  try {
    const response = await fetch(apiUrl, { method: 'GET' });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Attempt to parse error
      console.error('API Error fetching admin variables:', response.status, errorData);
      throw new Error(`Failed to fetch admin variables: ${response.status} ${errorData.message || ''}`.trim());
    }

    const data: ServerConfig[] = await response.json();
    console.log('Client: Received admin variables:', data);
    return data;

  } catch (error) {
    console.error('Error in apiGetAdminVariables:', error);
    // Depending on usage, might want to return empty array or re-throw
    return []; // Return empty array on error for now
  }
}

// TODO: Implement API endpoint and full logic for updating an admin variable
export async function apiUpdateAdminVariable(id: string, data: Partial<Omit<ServerConfig, 'id'>>): Promise<boolean> {
  const apiUrl = '/api/admin/connection-settings'; // Use the correct endpoint
  console.log(`Client: Updating admin variable ${id} via API with data:`, data);

  // The API expects an array of updates. We send an array with one item.
  const updatePayload = [{ id, ...data }]; 

  try {
    const response = await fetch(apiUrl, {
      method: 'POST', // Use POST as defined in the API route
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload), // Send the array
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Attempt to parse error
      console.error(`API Error updating admin variable ${id}:`, response.status, errorData);
      throw new Error(`Failed to update admin variable ${id}: ${response.status} ${errorData.message || ''}`.trim());
    }

    // Check the response body for overall success if the API provides it
    const result = await response.json();
    console.log(`Client: API response for update admin variable ${id}:`, result);
    // Assuming the API returns a success flag or similar
    // Adjust based on the actual API response structure if needed.
    // For now, just check if the overall status was ok.
    return true; 

  } catch (error) {
    console.error(`Error in apiUpdateAdminVariable for id ${id}:`, error);
    return false; // Indicate failure
  }
}
