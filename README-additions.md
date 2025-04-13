# Tallman Dashboard README Additions

## Development and Testing

### Test Data Structure
For development and testing purposes, the dashboard can be configured to use hardcoded test data instead of live database connections. This approach offers several benefits:

1. **Rapid UI Development**: Enables frontend development without requiring database connections
2. **Consistent Testing**: Provides predictable data for testing chart components
3. **Offline Development**: Allows work to continue when database access is unavailable

The test data structure mirrors the production data structure but uses static values:

```javascript
// Example of test data structure for Accounts chart
const accountsTestData = {
  chartGroup: 'Accounts',
  data: [
    // Payable data for 12 months
    { name: 'Jan', variable: 'Payable', value: 45000 },
    { name: 'Feb', variable: 'Payable', value: 48000 },
    // ... more months
    
    // Receivable data for 12 months
    { name: 'Jan', variable: 'Receivable', value: 65000 },
    { name: 'Feb', variable: 'Receivable', value: 67500 },
    // ... more months
    
    // Overdue data for 12 months
    { name: 'Jan', variable: 'Overdue', value: 12000 },
    { name: 'Feb', variable: 'Overdue', value: 11500 },
    // ... more months
  ]
};
```

### Direct Data Approach
To bypass the complex database logic during development, a direct data approach can be implemented:

1. Create a `direct-data.json` file with pre-populated values for all dashboard sections
2. Modify the API route to use this direct data file instead of database queries
3. Ensure the data structure matches the expected format for each chart component

This approach ensures that the dashboard displays properly with meaningful test data regardless of database connection issues.

### Testing Methodology
1. **Component Testing**: Verify each chart component renders correctly with test data
2. **Integration Testing**: Ensure all components work together on the dashboard
3. **Data Flow Testing**: Validate the flow from data source to visualization
4. **Performance Testing**: Check dashboard responsiveness with full data load

## Troubleshooting

### Common Issues and Solutions

#### Blank Dashboard
If the dashboard appears blank or charts are not rendering:
1. Check browser console for JavaScript errors
2. Verify that the data structure matches what the chart components expect
3. Ensure the API routes are returning data in the correct format
4. Delete the `.next` directory to force a complete rebuild

#### Database Connection Issues
If experiencing problems connecting to databases:
1. Verify connection strings and credentials
2. Check that the database server is accessible from the application server
3. Test connections using the Admin Query Test page
4. Ensure proper ODBC drivers are installed for POR access

#### Chart Rendering Problems
If charts are not displaying correctly:
1. Verify that the chart data structure includes all required fields
2. Check that variable names match between data and chart components
3. Ensure proper formatting for currency values and dates
4. Validate that the chart library dependencies are correctly imported

### TypeScript Interface Considerations
When working with the dashboard data structures, ensure that all objects conform to their TypeScript interfaces. Common issues include:

1. Missing required properties in data objects
2. Properties with incorrect names (e.g., using 'name' instead of 'month')
3. Properties with incorrect types (e.g., using string instead of number for values)

Always refer to the type definitions in the codebase when creating or modifying data structures.
