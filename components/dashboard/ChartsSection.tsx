'use client';

import React from 'react';
import { 
  HistoricalDataPoint, 
  DailyShipment, 
  AccountsPayableData, 
  CustomerData, 
  SiteDistribution 
} from '@/lib/types/dashboard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';

interface ChartsSectionProps {
  historicalData?: HistoricalDataPoint[];
  dailyShipments?: DailyShipment[];
  accountsPayable?: AccountsPayableData[];
  customers?: CustomerData[];
  siteDistribution?: SiteDistribution[];
  onHistoricalUpdate?: (data: HistoricalDataPoint[]) => void;
  onShipmentsUpdate?: (data: DailyShipment[]) => void;
  onAccountsPayableUpdate?: (data: AccountsPayableData[]) => void;
  onCustomersUpdate?: (data: CustomerData[]) => void;
  onSiteDistributionUpdate?: (data: SiteDistribution[]) => void;
}

export function ChartsSection({
  historicalData,
  dailyShipments,
  accountsPayable,
  customers,
  siteDistribution,
  onHistoricalUpdate,
  onShipmentsUpdate,
  onAccountsPayableUpdate,
  onCustomersUpdate,
  onSiteDistributionUpdate
}: ChartsSectionProps) {
  return (
    <div className="h-full">
      {historicalData && (
        <div className="h-full">
          <LineChart
            data={historicalData}
            onDataUpdate={onHistoricalUpdate}
            xKey="date"
            lines={[
              { key: 'p21', name: 'P21', color: '#4C51BF' },
              { key: 'por', name: 'POR', color: '#48BB78' }
            ]}
          />
        </div>
      )}
      
      {dailyShipments && (
        <div className="h-full">
          <BarChart
            data={dailyShipments}
            onDataUpdate={onShipmentsUpdate}
            xKey="date"
            yKey="shipments"
            color="#4C51BF"
          />
        </div>
      )}
      
      {accountsPayable && (
        <div className="h-full">
          <LineChart
            data={accountsPayable}
            onDataUpdate={onAccountsPayableUpdate}
            xKey="date"
            lines={[
              { key: 'total', name: 'Total', color: '#4C51BF' },
              { key: 'overdue', name: 'Overdue', color: '#F56565' }
            ]}
          />
        </div>
      )}
      
      {customers && (
        <div className="h-full">
          <LineChart
            data={customers}
            onDataUpdate={onCustomersUpdate}
            xKey="date"
            lines={[
              { key: 'new', name: 'New Customers', color: '#4C51BF' },
              { key: 'prospects', name: 'Prospects', color: '#48BB78' }
            ]}
          />
        </div>
      )}
      
      {siteDistribution && (
        <div className="h-full">
          <PieChart
            data={[
              { name: 'Columbus', value: siteDistribution[0].columbus },
              { name: 'Addison', value: siteDistribution[0].addison },
              { name: 'Lake City', value: siteDistribution[0].lakeCity }
            ]}
            onDataUpdate={(data) => {
              if (onSiteDistributionUpdate && siteDistribution[0]) {
                onSiteDistributionUpdate([{
                  ...siteDistribution[0],
                  columbus: data[0].value,
                  addison: data[1].value,
                  lakeCity: data[2].value
                }]);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}