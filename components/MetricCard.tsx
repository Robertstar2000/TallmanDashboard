import { MetricItem } from '@/lib/db/types';

interface MetricCardProps {
  metric: MetricItem;
}

export default function MetricCard({ metric }: MetricCardProps) {
  // Determine if the value should be formatted as currency
  const isCurrency = metric.name.toLowerCase().includes('revenue') || 
                     metric.name.toLowerCase().includes('sales');
  
  // Format the value
  let formattedValue = metric.value.toString();
  
  if (isCurrency) {
    formattedValue = '$' + metric.value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } else {
    formattedValue = metric.value.toLocaleString('en-US');
  }
  
  // Determine the icon based on the metric name
  let icon = '📊';
  
  if (metric.name.toLowerCase().includes('orders')) {
    icon = '📦';
  } else if (metric.name.toLowerCase().includes('revenue') || metric.name.toLowerCase().includes('sales')) {
    icon = '💰';
  } else if (metric.name.toLowerCase().includes('invoices')) {
    icon = '📄';
  } else if (metric.name.toLowerCase().includes('backlogged')) {
    icon = '⏱️';
  }
  
  // Determine the background color based on the metric name
  let bgColor = 'bg-blue-500';
  
  if (metric.name === 'Open Orders') {
    bgColor = 'bg-green-500';
  } else if (metric.name === 'Open Orders > 2') {
    bgColor = 'bg-purple-500';
  } else if (metric.name === 'Daily Revenue') {
    bgColor = 'bg-yellow-500';
  } else if (metric.name === 'Open Invoices') {
    bgColor = 'bg-pink-500';
  } else if (metric.name === 'Orders Backlogged') {
    bgColor = 'bg-red-500';
  } else if (metric.name === 'Total Sales Monthly') {
    bgColor = 'bg-orange-500';
  }

  return (
    <div className={`${bgColor} text-white rounded-lg p-4 flex flex-col items-center justify-center`}>
      <div className="flex items-center mb-2">
        <span className="mr-2">{icon}</span>
        <h3 className="text-sm font-medium">{metric.name}</h3>
      </div>
      <p className="text-2xl font-bold">{formattedValue}</p>
    </div>
  );
}
