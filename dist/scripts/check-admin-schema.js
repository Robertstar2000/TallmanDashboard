/**
 * Check Admin Schema
 *
 * This script checks the schema of the admin_variables table
 * to understand the column structure for proper updates.
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
import { executeWrite } from '../lib/db/sqlite';
function checkAdminSchema() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Checking admin_variables table schema...');
            const schema = yield executeWrite('PRAGMA table_info(admin_variables)');
            console.log('Admin Variables Table Schema:');
            console.log(JSON.stringify(schema, null, 2));
            // Also check for existing POR Overview rows
            const rows = yield executeWrite('SELECT * FROM admin_variables WHERE chart_group = "POR Overview" LIMIT 1');
            if (Array.isArray(rows) && rows.length > 0) {
                console.log('\nSample POR Overview Row:');
                console.log(JSON.stringify(rows[0], null, 2));
            }
            else {
                console.log('\nNo POR Overview rows found.');
            }
        }
        catch (error) {
            console.error('Error checking admin schema:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the check
checkAdminSchema().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
