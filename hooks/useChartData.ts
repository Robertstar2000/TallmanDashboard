'use client';

import { useState, useCallback } from 'react';

export function useChartData<T>(initialData: T[]) {
  const [data, setData] = useState<T[]>(initialData);
  const [editableData, setEditableData] = useState<T[]>(initialData);
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = useCallback(() => {
    setEditableData(JSON.parse(JSON.stringify(data)));
    setIsEditing(true);
  }, [data]);

  const cancelEditing = useCallback(() => {
    setEditableData(JSON.parse(JSON.stringify(data)));
    setIsEditing(false);
  }, [data]);

  const saveChanges = useCallback(() => {
    setData(editableData);
    setIsEditing(false);
  }, [editableData]);

  const updateEditableData = useCallback((index: number, key: string, value: any) => {
    setEditableData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [key]: value };
      return newData;
    });
  }, []);

  return {
    data,
    editableData,
    isEditing,
    startEditing,
    cancelEditing,
    saveChanges,
    updateEditableData
  };
}