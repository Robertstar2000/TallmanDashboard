'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function DataTable({ data, onSave, onUpdate, loading }) {
    const handleCellChange = (rowIndex, column, value) => {
        const newData = [...data];
        newData[rowIndex] = Object.assign(Object.assign({}, newData[rowIndex]), { [column]: value });
        onSave(newData);
    };
    if (loading) {
        return <div className="text-center py-4">Loading...</div>;
    }
    return (<div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chart Group</TableHead>
            <TableHead>Variable Name</TableHead>
            <TableHead>Server Name</TableHead>
            <TableHead>Table Name</TableHead>
            <TableHead>SQL Expression</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (<TableRow key={row.id}>
              <TableCell>
                <Input value={row.chartGroup} onChange={(e) => handleCellChange(rowIndex, 'chartGroup', e.target.value)}/>
              </TableCell>
              <TableCell>
                <Input value={row.variableName} onChange={(e) => handleCellChange(rowIndex, 'variableName', e.target.value)}/>
              </TableCell>
              <TableCell>
                <Input value={row.serverName} onChange={(e) => handleCellChange(rowIndex, 'serverName', e.target.value)}/>
              </TableCell>
              <TableCell>
                <Input value={row.tableName} onChange={(e) => handleCellChange(rowIndex, 'tableName', e.target.value)}/>
              </TableCell>
              <TableCell>
                <Input value={row.sqlExpression} onChange={(e) => handleCellChange(rowIndex, 'sqlExpression', e.target.value)}/>
              </TableCell>
              <TableCell>
                <Input value={row.value} readOnly/>
              </TableCell>
              <TableCell>
                <Button onClick={() => onUpdate(row)} disabled={loading}>
                  Update
                </Button>
              </TableCell>
            </TableRow>))}
        </TableBody>
      </Table>
    </div>);
}
