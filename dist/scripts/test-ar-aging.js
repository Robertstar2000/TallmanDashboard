var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Test script for AR Aging queries
import { initTestDb, executeTestQuery } from './lib/db/test-db';
function testARAgingQueries() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Initializing test database...');
        yield initTestDb();
        // Define the AR Aging queries to test
        const queries = [
            {
                name: 'Current',
                query: "SELECT SUM(amount_open) as value FROM pub_ar_open_items WHERE days_past_due = 0"
            },
            {
                name: '1-30 Days',
                query: "SELECT SUM(amount_open) as value FROM pub_ar_open_items WHERE days_past_due > 0 AND days_past_due <= 30"
            },
            {
                name: '31-60 Days',
                query: "SELECT SUM(amount_open) as value FROM pub_ar_open_items WHERE days_past_due > 30 AND days_past_due <= 60"
            },
            {
                name: '61-90 Days',
                query: "SELECT SUM(amount_open) as value FROM pub_ar_open_items WHERE days_past_due > 60 AND days_past_due <= 90"
            },
            {
                name: '90+ Days',
                query: "SELECT SUM(amount_open) as value FROM pub_ar_open_items WHERE days_past_due > 90"
            }
        ];
        // Execute each query and log the results
        console.log('Testing AR Aging queries...');
        for (const query of queries) {
            try {
                const result = yield executeTestQuery(query.query, 'P21');
                console.log(`${query.name}: ${result}`);
                if (result === 0) {
                    console.log(`WARNING: ${query.name} query returned 0`);
                }
            }
            catch (error) {
                console.error(`Error executing ${query.name} query:`, error);
            }
        }
        // Also test a query to get all records to see what data we have
        try {
            console.log('\nChecking available data in pub_ar_open_items:');
            const checkQuery = "SELECT invoice_id, amount_open, days_past_due FROM pub_ar_open_items ORDER BY days_past_due";
            const result = yield executeTestQuery(checkQuery, 'P21');
            console.log('Data check result:', result);
        }
        catch (error) {
            console.error('Error checking data:', error);
        }
    });
}
// Run the tests
testARAgingQueries()
    .then(() => {
    console.log('Tests completed');
    process.exit(0);
})
    .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
