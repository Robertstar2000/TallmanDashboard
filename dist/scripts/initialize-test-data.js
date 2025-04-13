var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getDb } from './sqlite';
/**
 * Initialize test data in the database to align with test SQL expressions
 */
export function initializeTestData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Initializing test data in the database...');
            const db = yield getDb();
            // Create a temporary table to hold test data
            yield db.exec(`
      CREATE TABLE IF NOT EXISTS test_data_mapping (
        id TEXT PRIMARY KEY,
        test_value TEXT NOT NULL
      )
    `);
            // Get all rows from the chart_data table
            const rows = yield db.all(`
      SELECT 
        id,
        chart_name as "chartName",
        variable_name as "variableName",
        server_name as "serverName"
      FROM chart_data
    `);
            console.log(`Found ${rows.length} rows in chart_data table for test data initialization`);
            // Clear existing test data
            yield db.exec('DELETE FROM test_data_mapping');
            // Insert test values for each row
            const insertStmt = yield db.prepare(`
      INSERT INTO test_data_mapping (id, test_value) VALUES (?, ?)
    `);
            // Process each row in the chart_data table
            let insertCount = 0;
            for (const row of rows) {
                // Generate a test value based on the row
                const testValue = generateTestValue(row);
                // Insert the test value mapping
                yield insertStmt.run(row.id, testValue.toString());
                insertCount++;
                if (insertCount % 10 === 0) {
                    console.log(`Initialized test data for ${insertCount}/${rows.length} rows`);
                }
            }
            yield insertStmt.finalize();
            console.log(`Test data initialization complete. Created ${insertCount} test data mappings.`);
        }
        catch (error) {
            console.error('Error initializing test data:', error);
            throw new Error(`Failed to initialize test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
}
/**
 * Generate a test value for a spreadsheet row
 */
function generateTestValue(row) {
    var _a, _b, _c;
    // Default base values for different metric types
    const baseValues = {
        'Total Orders': 1250,
        'Open Orders': 320,
        'Active Customers': 450,
        'Inventory Value': 2500000,
        'Average Order Value': 750,
        'Web Orders': 180,
        // Add more mappings as needed
    };
    // Time-based metrics (for charts with monthly data)
    if (row.timeframe && row.timeframe.includes('month')) {
        const monthNum = parseInt(row.timeframe.replace('month', ''), 10) || 1;
        const rowName = row.name || row.variableName || row.chartName;
        const baseValue = rowName ? (baseValues[rowName] || 1000) : 1000;
        // Generate a somewhat realistic value with some month-to-month variation
        // More recent months generally have higher values (growth trend)
        const monthFactor = 1 + (12 - monthNum) * 0.05; // 5% growth per month
        const randomFactor = 0.8 + Math.random() * 0.4; // Random variation ±20%
        return Math.round(baseValue * monthFactor * randomFactor);
    }
    // AR Aging buckets
    if (row.chartGroup === 'AR Aging') {
        // Different values for different aging buckets
        if (row.variableName === 'Current')
            return 15700;
        if (row.variableName === '1-30 Days')
            return 14100;
        if (row.variableName === '31-60 Days')
            return 13500;
        if (row.variableName === '61-90 Days')
            return 10700;
        if (row.variableName === '90+ Days')
            return 10500;
    }
    // Site distribution
    if (row.name && row.name.includes('Site')) {
        if ((_a = row.variableName) === null || _a === void 0 ? void 0 : _a.includes('Columbus'))
            return 450000;
        if ((_b = row.variableName) === null || _b === void 0 ? void 0 : _b.includes('Addison'))
            return 320000;
        if ((_c = row.variableName) === null || _c === void 0 ? void 0 : _c.includes('Lake City'))
            return 230000;
    }
    // Use the base value if available, otherwise generate a random value
    const rowName = row.name || row.variableName || row.chartName;
    return rowName ? (baseValues[rowName] || Math.round(500 + Math.random() * 1000)) : Math.round(500 + Math.random() * 1000);
}
/**
 * Get the test value for a specific row ID
 */
export function getTestValue(rowId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield getDb();
            const result = yield db.get('SELECT test_value FROM test_data_mapping WHERE id = ?', [rowId]);
            if (result && result.test_value) {
                return parseFloat(result.test_value);
            }
            // Default value if not found
            return 0;
        }
        catch (error) {
            console.error(`Error getting test value for row ${rowId}:`, error);
            return 0;
        }
    });
}
