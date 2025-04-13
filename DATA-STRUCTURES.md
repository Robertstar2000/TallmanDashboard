# Tallman Dashboard Data Structures

This document outlines the key data structures and TypeScript interfaces used in the Tallman Dashboard application.

## Dashboard Data Structure

The dashboard uses a consistent data structure across all chart groups to ensure proper rendering and data flow. Below are the main interfaces and their implementations.

### Core Interfaces

```typescript
// Main dashboard data interface
interface DashboardData {
  keyMetrics: MetricItem[];
  accounts: AccountsDataPoint[];
  historicalData: HistoricalDataPoint[];
  customerMetrics: CustomerMetricsDataPoint[];
  inventory: InventoryDataPoint[];
  porOverview: POROverviewDataPoint[];
  webOrders: WebOrdersDataPoint[];
  dailyOrders: DailyOrdersDataPoint[];
  arAging: ARAgeingDataPoint[];
  siteDistribution: SiteDistributionDataPoint[];
}

// Base interface for all data points
interface BaseDataPoint {
  chartGroup: string;
  variable: string;
  value: number;
}

// Key metrics interface
interface MetricItem {
  name: string;
  value: number;
  isCurrency: boolean;
  chartGroup: string;
}
```

### Chart-Specific Interfaces

```typescript
// Accounts chart data point
interface AccountsDataPoint extends BaseDataPoint {
  month: string; // Month name (Jan, Feb, etc.)
  variable: 'Payable' | 'Receivable' | 'Overdue';
}

// Historical data chart point
interface HistoricalDataPoint extends BaseDataPoint {
  month: string; // Month name (Jan, Feb, etc.)
  variable: 'P21' | 'POR' | 'Combined';
}

// Customer metrics data point
interface CustomerMetricsDataPoint extends BaseDataPoint {
  month: string; // Month name (Jan, Feb, etc.)
  variable: 'New' | 'Prospects';
}

// Inventory data point
interface InventoryDataPoint extends BaseDataPoint {
  department: string; // Department name
  variable: 'In Stock' | 'On Order';
}

// POR Overview data point
interface POROverviewDataPoint extends BaseDataPoint {
  month: string; // Month name (Jan, Feb, etc.)
  variable: 'New Rentals' | 'Open Rentals' | 'Rental Value';
}

// Web Orders data point
interface WebOrdersDataPoint extends BaseDataPoint {
  month: string; // Month name (Jan, Feb, etc.)
  variable: 'Orders';
}

// Daily Orders data point
interface DailyOrdersDataPoint extends BaseDataPoint {
  day: string; // Day name (Today, Today-1, etc.)
  variable: 'Orders';
}

// AR Aging data point
interface ARAgeingDataPoint extends BaseDataPoint {
  bucket: string; // Aging bucket (Current, 1-30 Days, etc.)
  variable: 'Amount Due';
}

// Site Distribution data point
interface SiteDistributionDataPoint extends BaseDataPoint {
  location: string; // Location name (Columbus, Addison, Lake City)
  variable: 'Value';
}
```

## Example Data Structure Implementation

Below is an example of how the dashboard data structure is implemented in the application:

```typescript
// Example dashboard data
const dashboardData: DashboardData = {
  keyMetrics: [
    { name: 'Total Orders', value: 1250, isCurrency: false, chartGroup: 'Key Metrics' },
    { name: 'Open Orders', value: 42, isCurrency: false, chartGroup: 'Key Metrics' },
    { name: 'Daily Revenue', value: 87541.25, isCurrency: true, chartGroup: 'Key Metrics' },
    { name: 'Open Invoices', value: 156, isCurrency: false, chartGroup: 'Key Metrics' },
    { name: 'Orders Backloged', value: 18, isCurrency: false, chartGroup: 'Key Metrics' },
    { name: 'Total Sales Monthly', value: 1250000, isCurrency: true, chartGroup: 'Key Metrics' },
    { name: 'Open Orders > 2', value: 5, isCurrency: false, chartGroup: 'Key Metrics' }
  ],
  accounts: [
    // January data
    { chartGroup: 'Accounts', month: 'Jan', variable: 'Payable', value: 45000 },
    { chartGroup: 'Accounts', month: 'Jan', variable: 'Receivable', value: 65000 },
    { chartGroup: 'Accounts', month: 'Jan', variable: 'Overdue', value: 12000 },
    // February data
    { chartGroup: 'Accounts', month: 'Feb', variable: 'Payable', value: 48000 },
    { chartGroup: 'Accounts', month: 'Feb', variable: 'Receivable', value: 67500 },
    { chartGroup: 'Accounts', month: 'Feb', variable: 'Overdue', value: 11500 },
    // ... additional months
  ],
  // ... other chart groups following similar patterns
};
```

## Data Transformation

When working with the dashboard data, you may need to transform it for specific chart components. Here are common transformation patterns:

### Grouping by Variable

```typescript
// Group accounts data by variable
const groupedByVariable = accounts.reduce((acc, item) => {
  if (!acc[item.variable]) {
    acc[item.variable] = [];
  }
  acc[item.variable].push(item);
  return acc;
}, {});
```

### Extracting Labels

```typescript
// Extract unique months for x-axis labels
const months = [...new Set(accounts.map(item => item.month))];
```

### Formatting for Chart.js

```typescript
// Format data for Chart.js
const chartData = {
  labels: months,
  datasets: Object.entries(groupedByVariable).map(([variable, items], index) => ({
    label: variable,
    data: months.map(month => {
      const item = items.find(i => i.month === month);
      return item ? item.value : 0;
    }),
    backgroundColor: colors[index % colors.length],
    borderColor: borderColors[index % borderColors.length],
    borderWidth: 1
  }))
};
```

## Best Practices

1. **Type Safety**: Always use TypeScript interfaces to ensure type safety when working with dashboard data.
2. **Consistent Naming**: Maintain consistent naming conventions across all data structures.
3. **Data Validation**: Validate data before rendering to prevent chart errors.
4. **Default Values**: Provide sensible default values for missing data points.
5. **Error Handling**: Implement proper error handling for data processing and transformation.

By following these guidelines and understanding the data structures, you can effectively work with and extend the Tallman Dashboard application.
