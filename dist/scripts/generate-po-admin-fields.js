"use strict";
/**
 * Generate Purchase Order SQL Fields for Admin Spreadsheet
 *
 * This script generates SQL queries for the admin spreadsheet to retrieve
 * historical purchase order data from the PurchaseOrder table in the POR database.
 */
// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// Generate SQL for monthly purchase order counts
function generateMonthlyPOCountSQL() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const queries = [];
    // Generate queries for the last 12 months
    for (let i = 0; i < 12; i++) {
        // Calculate the target month
        let targetMonth = currentMonth - i;
        let targetYear = currentYear;
        // Adjust for previous year if needed
        if (targetMonth <= 0) {
            targetMonth += 12;
            targetYear -= 1;
        }
        // Calculate start and end dates for the month
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0); // Last day of the month
        const monthName = startDate.toLocaleString('default', { month: 'long' });
        const shortYear = targetYear.toString().slice(-2);
        const sql = `SELECT COUNT(*) AS Count 
                FROM PurchaseOrder 
                WHERE Date >= '${formatDate(startDate)}' 
                AND Date <= '${formatDate(endDate)}'`;
        queries.push({
            name: `PO Count ${monthName} '${shortYear}`,
            sql
        });
    }
    return queries;
}
// Generate SQL for monthly purchase order totals
function generateMonthlyPOTotalSQL() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const queries = [];
    // Generate queries for the last 12 months
    for (let i = 0; i < 12; i++) {
        // Calculate the target month
        let targetMonth = currentMonth - i;
        let targetYear = currentYear;
        // Adjust for previous year if needed
        if (targetMonth <= 0) {
            targetMonth += 12;
            targetYear -= 1;
        }
        // Calculate start and end dates for the month
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0); // Last day of the month
        const monthName = startDate.toLocaleString('default', { month: 'long' });
        const shortYear = targetYear.toString().slice(-2);
        // Note: Using ShippingCost as the amount field based on our PORTables.md analysis
        const sql = `SELECT SUM(ShippingCost) AS Total 
                FROM PurchaseOrder 
                WHERE Date >= '${formatDate(startDate)}' 
                AND Date <= '${formatDate(endDate)}'`;
        queries.push({
            name: `PO Total ${monthName} '${shortYear}`,
            sql
        });
    }
    return queries;
}
// Generate SQL for vendor purchase order counts
function generateVendorPOCountSQL() {
    return [
        {
            name: "Top 5 Vendors by PO Count (YTD)",
            sql: `SELECT TOP 5 VendorNumber, COUNT(*) AS Count 
           FROM PurchaseOrder 
           WHERE Date >= '${formatDate(new Date(new Date().getFullYear(), 0, 1))}' 
           GROUP BY VendorNumber 
           ORDER BY Count DESC`
        }
    ];
}
// Generate SQL for status distribution
function generateStatusDistributionSQL() {
    return [
        {
            name: "PO Status Distribution",
            sql: `SELECT Status, COUNT(*) AS Count 
           FROM PurchaseOrder 
           WHERE Date >= '${formatDate(new Date(new Date().getFullYear(), 0, 1))}' 
           GROUP BY Status`
        }
    ];
}
// Generate SQL for store distribution
function generateStoreDistributionSQL() {
    return [
        {
            name: "PO Store Distribution",
            sql: `SELECT Store, COUNT(*) AS Count 
           FROM PurchaseOrder 
           WHERE Date >= '${formatDate(new Date(new Date().getFullYear(), 0, 1))}' 
           GROUP BY Store`
        }
    ];
}
// Generate all SQL queries
function generateAllQueries() {
    const monthlyCountQueries = generateMonthlyPOCountSQL();
    const monthlyTotalQueries = generateMonthlyPOTotalSQL();
    const vendorQueries = generateVendorPOCountSQL();
    const statusQueries = generateStatusDistributionSQL();
    const storeQueries = generateStoreDistributionSQL();
    const allQueries = [
        ...monthlyCountQueries,
        ...monthlyTotalQueries,
        ...vendorQueries,
        ...statusQueries,
        ...storeQueries
    ];
    console.log("# Purchase Order SQL Queries for Admin Spreadsheet\n");
    console.log("Copy and paste these SQL queries into the admin spreadsheet to retrieve purchase order data from the POR database.\n");
    console.log("## Configuration\n");
    console.log("For each query, set the following fields in the admin spreadsheet:\n");
    console.log("- **Server**: POR");
    console.log("- **Table**: PurchaseOrder\n");
    console.log("## SQL Queries\n");
    allQueries.forEach((query, index) => {
        console.log(`### ${index + 1}. ${query.name}\n`);
        console.log("```sql");
        console.log(query.sql);
        console.log("```\n");
    });
}
// Run the generator
generateAllQueries();
