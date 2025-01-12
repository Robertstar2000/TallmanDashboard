'use client';

export const formatCurrency = (value: number): string => {
  if (!value && value !== 0) return '$0';
  return `$${value.toLocaleString()}`;
};

export const formatNumber = (value: number): string => {
  if (!value && value !== 0) return '0';
  return value.toLocaleString();
};

export const formatTitle = (text: string): string => {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const isCurrencyMetric = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  return lowerName.includes('revenue') || 
         lowerName.includes('invoice') || 
         lowerName.includes('sales');
};