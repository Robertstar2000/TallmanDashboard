'use client';
import { useState, useCallback } from 'react';
import { isValidCategory } from '@/lib/utils/validation';
export function useProductsData(initialProducts) {
    const [isEditing, setIsEditing] = useState(false);
    const [editableData, setEditableData] = useState([]);
    const productsToArray = useCallback(() => {
        const result = [];
        Object.keys(initialProducts).forEach((category) => {
            var _a;
            (_a = initialProducts[category]) === null || _a === void 0 ? void 0 : _a.forEach((product) => {
                result.push({
                    category,
                    name: product.name,
                    value: product.value
                });
            });
        });
        return result;
    }, [initialProducts]);
    const arrayToProducts = useCallback((array) => {
        const result = {
            online: [],
            inside: [],
            outside: []
        };
        array.forEach((item) => {
            if (isValidCategory(item.category)) {
                result[item.category].push({
                    name: item.name,
                    value: Number(item.value)
                });
            }
        });
        return result;
    }, []);
    const startEditing = useCallback(() => {
        setEditableData(productsToArray());
        setIsEditing(true);
    }, [productsToArray]);
    const cancelEditing = useCallback(() => {
        setEditableData([]);
        setIsEditing(false);
    }, []);
    return {
        isEditing,
        editableData,
        startEditing,
        cancelEditing,
        setEditableData,
        arrayToProducts
    };
}
