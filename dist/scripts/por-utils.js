var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Utility functions for working with Point of Rental (POR) MS Access database
 */
import { ConnectionManager } from './connection-manager';
/**
 * POR database utility functions
 */
export class PORUtils {
    /**
     * Get a list of all tables in the POR database
     * @param config Server configuration with filePath
     * @returns Array of table names
     */
    static listTables(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // This query works in MS Access to list all tables
                const query = `SELECT MSysObjects.Name AS TableName
                    FROM MSysObjects
                    WHERE (((MSysObjects.Type) In (1,4,6)) AND ((MSysObjects.Flags)=0))
                    ORDER BY MSysObjects.Name`;
                const result = yield ConnectionManager.executeAccessQuery(config, query);
                if (Array.isArray(result)) {
                    return result.map(row => row.TableName);
                }
                // If the above query fails, try an alternative approach
                try {
                    // Alternative query using schema information
                    const schemaQuery = `SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0`;
                    const schemaResult = yield ConnectionManager.executeAccessQuery(config, schemaQuery);
                    if (Array.isArray(schemaResult)) {
                        return schemaResult.map(row => row.Name);
                    }
                }
                catch (error) {
                    console.log('Alternative table listing approach failed:', error);
                }
                return [];
            }
            catch (error) {
                console.error('Error listing POR tables:', error);
                // If the standard approaches fail, try a more direct approach
                try {
                    // Try to query a list of common tables to see which ones exist
                    const commonTables = [
                        'Contracts', 'Invoices', 'WorkOrders', 'Customers', 'Items',
                        'Inventory', 'Rentals', 'Transactions', 'Payments', 'Employees',
                        'Vendors', 'PurchaseOrders', 'PurchaseOrderDetails'
                    ];
                    const existingTables = [];
                    for (const table of commonTables) {
                        try {
                            // Try to get the count from each table
                            const countQuery = `SELECT COUNT(*) AS Count FROM [${table}]`;
                            yield ConnectionManager.executeAccessQuery(config, countQuery);
                            existingTables.push(table);
                        }
                        catch (tableError) {
                            // Table doesn't exist, skip it
                        }
                    }
                    return existingTables;
                }
                catch (fallbackError) {
                    console.error('All table listing approaches failed:', fallbackError);
                    return [];
                }
            }
        });
    }
    /**
     * Get the structure of a table in the POR database
     * @param config Server configuration with filePath
     * @param tableName Name of the table
     * @returns Array of column information
     */
    static getTableStructure(config, tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // This query gets the column information for a table
                const query = `SELECT TOP 1 * FROM [${tableName}]`;
                // Execute the query to get a single row
                const result = yield ConnectionManager.executeAccessQuery(config, query);
                if (!Array.isArray(result) || result.length === 0) {
                    return [];
                }
                // Extract column names from the first row
                const firstRow = result[0];
                const columns = Object.keys(firstRow).map(columnName => ({
                    name: columnName,
                    type: typeof firstRow[columnName]
                }));
                return columns;
            }
            catch (error) {
                console.error(`Error getting structure for table ${tableName}:`, error);
                return [];
            }
        });
    }
    /**
     * Find purchase order related tables in the POR database
     * @param config Server configuration with filePath
     * @returns Array of table names that might contain purchase order data
     */
    static findPurchaseOrderTables(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all tables
                const allTables = yield this.listTables(config);
                // Filter tables that might be related to purchase orders
                const poKeywords = ['purchase', 'order', 'po', 'vendor', 'supplier', 'buy'];
                const potentialTables = allTables.filter(table => {
                    const tableLower = table.toLowerCase();
                    return poKeywords.some(keyword => tableLower.includes(keyword.toLowerCase()));
                });
                // Also include common PO table names
                const commonPoTables = ['PurchaseOrders', 'PurchaseOrderDetails', 'POHeader', 'PODetail', 'Vendors'];
                // Combine and deduplicate
                const combinedTables = [...new Set([...potentialTables, ...commonPoTables.filter(t => allTables.includes(t))])];
                return combinedTables;
            }
            catch (error) {
                console.error('Error finding purchase order tables:', error);
                return [];
            }
        });
    }
    /**
     * Execute a safe query against the POR database with error handling
     * @param config Server configuration with filePath
     * @param query SQL query to execute
     * @param defaultValue Value to return if the query fails
     * @returns Query result or default value if the query fails
     */
    static safeQuery(config_1, query_1) {
        return __awaiter(this, arguments, void 0, function* (config, query, defaultValue = []) {
            try {
                return yield ConnectionManager.executeAccessQuery(config, query);
            }
            catch (error) {
                console.error('POR query failed:', error);
                return defaultValue;
            }
        });
    }
}
