# Dashboard Data Flow Architecture

## Data Sources
1. **Primary Storage**: SQL Server
2. **External Sources**:
   - P21 Database: Provides data when server field is "P21"
   - POR Database: Provides data when server field is "POR"
   - Test Database: Used in development mode

## Admin Spreadsheet Structure
- One row per data point for each graph/metric
- Example: A chart with 12 months × 2 variables = 24 rows
- Each row contains:
  - Static fields: Chart name, variable name, server name, etc.
  - Dynamic value field: Updated by SQL execution
  - SQL Expression: Query to execute against chosen server
  - Table name: Reference to P21 or POR schema tables

## Data Flow Process
1. **Initial Load**:
   - Admin spreadsheet initializes with zero values
   - Data flows: admin.ts → AdminSpreadsheet.tsx → Dashboard

2. **SQL Execution Cycle**:
   - System sequences through each row when "Run" is selected
   - For each row:
     1. Identify server (P21/POR)
     2. Execute SQL expression
     3. Update row's value field
     4. Reflect changes in dashboard
   - Changes persist until next execution cycle

3. **Production vs Test Mode**:
   - Production: Uses real P21/POR databases
   - Test: Uses internal test server
   - Both use `/api/executeQuery` endpoint

4. **Component Interaction**:
   - AdminSpreadsheet.tsx: Main grid container
   - DataRow.tsx: Editable row functionality
   - AdminControls.tsx: Run/stop, connections, edit functions
   - Dashboard: Real-time display of values

## SQL Expression Guidelines

### Site Group SQL Expressions
- Columbus: Using location_id '101' (Tallman Equip. - Columbus 6440)
- Addison: Using location_id '100' (Tallman Equip. - Addison 136)
- Lake City: Using location_id '107' (Tallman Equip. - Lake City 2018)

### SQL expressions for site counts:
- Columbus: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '101' AND completed = 'N'`
- Addison: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '100' AND completed = 'N'`
- Lake City: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '107' AND completed = 'N'`

### SQL expressions for site sales:
- Columbus: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '101' AND h.order_date >= DATEADD(day, -30, GETDATE())`
- Addison: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '100' AND h.order_date >= DATEADD(day, -30, GETDATE())`
- Lake City: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '107' AND h.order_date >= DATEADD(day, -30, GETDATE())`

### Order SQL Expressions
- Orders - New - Month 1: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE()) AND completed = 'N'`
- Orders - Completed - Month 1: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE()) AND completed = 'Y'`
- Orders - Cancelled - Month 1: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE()) AND delete_flag = 'Y'`

### Inventory SQL Expressions
- Inventory - Total Items: `SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK)`
- Inventory - Active Items: `SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE delete_flag <> 'Y'`
- Inventory - Inactive Items: `SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE delete_flag = 'Y'`

### Customer SQL Expressions
- Customers - Total: `SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK)`
- Customers - Active: `SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE delete_flag <> 'Y'`
- Customers - Inactive: `SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE delete_flag = 'Y'`
