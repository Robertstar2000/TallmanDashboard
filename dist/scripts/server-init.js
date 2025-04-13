/**
 * Server initialization functions
 * This file contains functions that should be run when the server starts
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
import { loadChartDataFromInitFile } from './sqlite';
import path from 'path';
import fs from 'fs';
// Flag to track if initialization has been performed
let initialized = false;
/**
 * Clear all caches to ensure fresh data is loaded
 */
export function clearAllCaches() {
    console.log('Clearing all caches...');
    try {
        const dataDir = path.join(process.cwd(), 'data');
        // Clear global cache variables if they exist
        if (typeof global.chartDataCache !== 'undefined') {
            global.chartDataCache = null;
            console.log('Cleared global.chartDataCache');
        }
        if (typeof global.chartDataCacheVersion !== 'undefined') {
            global.chartDataCacheVersion = null;
            console.log('Cleared global.chartDataCacheVersion');
        }
        // Create cache refresh marker files
        const refreshMarkerPath = path.join(dataDir, 'refresh_required');
        fs.writeFileSync(refreshMarkerPath, new Date().toISOString());
        console.log('Created refresh_required marker');
        const cacheRefreshPath = path.join(dataDir, 'cache-refresh.txt');
        fs.writeFileSync(cacheRefreshPath, new Date().toISOString());
        console.log('Created cache-refresh.txt marker');
        const forceRefreshPath = path.join(dataDir, 'force_refresh.json');
        const refreshData = {
            timestamp: new Date().toISOString(),
            reason: "Server startup cache refresh"
        };
        fs.writeFileSync(forceRefreshPath, JSON.stringify(refreshData, null, 2));
        console.log('Created force_refresh.json marker');
        // Create a Next.js cache reset marker
        const nextCacheResetPath = path.join(process.cwd(), '.next-cache-reset');
        fs.writeFileSync(nextCacheResetPath, new Date().toISOString());
        console.log('Created .next-cache-reset marker');
        console.log('All caches cleared successfully');
    }
    catch (error) {
        console.error('Error clearing caches:', error);
    }
}
/**
 * Initialize the server
 * This function should be called when the server starts
 */
export function initializeServer() {
    return __awaiter(this, void 0, void 0, function* () {
        // Only initialize once
        if (initialized) {
            console.log('Server already initialized, skipping');
            return;
        }
        console.log('Initializing server...');
        try {
            // Clear all caches first to ensure fresh data
            clearAllCaches();
            // Load chart data from the initialization file
            yield loadChartDataFromInitFile();
            // Mark as initialized
            initialized = true;
            console.log('Server initialization complete');
        }
        catch (error) {
            console.error('Error initializing server:', error);
            throw error;
        }
    });
}
// Call initializeServer when this module is imported
// This ensures that the server is initialized when the application starts
initializeServer().catch(error => {
    console.error('Failed to initialize server:', error);
});
