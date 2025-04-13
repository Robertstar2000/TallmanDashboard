var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getDb } from '@/lib/db/sqlite';
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Testing database structure...');
            const db = yield getDb();
            // Get all tables
            const tables = yield db.all("SELECT name FROM sqlite_master WHERE type='table'");
            // Check chart_data table structure
            let chartDataColumns = [];
            let sampleRow = null;
            let missingProdSqlCount = 0;
            if (tables.some((t) => t.name === 'chart_data')) {
                chartDataColumns = yield db.all("PRAGMA table_info(chart_data)");
                // Get a sample row
                sampleRow = yield db.get("SELECT * FROM chart_data LIMIT 1");
                // Check for rows missing sql_expression
                const missingResult = yield db.get("SELECT COUNT(*) as count FROM chart_data WHERE sql_expression IS NULL OR sql_expression = ''");
                missingProdSqlCount = missingResult.count;
            }
            // Check test_data_mapping table
            let testDataExists = tables.some((t) => t.name === 'test_data_mapping');
            let testDataCount = 0;
            let testDataSample = [];
            if (testDataExists) {
                const countResult = yield db.get("SELECT COUNT(*) as count FROM test_data_mapping");
                testDataCount = countResult.count;
                if (testDataCount > 0) {
                    testDataSample = yield db.all("SELECT * FROM test_data_mapping LIMIT 5");
                }
            }
            // Return the results
            res.status(200).json({
                success: true,
                tables: tables.map((t) => t.name),
                chartDataColumns: chartDataColumns.map((c) => ({
                    name: c.name,
                    type: c.type
                })),
                hasProdSqlExpr: chartDataColumns.some((c) => c.name === 'sql_expression'),
                sampleRow,
                missingProdSqlCount,
                testDataExists,
                testDataCount,
                testDataSample
            });
        }
        catch (error) {
            console.error('Error testing database structure:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
}
