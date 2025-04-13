export function isValidCategory(category) {
    return ['online', 'inside', 'outside'].includes(category);
}
export const isValidMetricName = (name) => {
    const validMetrics = [
        'total_orders',
        'open_orders',
        'in_process',
        'weekly_revenue',
        'open_invoices',
        'orders_backlogged',
        'total_sales_monthly'
    ];
    return validMetrics.includes(name);
};
