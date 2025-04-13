'use client';
import { LineChart } from '@/components/charts/LineChart';
export function DailyOrdersChart({ data }) {
    console.log('DailyOrdersChart received data:', JSON.stringify(data));
    // Ensure we have valid data to display
    if (!data || data.length === 0) {
        console.log('No data available for Daily Orders chart');
        return (<div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-4">Daily Orders</h3>
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>);
    }
    // Sort data by date (assuming date is a string that can be parsed as a number)
    const sortedData = [...data].sort((a, b) => {
        // Check if date is undefined
        if (!a.date || !b.date) {
            return 0;
        }
        // Try to parse as numbers first
        const aNum = parseInt(a.date);
        const bNum = parseInt(b.date);
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
        }
        // Fallback to string comparison
        return a.date.localeCompare(b.date);
    });
    console.log('Sorted data for chart:', JSON.stringify(sortedData));
    return (<div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-4">Daily Orders</h3>
      <div className="h-[200px]">
        <LineChart data={sortedData} xKey="date" lines={[
            { key: 'orders', name: 'Orders', color: '#4C51BF' }
        ]}/>
      </div>
    </div>);
}
