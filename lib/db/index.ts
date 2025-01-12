'use client';

import { storage } from './storage';
import { initialData } from './initial-data';
import { 
  Metric, 
  HistoricalDataPoint, 
  DailyShipment, 
  SiteDistribution, 
  Products,
  RawHistoricalData,
  RawProductData,
  RawAccountsPayableData,
  RawCustomersData,
  RawInventoryData,
  RawSiteDistributionData
} from '@/lib/types/dashboard';

// Type guards
function isHistoricalData(item: any): item is RawHistoricalData {
  return 'historicalDate' in item && 'p21' in item && 'por' in item;
}

function isProductData(item: any): item is RawProductData {
  return 'value' in item;
}

function isSiteDistributionData(item: any): item is RawSiteDistributionData {
  return 'columbus' in item && 'addison' in item && 'lakeCity' in item;
}

// Initialize storage with data
const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  
  // Convert initial data array to structured format
  const structuredData = {
    metrics: initialData
      .filter(item => item.chartGroup === 'Metrics')
      .map(item => {
        const value = isHistoricalData(item) ? Number(item.p21) : 0;
        return {
          name: item.name,
          value
        };
      }),
    
    historicalData: initialData
      .filter(item => item.chartGroup === 'Historical Data')
      .filter(isHistoricalData)
      .map(item => ({
        date: item.historicalDate,
        p21: Number(item.p21),
        por: Number(item.por)
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    
    dailyShipments: initialData
      .filter(item => item.chartGroup === 'Daily Shipments')
      .filter(isHistoricalData)
      .map(item => ({
        date: item.historicalDate,
        shipments: Number(item.p21)
      })),
    
    siteDistribution: initialData
      .filter(item => item.chartGroup === 'Site Distribution')
      .filter(isSiteDistributionData)
      .map(item => ({
        date: item.historicalDate,
        columbus: Number(item.columbus),
        addison: Number(item.addison),
        lakeCity: Number(item.lakeCity)
      })),
    
    products: {
      online: initialData
        .filter(item => item.chartGroup === 'Top Products Online')
        .filter(isProductData)
        .map(item => ({
          name: item.name,
          value: Number(item.value)
        })),
      inside: initialData
        .filter(item => item.chartGroup === 'Top Products Inside')
        .filter(isProductData)
        .map(item => ({
          name: item.name,
          value: Number(item.value)
        })),
      outside: initialData
        .filter(item => item.chartGroup === 'Top Products Outside')
        .filter(isProductData)
        .map(item => ({
          name: item.name,
          value: Number(item.value)
        }))
    }
  };

  // Initialize each data category
  Object.entries(structuredData).forEach(([key, value]) => {
    storage.initialize(key, value);
  });
};

// Initialize on import
initializeStorage();

export const getMetrics = (): Metric[] => {
  const metrics = storage.getItem('metrics');
  return metrics || [];
};

export const updateMetric = (name: string, value: number): Metric[] => {
  const metrics = getMetrics();
  const updatedMetrics = metrics.map((m: Metric) =>
    m.name === name ? { ...m, value } : m
  );
  storage.setItem('metrics', updatedMetrics);
  return updatedMetrics;
};

export const getHistoricalData = (): HistoricalDataPoint[] => {
  const data = storage.getItem('historicalData');
  return data || [];
};

export const updateHistoricalData = (data: HistoricalDataPoint[]): HistoricalDataPoint[] => {
  storage.setItem('historicalData', data);
  return data;
};

export const getDailyShipments = (): DailyShipment[] => {
  const data = storage.getItem('dailyShipments');
  return data || [];
};

export const updateDailyShipments = (data: DailyShipment[]): DailyShipment[] => {
  storage.setItem('dailyShipments', data);
  return data;
};

export const getSiteDistribution = (): SiteDistribution[] => {
  const data = storage.getItem('siteDistribution');
  return data || [];
};

export const updateSiteDistribution = (data: SiteDistribution[]): SiteDistribution[] => {
  storage.setItem('siteDistribution', data);
  return data;
};

export const getProducts = (): Products => {
  const data = storage.getItem('products');
  return data || { online: [], inside: [], outside: [] };
};

export const updateProducts = (data: Products): Products => {
  storage.setItem('products', data);
  return data;
};