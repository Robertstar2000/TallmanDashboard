/**
 * Debug API Route
 *
 * This script tests the getChartData function directly to see why the API is failing
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
import { getChartData } from '../lib/db/sqlite';
function debugApi() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Testing getChartData function directly...');
            // Get chart data from database
            const chartData = yield getChartData();
            console.log(`Retrieved ${chartData ? chartData.length : 0} rows of chart data`);
            if (!chartData || chartData.length === 0) {
                console.log('No data returned from getChartData');
            }
            else {
                console.log('First row:', chartData[0]);
                // Check for any issues with the data
                const missingFields = chartData.filter(row => !row.chartGroup || !row.variableName);
                if (missingFields.length > 0) {
                    console.log(`Found ${missingFields.length} rows with missing required fields`);
                    console.log('Example of problematic row:', missingFields[0]);
                }
                // Check chart groups
                const chartGroups = [...new Set(chartData.map(row => row.chartGroup))];
                console.log('Chart groups present:', chartGroups);
            }
        }
        catch (error) {
            console.error('Error debugging API:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the script
debugApi().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
