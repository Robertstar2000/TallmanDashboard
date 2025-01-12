'use client';

import { useState, useCallback } from 'react';
import { Metric } from '@/lib/types/dashboard';
import { isValidMetricName } from '@/lib/utils/validation';
import { updateMetric } from '@/lib/db';
import { showSuccess, showError } from '@/lib/utils/toast';

export function useMetricData(metrics: Metric[], onUpdate: (metrics: Metric[]) => void) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);

  const handleUpdate = useCallback((name: string, value: number) => {
    if (!isValidMetricName(name)) {
      showError("Error", "Invalid metric name");
      return;
    }

    try {
      const updatedMetrics = updateMetric(name, value);
      onUpdate(updatedMetrics);
      showSuccess(
        "Metric Updated",
        `${name.split('_').join(' ')} has been updated successfully.`
      );
    } catch (error) {
      showError(
        "Error",
        "Failed to update metric."
      );
      console.error('Error updating metric:', error);
    }
  }, [onUpdate]);

  const startEditing = useCallback((metric: Metric) => {
    setEditingMetric(metric);
    setIsEditing(true);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingMetric(null);
    setIsEditing(false);
  }, []);

  return {
    isEditing,
    editingMetric,
    startEditing,
    cancelEditing,
    handleUpdate
  };
}