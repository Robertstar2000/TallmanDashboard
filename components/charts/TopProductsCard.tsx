'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductsDialog } from './ProductsDialog';
import { Product, ProductsByCategory } from '@/lib/types/dashboard';

interface TopProductsCardProps {
  products: ProductsByCategory;
  onUpdate?: (data: ProductsByCategory) => void;
}

interface EditableProduct extends Product {
  category: keyof ProductsByCategory;
}

export function TopProductsCard({ products, onUpdate }: TopProductsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<EditableProduct[]>([]);

  const calculateTotalSales = (products: Product[]) => {
    return products?.reduce((sum, product) => sum + product.value, 0) || 0;
  };

  // Convert products object to array format for editing
  const productsToArray = (): EditableProduct[] => {
    const result: EditableProduct[] = [];
    (Object.keys(products) as Array<keyof ProductsByCategory>).forEach((category) => {
      products[category]?.forEach((product) => {
        result.push({
          category,
          name: product.name,
          value: product.value
        });
      });
    });
    return result;
  };

  // Convert array back to products object format
  const arrayToProducts = (array: EditableProduct[]): ProductsByCategory => {
    const result: ProductsByCategory = {
      online: [],
      inside: [],
      outside: []
    };
    
    array.forEach((item) => {
      result[item.category].push({
        name: item.name,
        value: Number(item.value)
      });
    });
    
    return result;
  };

  const handleStartEditing = () => {
    setEditableData(productsToArray());
    setIsEditing(true);
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditableData([]);
  };

  const handleSave = (data: EditableProduct[]) => {
    if (onUpdate) {
      onUpdate(arrayToProducts(data));
    }
    handleClose();
  };

  const handleDataChange = (index: number, key: string, value: any) => {
    setEditableData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [key]: value };
      return newData;
    });
  };

  return (
    <>
      <div className="relative group cursor-pointer" onClick={handleStartEditing}>
        <Card>
          <CardHeader className="p-1">
            <CardTitle className="text-xs">Top Products (per week)</CardTitle>
          </CardHeader>
          <CardContent className="p-1 space-y-4">
            {(Object.keys(products) as Array<keyof ProductsByCategory>).map((category) => (
              <div key={category} className="space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-medium capitalize">{category} Sales</h4>
                  <span className="text-xs font-bold text-green-600">
                    ${calculateTotalSales(products[category]).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {products[category]?.map((product: Product, index: number) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-600">{product.name}:</span>
                      <span className="font-medium">${product.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-xs text-gray-700 bg-white/90 px-2 py-1 rounded">
            Click to edit data
          </span>
        </div>
      </div>

      <ProductsDialog
        isOpen={isEditing}
        title="Top Products Data"
        data={editableData}
        onClose={handleClose}
        onSave={handleSave}
        onDataChange={handleDataChange}
      />
    </>
  );
}