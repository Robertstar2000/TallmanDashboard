'use client';
import { useState, useCallback } from 'react';
import { isValidMetricName } from '@/lib/utils/validation';
import { updateMetric } from '@/lib/db';
import { showSuccess, showError } from '@/lib/utils/toast';
export function useMetricData(metrics, onUpdate) {
    const [isEditing, setIsEditing] = useState(false);
    const [editingMetric, setEditingMetric] = useState(null);
    const handleUpdate = useCallback((name, value) => {
        if (!isValidMetricName(name)) {
            showError("Error", "Invalid metric name");
            return;
        }
        try {
            const updatedMetrics = updateMetric(name, value);
            onUpdate(updatedMetrics);
            showSuccess("Metric Updated", `${name.split('_').join(' ')} has been updated successfully.`);
        }
        catch (error) {
            showError("Error", "Failed to update metric.");
            console.error('Error updating metric:', error);
        }
    }, [onUpdate]);
    const startEditing = useCallback((metric) => {
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
