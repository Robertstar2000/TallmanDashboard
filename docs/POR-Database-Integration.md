# Point of Rental (POR) Database Integration

This document outlines how the Tallman Dashboard integrates with the Point of Rental database using MS Access.

## Connection Process

The dashboard connects to the Point of Rental (POR) database through the following process:

1. **Connection Configuration**:
   - The POR database is accessed via MS Access
   - The connection requires a valid file path to the `.mdb` file
   - No username/password is required, as access is controlled via file system permissions

2. **Query Execution Flow**:
   - Dashboard sends SQL queries to the `/api/executeQuery` endpoint
   - The API routes POR queries to the MS Access handler
   - A PowerShell script using ADODB executes the query against the MS Access database
   - Results are returned to the dashboard for display

3. **Error Handling**:
   - If a table doesn't exist, the system will return available tables
   - Connection errors are properly reported to the UI
   - Query syntax errors are validated before execution

## Database Structure

The Point of Rental database uses the following key tables:

- `Contracts` - Contains rental contract information
- `Invoices` - Contains invoice data
- `WorkOrders` - Contains work order information
- `Customers` - Contains customer data
- `Items` - Contains inventory item information
- `Inventory` - Contains inventory status and availability
- `Rentals` - Contains rental transaction data
- `Transactions` - Contains financial transaction records
- `Payments` - Contains payment records
- `Employees` - Contains employee information
- `Vendors` - Contains vendor information
- `PurchaseOrders` - Contains purchase order header information
- `PurchaseOrderDetails` - Contains line items for purchase orders

## Utility Functions

The codebase includes several utility functions for working with the POR database:

- `PORUtils.listTables()` - Lists all tables in the POR database
- `PORUtils.getTableStructure()` - Gets the structure of a specific table
- `PORUtils.findPurchaseOrderTables()` - Finds tables related to purchase orders
- `PORUtils.safeQuery()` - Executes a query with error handling

## Testing

To test the POR database connection:

1. Run the `test-por-tables.js` script to explore the database structure
2. Use the admin test query interface to execute test queries
3. Check the server logs for detailed connection and query information

## Troubleshooting

If you encounter issues with the POR database connection:

1. Verify the file path to the MS Access database is correct
2. Ensure the MS Access database file is accessible to the application
3. Check that the Microsoft.ACE.OLEDB.12.0 provider is installed
4. Review the server logs for specific error messages
5. Try using the table discovery feature to find the correct table names
