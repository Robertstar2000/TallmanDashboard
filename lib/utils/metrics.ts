import { updateMetric } from '@/lib/db';
import { showSuccess, showError } from '@/lib/utils/toast';

export const handleMetricUpdate = (
  name: string, 
  value: number, 
  currentMetrics: any[], 
  onUpdate: (metrics: any[]) => void
) => {
  try {
    const updatedMetrics = updateMetric(name, value);
    if (updatedMetrics) {
      onUpdate(updatedMetrics);
      showSuccess(
        "Metric Updated",
        `${name.split('_').join(' ')} has been updated successfully.`
      );
    }
  } catch (error) {
    showError(
      "Error",
      "Failed to update metric."
    );
    console.error('Error updating metric:', error);
  }
};

export const formatMetricValue = (name: string, value: number): string => {
  if (!value && value !== 0) return '0';
  
  if (name.includes('revenue') || name.includes('invoices') || name.includes('sales')) {
    return `$${value.toLocaleString()}`;
  }
  return value.toLocaleString();
};