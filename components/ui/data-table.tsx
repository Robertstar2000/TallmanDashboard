'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface DataTableProps {
  data: any[];
  onDataChange: (newData: any[]) => void;
}

export function DataTable({ data, onDataChange }: DataTableProps) {
  if (!data.length) return null;

  const headers = Object.keys(data[0]);

  const handleCellChange = (rowIndex: number, column: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [column]: column === 'date' || column === 'month' ? value : Number(value)
    };
    onDataChange(newData);
  };

  const formatHeader = (header: string) => {
    return header
      .split(/(?=[A-Z])|_/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="font-semibold">
                {formatHeader(header)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {headers.map((column) => (
                <TableCell key={`${rowIndex}-${column}`} className="p-2">
                  <Input
                    type={column === 'date' || column === 'month' ? 'text' : 'number'}
                    value={row[column]}
                    onChange={(e) => handleCellChange(rowIndex, column, e.target.value)}
                    className="w-full h-8 text-sm"
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}