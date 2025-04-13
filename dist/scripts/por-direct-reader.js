/**
 * POR Direct Reader
 *
 * This module provides direct access to the Point of Rental MS Access database
 * using the mdb-reader package, without requiring ODBC or the Microsoft Access Database Engine.
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
import * as fs from 'fs';
import MDBReader from 'mdb-reader';
export class PORDirectReader {
    constructor(filePath) {
        this.isConnected = false;
        this.poTables = [];
        this.filePath = filePath;
    }
    /**
     * Connect to the MS Access database
     */
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[PORDirectReader] Starting connect method...');
            try {
                // Check if the file exists
                if (!this.filePath) {
                    console.error('[PORDirectReader] Error: No file path provided.');
                    return { success: false, message: 'No file path provided for MS Access database' };
                }
                console.log(`[PORDirectReader] File path provided: ${this.filePath}`);
                if (!fs.existsSync(this.filePath)) {
                    console.error(`[PORDirectReader] Error: File not found at path: ${this.filePath}`);
                    return { success: false, message: `MS Access file not found at path: ${this.filePath}` };
                }
                console.log(`[PORDirectReader] File exists at: ${this.filePath}`);
                // Read the database file
                console.log('[PORDirectReader] Attempting to read file buffer...');
                const buffer = fs.readFileSync(this.filePath);
                console.log(`[PORDirectReader] File buffer read successfully, size: ${buffer.length} bytes.`);
                console.log('[PORDirectReader] Attempting to instantiate MDBReader...');
                this.reader = new MDBReader(buffer);
                console.log('[PORDirectReader] MDBReader instantiated successfully.');
                // Get available tables
                console.log('[PORDirectReader] Attempting to get table names...');
                const tables = this.reader.getTableNames();
                console.log(`[PORDirectReader] Got ${tables.length} table names.`);
                if (tables.length === 0) {
                    console.warn('[PORDirectReader] Warning: No tables found in the database.');
                    // Decide if this should be an error or just a warning
                    // return { success: false, message: 'No tables found in the database' };
                }
                // Find all purchase order tables (optional step, might not be necessary for basic connection)
                // console.log('[PORDirectReader] Attempting to find purchase order tables...');
                // this.poTables = await this.findPurchaseOrderTables();
                // console.log(`[PORDirectReader] Found ${this.poTables.length} potential PO tables.`);
                // if (this.poTables.length === 0) {
                //   console.warn('[PORDirectReader] Could not find any suitable purchase order tables.');
                // return {
                //   success: false,
                //   message: 'Could not find any suitable purchase order tables in the database'
                // };
                // }
                this.isConnected = true;
                console.log('[PORDirectReader] Connection successful.');
                return {
                    success: true,
                    // message: `Successfully connected to POR database and found PO table: ${this.poTables[0]?.name || 'N/A'}`
                    message: `Successfully connected to POR database.`
                };
            }
            catch (error) {
                console.error(`[PORDirectReader] Error during connect:`, error); // Log full error
                this.isConnected = false; // Ensure disconnected state on error
                this.reader = null; // Clear reader on error
                return { success: false, message: `Error connecting to POR database: ${error.message}` };
            }
        });
    }
    /**
     * Find all suitable tables for purchase order data
     */
    findPurchaseOrderTables() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.reader) {
                return [];
            }
            const tables = this.reader.getTableNames();
            const poTables = [];
            // Define tables to check in priority order
            const priorityTables = [
                'PurchaseOrder',
                'PurchaseOrderDetail',
                'AccountingAPIQueuePO',
                'AccountingAPIQueuePODetail',
                'TransferToRent',
                'CostOfGoods',
                'SoldAssetFile',
                'CallLog'
            ];
            // First check priority tables
            for (const tableName of priorityTables) {
                if (tables.includes(tableName)) {
                    try {
                        const table = this.reader.getTable(tableName);
                        const columns = table.getColumnNames();
                        const rowCount = table.rowCount;
                        // Skip empty tables
                        if (rowCount === 0 && tableName !== 'AccountingAPIQueuePO') {
                            continue;
                        }
                        // Check for essential PO columns
                        const poNumberColumn = this.findColumnByKeywords(columns, [
                            'ponumber', 'po_number', 'purchaseorder', 'purchase_order', 'po', 'purchasenumber'
                        ]);
                        // Add to list if it has at least a PO number column
                        if (poNumberColumn) {
                            const dateColumn = this.findColumnByKeywords(columns, [
                                'date', 'created', 'timestamp', 'time', 'podate', 'purchasedate'
                            ]);
                            const vendorNumberColumn = this.findColumnByKeywords(columns, [
                                'vendor', 'supplier', 'vendornumber', 'vendor_number'
                            ]);
                            const vendorNameColumn = this.findColumnByKeywords(columns, [
                                'vendorname', 'vendor_name', 'suppliername', 'supplier_name'
                            ]);
                            // Updated to prioritize 'TotalAmount' as the first keyword
                            const totalAmountColumn = this.findColumnByKeywords(columns, [
                                'totalamount', 'total', 'amount', 'total_amount', 'purchaseprice', 'purchasecost', 'cost'
                            ]);
                            const statusColumn = this.findColumnByKeywords(columns, [
                                'status', 'state'
                            ]);
                            const storeColumn = this.findColumnByKeywords(columns, [
                                'store', 'location', 'branch'
                            ]);
                            const notesColumn = this.findColumnByKeywords(columns, [
                                'notes', 'note', 'comment', 'description'
                            ]);
                            // Calculate confidence score (0-100)
                            let confidence = 0;
                            if (poNumberColumn)
                                confidence += 40;
                            if (dateColumn)
                                confidence += 20;
                            if (totalAmountColumn)
                                confidence += 20;
                            if (vendorNumberColumn)
                                confidence += 20;
                            poTables.push({
                                name: tableName,
                                confidence,
                                poNumberColumn,
                                dateColumn: dateColumn || undefined,
                                vendorNumberColumn: vendorNumberColumn || undefined,
                                vendorNameColumn: vendorNameColumn || undefined,
                                totalAmountColumn: totalAmountColumn || undefined,
                                statusColumn: statusColumn || undefined,
                                storeColumn: storeColumn || undefined,
                                notesColumn: notesColumn || undefined
                            });
                        }
                    }
                    catch (error) {
                        // Skip tables that can't be read
                        continue;
                    }
                }
            }
            // Then check for any other tables with PO-related keywords
            if (poTables.length === 0) {
                const poKeywords = ['po', 'purchase', 'order', 'vendor', 'supplier'];
                const potentialTables = tables.filter((tableName) => {
                    const lowerName = tableName.toLowerCase();
                    return poKeywords.some(keyword => lowerName.includes(keyword));
                });
                for (const tableName of potentialTables) {
                    if (!priorityTables.includes(tableName)) {
                        try {
                            const table = this.reader.getTable(tableName);
                            const columns = table.getColumnNames();
                            const rowCount = table.rowCount;
                            // Skip empty tables
                            if (rowCount === 0) {
                                continue;
                            }
                            // Check for essential PO columns
                            const poNumberColumn = this.findColumnByKeywords(columns, [
                                'ponumber', 'po_number', 'purchaseorder', 'purchase_order', 'po', 'purchasenumber'
                            ]);
                            if (poNumberColumn) {
                                const dateColumn = this.findColumnByKeywords(columns, [
                                    'date', 'created', 'timestamp', 'time', 'podate', 'purchasedate'
                                ]);
                                const vendorNumberColumn = this.findColumnByKeywords(columns, [
                                    'vendor', 'supplier', 'vendornumber', 'vendor_number'
                                ]);
                                const vendorNameColumn = this.findColumnByKeywords(columns, [
                                    'vendorname', 'vendor_name', 'suppliername', 'supplier_name'
                                ]);
                                // Updated to prioritize 'TotalAmount' as the first keyword
                                const totalAmountColumn = this.findColumnByKeywords(columns, [
                                    'totalamount', 'total', 'amount', 'total_amount', 'purchaseprice', 'purchasecost', 'cost'
                                ]);
                                const statusColumn = this.findColumnByKeywords(columns, [
                                    'status', 'state'
                                ]);
                                const storeColumn = this.findColumnByKeywords(columns, [
                                    'store', 'location', 'branch'
                                ]);
                                const notesColumn = this.findColumnByKeywords(columns, [
                                    'notes', 'note', 'comment', 'description'
                                ]);
                                // Calculate confidence score (0-100)
                                let confidence = 0;
                                if (poNumberColumn)
                                    confidence += 40;
                                if (dateColumn)
                                    confidence += 20;
                                if (totalAmountColumn)
                                    confidence += 20;
                                if (vendorNumberColumn)
                                    confidence += 20;
                                poTables.push({
                                    name: tableName,
                                    confidence,
                                    poNumberColumn,
                                    dateColumn: dateColumn || undefined,
                                    vendorNumberColumn: vendorNumberColumn || undefined,
                                    vendorNameColumn: vendorNameColumn || undefined,
                                    totalAmountColumn: totalAmountColumn || undefined,
                                    statusColumn: statusColumn || undefined,
                                    storeColumn: storeColumn || undefined,
                                    notesColumn: notesColumn || undefined
                                });
                            }
                        }
                        catch (error) {
                            // Skip tables that can't be read
                            continue;
                        }
                    }
                }
            }
            // Sort by confidence score (highest first)
            return poTables.sort((a, b) => b.confidence - a.confidence);
        });
    }
    /**
     * Get purchase order count by month for a specific year
     */
    getPurchaseOrderCountByMonth() {
        return __awaiter(this, arguments, void 0, function* (year = new Date().getFullYear()) {
            if (!this.isConnected || this.poTables.length === 0) {
                yield this.connect();
            }
            if (!this.isConnected || this.poTables.length === 0) {
                return [];
            }
            try {
                const counts = {};
                // Check each PO table
                for (const poTable of this.poTables) {
                    const table = this.reader.getTable(poTable.name);
                    // Skip if no date column
                    if (!poTable.dateColumn)
                        continue;
                    // Get all data from the table
                    const data = table.getData();
                    if (!data || data.length === 0) {
                        continue;
                    }
                    // Filter data for the specified year and group by month
                    data.forEach((row) => {
                        if (!row[poTable.dateColumn] || !row[poTable.poNumberColumn])
                            return;
                        // Check if date is a Date object or convert it
                        let date;
                        if (row[poTable.dateColumn] instanceof Date) {
                            date = row[poTable.dateColumn];
                        }
                        else if (typeof row[poTable.dateColumn] === 'string') {
                            date = new Date(row[poTable.dateColumn]);
                        }
                        else if (typeof row[poTable.dateColumn] === 'number') {
                            // Handle numeric timestamps
                            date = new Date(row[poTable.dateColumn]);
                        }
                        else {
                            return; // Skip if date is in an unknown format
                        }
                        if (isNaN(date.getTime()))
                            return;
                        const rowYear = date.getFullYear();
                        if (rowYear === year) {
                            const month = date.getMonth() + 1;
                            const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
                            if (!counts[monthKey]) {
                                counts[monthKey] = 0;
                            }
                            counts[monthKey]++;
                        }
                    });
                }
                // Convert to array and sort by month
                const result = Object.entries(counts).map(([month, count]) => ({
                    month,
                    count
                })).sort((a, b) => a.month.localeCompare(b.month));
                return result;
            }
            catch (error) {
                console.error('Error getting purchase order count by month:', error);
                return [];
            }
        });
    }
    /**
     * Get current month purchase order count
     */
    getCurrentMonthPurchaseOrderCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
            const counts = yield this.getPurchaseOrderCountByMonth(year);
            const currentMonth = counts.find(item => item.month === monthKey);
            return currentMonth ? currentMonth.count : 0;
        });
    }
    /**
     * Get monthly purchase order counts for all available months
     */
    getMonthlyPurchaseOrderCounts() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected || this.poTables.length === 0) {
                yield this.connect();
            }
            if (!this.isConnected || this.poTables.length === 0) {
                return {};
            }
            try {
                const counts = {};
                // Check each PO table
                for (const poTable of this.poTables) {
                    const table = this.reader.getTable(poTable.name);
                    // Skip if no date column
                    if (!poTable.dateColumn)
                        continue;
                    // Get all data from the table
                    const data = table.getData();
                    if (!data || data.length === 0) {
                        continue;
                    }
                    // Group by month
                    data.forEach((row) => {
                        if (!row[poTable.dateColumn] || !row[poTable.poNumberColumn])
                            return;
                        // Check if date is a Date object or convert it
                        let date;
                        if (row[poTable.dateColumn] instanceof Date) {
                            date = row[poTable.dateColumn];
                        }
                        else if (typeof row[poTable.dateColumn] === 'string') {
                            date = new Date(row[poTable.dateColumn]);
                        }
                        else if (typeof row[poTable.dateColumn] === 'number') {
                            // Handle numeric timestamps
                            date = new Date(row[poTable.dateColumn]);
                        }
                        else {
                            return; // Skip if date is in an unknown format
                        }
                        if (isNaN(date.getTime()))
                            return;
                        const year = date.getFullYear();
                        const month = date.getMonth() + 1;
                        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
                        if (!counts[monthKey]) {
                            counts[monthKey] = 0;
                        }
                        counts[monthKey]++;
                    });
                }
                return counts;
            }
            catch (error) {
                console.error('Error getting monthly purchase order counts:', error);
                return {};
            }
        });
    }
    /**
     * Get monthly purchase order comparison
     */
    getMonthlyPurchaseOrderComparison() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;
            // Calculate previous month
            let previousMonth = currentMonth - 1;
            let previousMonthYear = currentYear;
            if (previousMonth === 0) {
                previousMonth = 12;
                previousMonthYear = currentYear - 1;
            }
            // Calculate same month last year
            const lastYear = currentYear - 1;
            // Format month keys
            const currentMonthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
            const previousMonthKey = `${previousMonthYear}-${previousMonth.toString().padStart(2, '0')}`;
            const sameMonthLastYearKey = `${lastYear}-${currentMonth.toString().padStart(2, '0')}`;
            // Get all monthly counts
            const monthlyCounts = yield this.getMonthlyPurchaseOrderCounts();
            // Get counts for each period
            const currentMonthCount = monthlyCounts[currentMonthKey] || 0;
            const previousMonthCount = monthlyCounts[previousMonthKey] || 0;
            const sameMonthLastYearCount = monthlyCounts[sameMonthLastYearKey] || 0;
            // Calculate percentage changes
            const changeFromPreviousMonth = previousMonthCount === 0
                ? 0
                : Math.round((currentMonthCount - previousMonthCount) / previousMonthCount * 100);
            const changeFromLastYear = sameMonthLastYearCount === 0
                ? 0
                : Math.round((currentMonthCount - sameMonthLastYearCount) / sameMonthLastYearCount * 100);
            return {
                currentMonth: currentMonthCount,
                previousMonth: previousMonthCount,
                sameMonthLastYear: sameMonthLastYearCount,
                changeFromPreviousMonth,
                changeFromLastYear
            };
        });
    }
    /**
     * Get purchase order details
     */
    getPurchaseOrders() {
        return __awaiter(this, arguments, void 0, function* (limit = 100) {
            if (!this.isConnected || this.poTables.length === 0) {
                yield this.connect();
            }
            if (!this.isConnected || this.poTables.length === 0) {
                return [];
            }
            try {
                let results = [];
                // Check each PO table
                for (const poTable of this.poTables) {
                    // Skip if we already have enough results
                    if (results.length >= limit)
                        break;
                    const table = this.reader.getTable(poTable.name);
                    // Get data from the table
                    const data = table.getData();
                    if (!data || data.length === 0) {
                        continue;
                    }
                    // Map data to purchase order objects
                    const tableResults = data.map((row) => {
                        const po = {
                            PONumber: row[poTable.poNumberColumn],
                            Source: poTable.name
                        };
                        if (poTable.dateColumn && row[poTable.dateColumn]) {
                            if (row[poTable.dateColumn] instanceof Date) {
                                po.Date = row[poTable.dateColumn];
                            }
                            else if (typeof row[poTable.dateColumn] === 'string') {
                                po.Date = new Date(row[poTable.dateColumn]);
                            }
                            else if (typeof row[poTable.dateColumn] === 'number') {
                                po.Date = new Date(row[poTable.dateColumn]);
                            }
                        }
                        if (poTable.vendorNumberColumn && row[poTable.vendorNumberColumn]) {
                            po.VendorNumber = row[poTable.vendorNumberColumn];
                        }
                        if (poTable.vendorNameColumn && row[poTable.vendorNameColumn]) {
                            po.VendorName = row[poTable.vendorNameColumn];
                        }
                        if (poTable.totalAmountColumn && row[poTable.totalAmountColumn]) {
                            po.TotalAmount = parseFloat(row[poTable.totalAmountColumn]);
                        }
                        if (poTable.statusColumn && row[poTable.statusColumn]) {
                            po.Status = row[poTable.statusColumn];
                        }
                        if (poTable.storeColumn && row[poTable.storeColumn]) {
                            po.Store = row[poTable.storeColumn];
                        }
                        if (poTable.notesColumn && row[poTable.notesColumn]) {
                            po.Notes = row[poTable.notesColumn];
                        }
                        return po;
                    });
                    // Add results from this table
                    results = [...results, ...tableResults];
                }
                // Limit the results
                return results.slice(0, limit);
            }
            catch (error) {
                console.error('Error getting purchase orders:', error);
                return [];
            }
        });
    }
    /**
     * Execute a custom query against the database
     * @param query SQL query to execute
     * @returns Query result
     */
    executeQuery(query) {
        console.log('PORDirectReader executing query:', query);
        try {
            // Check if we have a valid reader
            if (!this.reader) {
                console.error('No reader available');
                return [{ error: 'Database connection not initialized' }];
            }
            // Validate query type - only allow SELECT, SHOW TABLES, and DESCRIBE
            const isSelect = query.toUpperCase().trim().startsWith('SELECT');
            const isShowTables = query.toUpperCase().includes('SHOW TABLES');
            const isDescribe = query.toUpperCase().includes('DESCRIBE ');
            const isMSysObjectsQuery = query.toUpperCase().includes('MSYSOBJECTS');
            // If not a supported query type, return an error
            if (!isSelect && !isShowTables && !isDescribe && !isMSysObjectsQuery) {
                return [{
                        error: 'Only SELECT, SHOW TABLES, and DESCRIBE queries are supported',
                        query: query
                    }];
            }
            // Handle SHOW TABLES query
            if (isShowTables) {
                console.log('Processing SHOW TABLES query');
                try {
                    const tableNames = this.reader.getTableNames();
                    return tableNames.map((name) => ({ TableName: name, value: name }));
                }
                catch (error) {
                    console.error('Error getting table names:', error);
                    return [{ error: `Error getting table names: ${error.message}` }];
                }
            }
            // Handle DESCRIBE query
            if (isDescribe) {
                console.log('Processing DESCRIBE query');
                const tableName = query.replace(/DESCRIBE\s+/i, '').trim();
                try {
                    // Check if table exists first
                    const tableNames = this.reader.getTableNames();
                    const tableExists = tableNames.some((name) => name.toLowerCase() === tableName.toLowerCase());
                    if (!tableExists) {
                        return [{ error: `Table '${tableName}' not found in the database` }];
                    }
                    // Find the actual table name with correct case
                    const actualTableName = tableNames.find((name) => name.toLowerCase() === tableName.toLowerCase());
                    try {
                        // Get table schema - mdb-reader doesn't have a direct getSchema method
                        // Instead, we'll get the table and examine the first row to determine columns
                        const table = this.reader.getTable(actualTableName || tableName);
                        if (!table || table.length === 0) {
                            return [{ error: `Table '${tableName}' exists but has no data to determine schema` }];
                        }
                        // Get column names from the first row
                        const firstRow = table[0];
                        const columns = Object.keys(firstRow).map(name => {
                            const value = firstRow[name];
                            const type = typeof value;
                            return {
                                Field: name,
                                Type: Array.isArray(value) ? 'array' : type,
                                Null: 'YES' // We can't determine NOT NULL constraint from the data
                            };
                        });
                        return columns;
                    }
                    catch (error) {
                        console.error(`Error getting table data for ${tableName}:`, error);
                        return [{ error: `Error describing table: ${error.message}` }];
                    }
                }
                catch (error) {
                    console.error(`Error describing table ${tableName}:`, error);
                    return [{ error: `Error describing table: ${error.message}` }];
                }
            }
            // Handle MSysObjects queries (for checking table existence)
            if (isMSysObjectsQuery) {
                console.log('Processing MSysObjects query');
                try {
                    // We need to simulate MSysObjects table behavior since it's a system table
                    // that might not be directly accessible in the MDB file
                    // Get all table names from the database
                    const tableNames = this.reader.getTableNames();
                    // Check for table existence queries
                    const tableNameMatch = query.match(/Name\s*=\s*['"]([^'"]+)['"]/i);
                    if (tableNameMatch) {
                        const tableName = tableNameMatch[1];
                        console.log(`Checking if table exists: ${tableName}`);
                        // Case-insensitive search for the table
                        const tableExists = tableNames.some((name) => name.toLowerCase() === tableName.toLowerCase());
                        // Find the actual table name with correct case
                        const actualTableName = tableExists
                            ? tableNames.find((name) => name.toLowerCase() === tableName.toLowerCase())
                            : tableName;
                        if (query.toUpperCase().includes('COUNT')) {
                            // Return count (0 or 1)
                            return [{ table_count: tableExists ? 1 : 0 }];
                        }
                        else {
                            // Return table info if it exists
                            return tableExists
                                ? [{ Name: actualTableName, Type: 1, Flags: 0 }]
                                : [];
                        }
                    }
                    // Handle LIKE queries for finding tables
                    const likeMatch = query.match(/Name\s+LIKE\s+['"]([^'"]+)['"]/i);
                    if (likeMatch) {
                        const pattern = likeMatch[1];
                        console.log(`Searching for tables matching pattern: ${pattern}`);
                        // Convert SQL LIKE pattern to JavaScript regex
                        const regexPattern = pattern
                            .replace(/%/g, '.*')
                            .replace(/_/g, '.');
                        const regex = new RegExp(regexPattern, 'i');
                        // Find matching tables
                        const matchingTables = tableNames.filter((name) => regex.test(name));
                        return matchingTables.map((name) => ({
                            Name: name,
                            Type: 1,
                            Flags: 0
                        }));
                    }
                    // Default MSysObjects query - return all user tables
                    if (query.toUpperCase().includes('TYPE=1') && query.toUpperCase().includes('FLAGS=0')) {
                        console.log('Returning all tables as MSysObjects simulation');
                        return tableNames.map((name) => ({
                            Name: name,
                            Type: 1,
                            Flags: 0
                        }));
                    }
                    // Just return empty array for other MSysObjects queries
                    return [];
                }
                catch (error) {
                    console.error('Error processing MSysObjects query:', error);
                    return [{ error: `Error processing MSysObjects query: ${error.message}` }];
                }
            }
            // Handle SELECT queries
            if (isSelect) {
                console.log('Processing SELECT query');
                try {
                    // Extract table name from query
                    const tableNameMatch = query.match(/FROM\s+([^\s,;()]+)/i);
                    if (!tableNameMatch || !tableNameMatch[1]) {
                        return [{ error: 'Could not extract table name from query' }];
                    }
                    const tableName = tableNameMatch[1].trim();
                    console.log(`Extracted table name: ${tableName}`);
                    // Check if table exists
                    const tableNames = this.reader.getTableNames();
                    const tableExists = tableNames.some((name) => name.toLowerCase() === tableName.toLowerCase());
                    if (!tableExists) {
                        return [{ error: `Table '${tableName}' not found in the database` }];
                    }
                    // Find the actual table name with correct case
                    const actualTableName = tableNames.find((name) => name.toLowerCase() === tableName.toLowerCase());
                    console.log(`Using actual table name: ${actualTableName}`);
                    // Execute the query
                    try {
                        const data = this.reader.getTable(actualTableName || tableName);
                        if (!data) {
                            return [{ error: `No data returned from table '${tableName}'` }];
                        }
                        return data;
                    }
                    catch (error) {
                        console.error(`Error executing query on table ${tableName}:`, error);
                        return [{ error: `Error executing query: ${error.message}` }];
                    }
                }
                catch (error) {
                    console.error('Error processing SELECT query:', error);
                    return [{ error: `Error processing SELECT query: ${error.message}` }];
                }
            }
            // If we get here, something went wrong
            return [{ error: 'Unsupported query type' }];
        }
        catch (error) {
            console.error('Error executing query:', error);
            return [{ error: `Error executing query: ${error.message}` }];
        }
    }
    /**
     * Helper function to find a column by keywords
     */
    findColumnByKeywords(columns, keywords) {
        for (const column of columns) {
            const lowerColumn = column.toLowerCase();
            for (const keyword of keywords) {
                if (lowerColumn.includes(keyword.toLowerCase())) {
                    return column;
                }
            }
        }
        return undefined;
    }
    /**
     * Close the connection
     */
    close() {
        this.isConnected = false;
        this.reader = null;
    }
    /**
     * Disconnect from the database
     * This is an alias for close() to maintain compatibility with the ConnectionManager
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.close();
        });
    }
}
