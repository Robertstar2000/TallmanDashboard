/**
 * Reload Chart Data Script
 * This script forces a reload of the chart data from the initial-data.ts file into the SQLite database
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
import { loadChartDataFromInitFile } from '../lib/db/sqlite';
function reloadChartData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Reloading chart data from initial-data.ts...');
            // Call the function to reload the data
            yield loadChartDataFromInitFile();
            console.log('Chart data reloaded successfully!');
            process.exit(0);
        }
        catch (error) {
            console.error('Error reloading chart data:', error);
            process.exit(1);
        }
    });
}
// Run the function
reloadChartData();
