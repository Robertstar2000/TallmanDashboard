// For browser environment, we'll use localStorage to simulate the database
const storage = {
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error('Error saving to localStorage');
    }
  }
};

// Initial data for a $100M business
const initialData = {
  metrics: [
    { name: 'total_orders', value: 12847 },
    { name: 'open_orders', value: 1563 },
    { name: 'in_process', value: 892 },
    { name: 'weekly_revenue', value: 1924500 },
    { name: 'open_invoices', value: 3842650 },
    { name: 'orders_backlogged', value: 743 },
    { name: 'total_sales_monthly', value: 8325000 }
  ],
  // ... rest of the initial data ...
};

export const getMetrics = () => {
  const metrics = storage.getItem('metrics');
  return metrics || initialData.metrics;
};

export const updateMetric = (name: string, value: number) => {
  const metrics = getMetrics();
  const updatedMetrics = metrics.map((m: any) =>
    m.name === name ? { ...m, value } : m
  );
  storage.setItem('metrics', updatedMetrics);
  return updatedMetrics;
};

// ... rest of the exports ...