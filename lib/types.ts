export type ServerType = 'P21' | 'POR' | 'Manual';

export interface AdminVariable {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  chartGroup: string;
  subGroup?: string;
  testSqlExpression: string;
  previousValueSqlExpression?: string;
  sqlExpression?: string;
  productionTable: string;
  testTable: string;
  sourceServer: 'P21' | 'POR' | 'Manual';
  updateInterval: number;
  isMetric?: boolean;
  formatAsCurrency?: boolean;
  error?: string;
  p21DataDictionary?: string;
}

export interface AdminSettings {
  isTestMode: boolean;
  isRunning: boolean;
  lastUpdate: string;
}

export interface ChartDataPoint {
  x: string;
  y: number;
  series?: string;
}

export interface ChartConfig {
  chartGroup: string;
  variables: AdminVariable[];
}

export interface ChartData {
  id: number;
  chartName: string;
  value: number;
  chartGroup: string;
  calculation: string;
  sqlExpression?: string;
  tableName?: string;
  serverName?: string;
}

export interface MetricData {
  value: string;
  trend?: number;
  change?: number;
}
