'use client';
import { MetricsSection } from './dashboard/MetricsSection';
import { ChartsSection } from './dashboard/ChartsSection';
export function DashboardGrid({ data }) {
    return (<div className="container mx-auto p-4">
      <div className="grid gap-4">
        <MetricsSection metrics={data.metrics}/>
        <ChartsSection data={data}/>
      </div>
    </div>);
}
