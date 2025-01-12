'use client';

import { useState, useCallback } from 'react';
import { Products } from '@/lib/types/dashboard';
import { isValidCategory } from '@/lib/utils/validation';

interface ProductItem {
  category: string;
  name: string;
  value: number;
}

export function useProductsData(initialProducts: Products) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<ProductItem[]>([]);

  const productsToArray = useCallback(() => {
    const result: ProductItem[] = [];
    (Object.keys(initialProducts) as Array<keyof Products>).forEach((category) => {
      initialProducts[category]?.forEach((product) => {
        result.push({
          category,
          name: product.name,
          value: product.value
        });
      });
    });
    return result;
  }, [initialProducts]);

  const arrayToProducts = useCallback((array: ProductItem[]): Products => {
    const result: Products = {
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