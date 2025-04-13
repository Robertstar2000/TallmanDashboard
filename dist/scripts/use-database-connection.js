var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState } from 'react';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
/**
 * Custom hook for managing database connections
 * @param serverType The type of server (P21 or POR)
 * @returns Connection state and methods
 */
export function useDatabaseConnection(serverType) {
    // Default configurations
    const defaultP21Config = {
        server: 'SQL01',
        database: 'P21play',
        username: 'sa',
        password: '',
        useWindowsAuth: true,
        port: 1433,
        type: 'P21'
    };
    const defaultPORConfig = {
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
    const [config, setConfig] = useLocalStorage(storageKey, defaultConfig);
    const [status, setStatus] = useState({
        isConnected: false,
        isLoading: false
    });
    // Test the connection
    const testConnection = () => __awaiter(this, void 0, void 0, function* () {
        setStatus(prev => (Object.assign(Object.assign({}, prev), { isLoading: true, error: undefined })));
        try {
            const response = yield fetch('/api/connection/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ config }),
            });
            const result = yield response.json();
            setStatus({
                isConnected: result.success,
                isLoading: false,
                error: result.success ? undefined : result.message,
                lastChecked: new Date()
            });
            return result;
        }
        catch (error) {
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
    });
    // Execute a query
    const executeQuery = (query) => __awaiter(this, void 0, void 0, function* () {
        if (!status.isConnected) {
            const result = yield testConnection();
            if (!result.success) {
                throw new Error(`Cannot execute query: ${result.message}`);
            }
        }
        try {
            const response = yield fetch('/api/connection/execute', {
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
                const errorData = yield response.json();
                throw new Error(errorData.message || 'Query execution failed');
            }
            const data = yield response.json();
            return data.data;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Query execution failed: ${errorMessage}`);
        }
    });
    // Update configuration
    const updateConfig = (newConfig) => {
        setConfig((prev) => (Object.assign(Object.assign({}, prev), newConfig)));
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
