'use client';

import { LineChart } from '@/components/charts/LineChart';
import { RawAccountsPayableData } from '@/lib/types/dashboard';

interface AccountsPayableData {
  date: string;
  payable: number;
  receivable: number;
  overdue: number;
}

interface AccountsPayableChartProps {
  data: RawAccountsPayableData[];
}

export function AccountsPayableChart({ data }: AccountsPayableChartProps) {
  if (!data?.length) {
    console.log('No accounts data available');
    return null;
  }

  // Sort data by date and ensure all values are numbers
  const sortedData = [...data]
    .map(item => ({
      date: new Date(item.accountsPayableDate).toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      payable: Number(item.payable) || 0,
      receivable: Number(item.receivable) || 0,
      overdue: Number(item.overdue) || 0
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  console.log('AccountsPayableChart data:', sortedData);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">Accounts Payable vs Receivable</h3>
      <div className="h-[300px] w-full">
        <LineChart
          data={sortedData}
          xKey="date"
          lines={[
            { key: 'payable', name: 'Payable', color: '#4F46E5' },
            { key: 'receivable', name: 'Receivable', color: '#10B981' },
            { key: 'overdue', name: 'Overdue', color: '#F59E0B' }
          ]}
          yAxisLabel="Amount ($)"
          xAxisLabel="Month"
          interval="month"
        />
      </div>
    </div>
  );
}
