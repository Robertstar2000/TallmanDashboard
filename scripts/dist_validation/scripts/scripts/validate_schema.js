import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline/promises';
import { fileURLToPath } from 'url';
import { executeP21QueryServer, executePORQueryServer } from '../lib/db/server.js';
import dotenv from 'dotenv';
// --- ES Module __dirname equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ----------------------------------
// Load environment variables for P21 connection
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
// --- Schema Definitions ---
// Parse P21 Schema from the provided structure
const p21SchemaInput = {
    "Table_Name": [
        "ap_invoice", "ar_invoice", "customer", "sales_order", "inventory",
        "warehouse", "order_line", "vendor", "purchase_order", "employee"
    ],
    "Column_Names": [
        "invoice_id, invoice_total, invoice_date, vendor_id, due_date",
        "invoice_id, customer_id, invoice_total, invoice_date, due_date",
        "customer_id, customer_name, account_number, created_date, customer_status",
        "order_id, customer_id, order_date, order_total, order_status",
        "item_id, item_description, quantity_on_hand, unit_cost, department_id",
        "warehouse_id, warehouse_name, location, inventory_value",
        "order_line_id, order_id, item_id, quantity_ordered, price_per_unit",
        "vendor_id, vendor_name, vendor_status, created_date",
        "po_id, vendor_id, po_date, po_total, po_status",
        "employee_id, employee_name, department, hire_date, status"
    ]
};
const p21Schema = {};
p21SchemaInput.Table_Name.forEach((tableName, index) => {
    const columns = p21SchemaInput.Column_Names[index].split(',').map(c => c.trim()).filter(c => c);
    // NOTE: P21 requires schema prefix, assuming 'dbo.' based on memory
    p21Schema[`dbo.${tableName}`] = columns;
});
// POR Schema from memory
const porSchema = {
    "Items": ["ItemID", "ItemName", "ItemType", "Category", "QuantityOnHand"],
    "ItemLocations": ["LocationID", "ItemID", "QuantityOnHand", "QuantityOnRent"],
    "RentalContracts": ["ContractID", "CustomerID", "ContractDate", "StartDate"],
    "ContractLines": ["ContractID", "LineNumber", "ItemID", "Quantity", "DueDate"],
    "Payments": ["PaymentID", "ContractID", "PaymentDate", "Amount"]
};
// --- Test Execution Logic ---
async function testP21(elementType, name, tableName) {
    let query = '';
    const baseResult = { name, db: 'P21', type: elementType };
    if (elementType === 'Table') {
        // P21 requires schema prefix and hints (from memory)
        query = `SELECT TOP 1 1 FROM ${name} WITH (NOLOCK)`;
    }
    else if (elementType === 'Column' && tableName) {
        query = `SELECT TOP 1 ${name} FROM ${tableName} WITH (NOLOCK)`;
    }
    else {
        return { ...baseResult, status: 'Failure', error: 'Invalid test parameters for P21' };
    }
    console.log(`Testing P21 ${elementType}: ${name}` + (tableName ? ` in ${tableName}` : ''));
    try {
        const result = await executeP21QueryServer(query);
        if (result.success) {
            return { ...baseResult, status: 'Success' };
        }
        else {
            return { ...baseResult, status: 'Failure', error: result.error ?? 'Unknown P21 execution error' };
        }
    }
    catch (e) {
        console.error(`Error testing P21 ${elementType} ${name}:`, e);
        return { ...baseResult, status: 'Failure', error: e.message || 'Exception during P21 test' };
    }
}
async function testPOR(elementType, name, porFilePath, porPassword, tableName) {
    let query = '';
    const baseResult = { name, db: 'POR', type: elementType };
    if (!porFilePath) {
        return { ...baseResult, status: 'Failure', error: 'POR File Path not provided' };
    }
    if (elementType === 'Table') {
        // POR uses brackets for table names if needed, no schema prefix or hints
        query = `SELECT TOP 1 1 FROM [${name}]`;
    }
    else if (elementType === 'Column' && tableName) {
        query = `SELECT TOP 1 [${name}] FROM [${tableName}]`;
    }
    else {
        return { ...baseResult, status: 'Failure', error: 'Invalid test parameters for POR' };
    }
    console.log(`Testing POR ${elementType}: ${name}` + (tableName ? ` in ${tableName}` : ''));
    try {
        const result = await executePORQueryServer(porFilePath, porPassword, query);
        if (result.success) {
            return { ...baseResult, status: 'Success' };
        }
        else {
            return { ...baseResult, status: 'Failure', error: result.error ?? 'Unknown POR execution error' };
        }
    }
    catch (e) {
        console.error(`Error testing POR ${elementType} ${name}:`, e);
        return { ...baseResult, status: 'Failure', error: e.message || 'Exception during POR test' };
    }
}
// --- Main Script Execution ---
async function main() {
    const results = [];
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Get POR details
    const porFilePath = await rl.question('Enter the full path to the POR database file (e.g., C:\Data\db.mdb): ');
    if (!porFilePath) {
        console.error('POR file path is required. Exiting.');
        rl.close();
        process.exit(1);
    }
    const porPassword = await rl.question('Enter the POR database password (leave blank if none): ');
    rl.close();
    console.log('\n--- Starting P21 Schema Validation ---');
    for (const tableName of Object.keys(p21Schema)) {
        results.push(await testP21('Table', tableName));
        for (const columnName of p21Schema[tableName]) {
            results.push(await testP21('Column', columnName, tableName));
        }
    }
    console.log('\n--- Starting POR Schema Validation ---');
    for (const tableName of Object.keys(porSchema)) {
        results.push(await testPOR('Table', tableName, porFilePath, porPassword || undefined));
        for (const columnName of porSchema[tableName]) {
            results.push(await testPOR('Column', columnName, porFilePath, porPassword || undefined, tableName));
        }
    }
    // Write results to file
    const outputFilePath = path.resolve(__dirname, '../schema.new');
    let outputContent = 'Schema Validation Results\n';
    outputContent += '============================\n\n';
    outputContent += '--- P21 Results ---\n';
    results.filter(r => r.db === 'P21').forEach(r => {
        outputContent += `${r.type.padEnd(6)} | ${r.name.padEnd(40)} | ${r.status.padEnd(7)} ${r.error ? '| Error: ' + r.error : ''}\n`;
    });
    outputContent += '\n--- POR Results ---\n';
    results.filter(r => r.db === 'POR').forEach(r => {
        outputContent += `${r.type.padEnd(6)} | ${r.name.padEnd(40)} | ${r.status.padEnd(7)} ${r.error ? '| Error: ' + r.error : ''}\n`;
    });
    try {
        fs.writeFileSync(outputFilePath, outputContent);
        console.log(`\nValidation complete. Results written to: ${outputFilePath}`);
    }
    catch (err) {
        console.error(`\nError writing results file '${outputFilePath}':`, err);
    }
}
main().catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
});
