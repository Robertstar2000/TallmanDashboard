import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SpreadsheetPopup } from './SpreadsheetPopup';
import { DailyShipmentsPopup } from './DailyShipmentsPopup';
import { SpreadsheetData, MonthlyData } from '@/lib/types/dashboard';
import { formatCurrency } from '@/lib/utils/formatting';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SpreadsheetSectionProps {
  data: SpreadsheetData;
  onDataChange?: (updatedData: SpreadsheetData) => void;
}

function formatMonthYear(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short'
  }).format(date);
}

export function SpreadsheetSection({ data, onDataChange }: SpreadsheetSectionProps) {
  const [isSpreadsheetPopupOpen, setIsSpreadsheetPopupOpen] = React.useState(false);
  const [isShipmentsPopupOpen, setIsShipmentsPopupOpen] = React.useState(false);

  const chartData = data.entries.map(entry => ({
    name: formatMonthYear(entry.date),
    P21: entry.p21Value,
    POR: entry.porValue,
  }));

  const handleDataChange = (updatedEntries: MonthlyData[]) => {
    if (onDataChange) {
      const updatedData: SpreadsheetData = {
        ...data,
        entries: updatedEntries
      };
      onDataChange(updatedData);
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.dailyShipments[0]?.shipments || 0}
            </div>
            <Button 
              variant="link" 
              className="px-0"
              onClick={() => setIsShipmentsPopupOpen(true)}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-normal">Monthly Overview</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSpreadsheetPopupOpen(true)}
            >
              View Details
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => label}
                  />
                  <Legend />
                  <Bar dataKey="P21" fill="#8884d8" name="P21" />
                  <Bar dataKey="POR" fill="#82ca9d" name="POR" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total P21</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totals.p21)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total POR</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totals.por)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Average Inventory</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totals.inventory.averageValue)}</p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p>P21: {formatCurrency(data.totals.p21)}</p>
                  <p>POR: {formatCurrency(data.totals.por)}</p>
                </div>
                <Button onClick={() => setIsSpreadsheetPopupOpen(true)}>
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SpreadsheetPopup
        isOpen={isSpreadsheetPopupOpen}
        onClose={() => setIsSpreadsheetPopupOpen(false)}
        data={data.entries}
        onDataChange={handleDataChange}
        title="Monthly Data"
      />

      <DailyShipmentsPopup
        isOpen={isShipmentsPopupOpen}
        onClose={() => setIsShipmentsPopupOpen(false)}
        shipments={data.dailyShipments}
      />
    </>
  );
}
