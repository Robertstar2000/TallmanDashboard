/**
 * Check Admin Table Schema
 *
 * This script checks the schema of the admin_variables table
 * to ensure we have the correct column names.
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
function checkAdminTableSchema() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Checking admin_variables table schema...');
            // Get the schema of the admin_variables table
            const schemaSql = "PRAGMA table_info(admin_variables)";
            const result = yield executeWrite(schemaSql);
            const schema = Array.isArray(result) ? result : [];
            if (schema.length > 0) {
                console.log('admin_variables table schema:');
                schema.forEach(column => {
                    console.log(`- ${column.name} (${column.type})`);
                });
            }
            else {
                console.log('admin_variables table not found or has no columns');
            }
        }
        catch (error) {
            console.error('Error checking admin_variables table schema:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the check
checkAdminTableSchema().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
