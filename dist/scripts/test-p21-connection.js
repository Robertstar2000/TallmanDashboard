var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ConnectionManager } from '../lib/db/connection-manager';
import { executeP21Query } from '../lib/services/p21';
/**
 * Test script to verify P21 database connection and query execution
 */
function testP21Connection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Testing P21 connection and query execution...');
            // Test queries that should return non-zero results
            const testQueries = [
                "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)",
                "SELECT ISNULL(SUM(order_amt), 0) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)",
                "SELECT TOP 1 order_no FROM P21.dbo.oe_hdr WITH (NOLOCK)",
                "SELECT TOP 1 * FROM P21.dbo.oe_hdr WITH (NOLOCK)"
            ];
            // Test direct connection manager execution
            console.log('\n--- Testing ConnectionManager.executeQuery ---');
            for (const query of testQueries) {
                console.log(`\nExecuting query: ${query}`);
                try {
                    const result = yield ConnectionManager.executeQuery({ type: 'P21' }, query);
                    console.log('Query result:', JSON.stringify(result, null, 2));
                }
                catch (error) {
                    console.error('Error executing query:', error);
                }
            }
            // Test executeP21Query function
            console.log('\n--- Testing executeP21Query function ---');
            for (const query of testQueries) {
                console.log(`\nExecuting query: ${query}`);
                try {
                    const result = yield executeP21Query(query, 'P21');
                    console.log('Query result:', result);
                }
                catch (error) {
                    console.error('Error executing query:', error);
                }
            }
            console.log('\nP21 connection test completed.');
        }
        catch (error) {
            console.error('Error in test script:', error);
        }
    });
}
// Run the test
testP21Connection();
