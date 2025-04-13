var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import MDBReader from 'mdb-reader';
// Set the correct POR database path
const POR_DB_PATH = 'C:\\Users\\BobM\\Desktop\\POR.MDB';
/**
 * Main function to list tables in the POR database
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Listing tables in POR database...');
        // Get the POR database path
        const porFilePath = process.env.POR_FILE_PATH || POR_DB_PATH;
        console.log(`Using POR database path: ${porFilePath}`);
        // Check if the file exists
        if (!fs.existsSync(porFilePath)) {
            console.error(`POR database file not found at path: ${porFilePath}`);
            process.exit(1);
        }
        try {
            // Read the database file
            const buffer = fs.readFileSync(porFilePath);
            const reader = new MDBReader(buffer);
            // Get table names
            const tableNames = reader.getTableNames();
            console.log('Available tables:', tableNames);
            // Look for tables that might be related to rentals, contracts, etc.
            const rentalRelatedTables = tableNames.filter(table => table.toLowerCase().includes('rent') ||
                table.toLowerCase().includes('contract') ||
                table.toLowerCase().includes('order') ||
                table.toLowerCase().includes('invoice') ||
                table.toLowerCase().includes('customer') ||
                table.toLowerCase().includes('transaction'));
            console.log('\nPotential rental-related tables:', rentalRelatedTables);
            // Get column information for a few key tables
            if (rentalRelatedTables.length > 0) {
                for (const tableName of rentalRelatedTables.slice(0, 5)) { // Limit to first 5 tables to avoid overwhelming output
                    try {
                        const table = reader.getTable(tableName);
                        const columns = table.getColumnNames();
                        console.log(`\nColumns in ${tableName}:`, columns);
                        // Look for date columns and status columns
                        const dateColumns = columns.filter(col => col.toLowerCase().includes('date') ||
                            col.toLowerCase().includes('time'));
                        const statusColumns = columns.filter(col => col.toLowerCase().includes('status') ||
                            col.toLowerCase().includes('state') ||
                            col.toLowerCase().includes('type'));
                        const valueColumns = columns.filter(col => col.toLowerCase().includes('value') ||
                            col.toLowerCase().includes('amount') ||
                            col.toLowerCase().includes('price') ||
                            col.toLowerCase().includes('cost'));
                        if (dateColumns.length > 0) {
                            console.log(`Date columns in ${tableName}:`, dateColumns);
                        }
                        if (statusColumns.length > 0) {
                            console.log(`Status columns in ${tableName}:`, statusColumns);
                        }
                        if (valueColumns.length > 0) {
                            console.log(`Value columns in ${tableName}:`, valueColumns);
                        }
                        // Get a sample row to understand the data
                        const rows = table.getData();
                        if (rows.length > 0) {
                            console.log(`Sample row from ${tableName}:`, rows[0]);
                            console.log(`Total rows in ${tableName}: ${rows.length}`);
                        }
                    }
                    catch (error) {
                        console.error(`Error reading table ${tableName}:`, error);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error reading POR database:', error);
            process.exit(1);
        }
    });
}
// Run the main function
main().catch(console.error);
