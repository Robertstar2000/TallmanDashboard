'use client';
import { useState, useCallback } from 'react';
export function useChartData(initialData) {
    const [data, setData] = useState(initialData);
    const [editableData, setEditableData] = useState(initialData);
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
    const updateEditableData = useCallback((index, key, value) => {
        setEditableData(prev => {
            const newData = [...prev];
            newData[index] = Object.assign(Object.assign({}, newData[index]), { [key]: value });
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
