'use client';

// ... existing functions ...

export const formatMetricName = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '_');
};

export const parsePayableName = (name: string): string => {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const formatPayableMonth = (date: string): string => {
  const [year, month] = date.split('-');
  return `${year}-${month.padStart(2, '0')}`;
};

export const formatMonthDisplay = (monthNum: string): string => {
  const paddedMonth = monthNum.padStart(2, '0');
  return `2024-${paddedMonth}`;
};