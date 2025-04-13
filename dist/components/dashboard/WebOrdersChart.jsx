'use client';
import { LineChart } from '@/components/charts/LineChart';
export function WebOrdersChart({ data }) {
    return (<div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-4">Web Orders</h3>
      <div className="h-[200px]">
        <LineChart data={data} xKey="date" lines={[
            { key: 'value', name: 'Orders', color: '#48BB78' }
        ]}/>
      </div>
    </div>);
}
