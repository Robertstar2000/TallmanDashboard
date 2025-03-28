import { useState, useEffect } from 'react';
import { ServerConfig } from '@/lib/db/connections';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';

interface ConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error?: string;
  lastChecked?: Date;
}

interface ConnectionResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Custom hook for managing database connections
 * @param serverType The type of server (P21 or POR)
 * @returns Connection state and methods
 */
export function useDatabaseConnection(serverType: 'P21' | 'POR') {
  // Default configurations
  const defaultP21Config: ServerConfig = {
    server: 'SQL01',
    database: 'P21play',
    username: 'sa',
    password: '',
    useWindowsAuth: true,
    port: 1433,
    type: 'P21'
  };

  const defaultPORConfig: ServerConfig = {
    server: 'TS03',
    database: 'POR',
    username: 'sa',
    password: '',
    useWindowsAuth: true,
    port: 1433,
    type: 'POR'
  };

  // Get the default config based on server type
  const defaultConfig = serverType === 'P21' ? defaultP21Config : defaultPORConfig;
  const storageKey = serverType === 'P21' ? 'p21-connection-config' : 'por-connection-config';

  // State for configuration and connection status
  const [config, setConfig] = useLocalStorage<ServerConfig>(storageKey, defaultConfig);
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isLoading: false
  });

  // Test the connection
  const testConnection = async (): Promise<ConnectionResult> => {
    setStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const response = await fetch('/api/connection/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });
      
      const result = await response.json();
      
      setStatus({
        isConnected: result.success,
        isLoading: false,
        error: result.success ? undefined : result.message,
        lastChecked: new Date()
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setStatus({
        isConnected: false,
        isLoading: false,
        error: errorMessage,
        lastChecked: new Date()
      });
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // Execute a query
  const executeQuery = async (query: string): Promise<any> => {
    if (!status.isConnected) {
      const result = await testConnection();
      if (!result.success) {
        throw new Error(`Cannot execute query: ${result.message}`);
      }
    }
    
    try {
      const response = await fetch('/api/connection/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          query
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Query execution failed');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Query execution failed: ${errorMessage}`);
    }
  };

  // Update configuration
  const updateConfig = (newConfig: Partial<ServerConfig>) => {
    setConfig((prev: ServerConfig) => ({
      ...prev,
      ...newConfig
    }));
    
    // Reset connection status when config changes
    setStatus({
      isConnected: false,
      isLoading: false
    });
  };

  // Reset to default configuration
  const resetConfig = () => {
    setConfig(defaultConfig);
    setStatus({
      isConnected: false,
      isLoading: false
    });
  };

  // Return the hook interface
  return {
    config,
    status,
    testConnection,
    executeQuery,
    updateConfig,
    resetConfig
  };
}

