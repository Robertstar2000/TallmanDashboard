import { showSuccess, showError } from './toast';

export const handleChartUpdate = (chartName: string, data: any[], onUpdate: (data: any[]) => void) => {
  try {
    onUpdate(data);
    showSuccess(
      "Chart Updated",
      `${chartName} data has been updated successfully.`
    );
  } catch (error) {
    showError(
      "Error",
      "Failed to update chart data."
    );
    console.error('Error updating chart:', error);
  }
};

export const formatChartValue = (value: number, type: string): string => {
  if (type === 'currency') {
    return `$${value.toLocaleString()}`;
  }
  if (type === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString();
};