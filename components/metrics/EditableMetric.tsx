'use client';

import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { MetricDialog } from './MetricDialog';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

interface EditableMetricProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  gradient: string;
  onUpdate: (value: number) => void;
}

export function EditableMetric({ icon, title, value, gradient, onUpdate }: EditableMetricProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);
  
  const handleSave = (newValue: number) => {
    onUpdate(newValue);
    handleCloseDialog();
  };

  const formattedValue = title.toLowerCase().includes('revenue') || 
                        title.toLowerCase().includes('invoice') || 
                        title.toLowerCase().includes('sales')
    ? formatCurrency(value)
    : formatNumber(value);

  return (
    <>
      <MetricCard
        icon={icon}
        title={title}
        value={formattedValue}
        gradient={gradient}
        onClick={handleOpenDialog}
      />
      <MetricDialog
        isOpen={isDialogOpen}
        title={title}
        value={value}
        onClose={handleCloseDialog}
        onSave={handleSave}
      />
    </>
  );
}