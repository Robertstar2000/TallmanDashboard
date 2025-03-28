import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  className?: string;
  format?: 'number' | 'currency';
}

export function MetricCard({ title, value, className, format = 'number' }: MetricCardProps) {
  const formattedValue = format === 'currency' 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    : new Intl.NumberFormat('en-US').format(value);

  return (
    <Card className={cn('flex flex-col justify-center p-4', className)}>
      <h3 className="text-lg font-semibold text-center">{title}</h3>
      <p className="text-2xl font-bold text-center mt-2">{formattedValue}</p>
    </Card>
  );
}
