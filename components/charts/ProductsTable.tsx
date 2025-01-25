'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface ProductsTableProps {
  data: any[];
  onDataChange: (index: number, key: string, value: any) => void;
}

export function ProductsTable({ data, onDataChange }: ProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Product Name</TableHead>
          <TableHead>Value ($)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            <TableCell>
              <Input
                type="text"
                value={row.category}
                onChange={(e) => onDataChange(index, 'category', e.target.value)}
                className="w-full"
              />
            </TableCell>
            <TableCell>
              <Input
                type="text"
                value={row.name}
                onChange={(e) => onDataChange(index, 'name', e.target.value)}
                className="w-full"
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                value={row.value}
                onChange={(e) => onDataChange(index, 'value', Number(e.target.value))}
                className="w-full"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}