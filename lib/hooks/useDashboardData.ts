'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardData, RawDashboardData } from '@/lib/types/dashboard';
import { transformDashboardData } from '@/lib/db/data-transformers';
import { showSuccess, showError, showLoading } from '@/lib/utils/toast';
import { rawDashboardData, DashboardVariable } from '@/lib/db/raw-data';

function convertToDashboardData(data: DashboardVariable[]): RawDashboardData[] {
  return data.map(item => ({
    id: item.id,
    name: item.name,
    chartGroup: item.chartGroup,
    calculation: item.calculation,
    sqlExpression: item.sqlExpression,
    p21DataDictionary: item.p21DataDictionary,
    value: item.value || '',
    historicalDate: item.historicalDate,
    p21: item.p21,
    por: item.por,
    accountsPayableDate: item.accountsPayableDate,
    total: item.total,
    overdue: item.overdue,
    customersDate: item.customersDate,
    new: item.new,
    prospects: item.prospects,
    inventoryValueDate: item.inventoryValueDate,
    inventory: item.inventory,
    turnover: item.turnover,
    arAgingDate: item.arAgingDate,
    current: item.current,
    aging_1_30: item.aging_1_30,
    aging_31_60: item.aging_31_60,
    aging_61_90: item.aging_61_90,
    aging_90_plus: item.aging_90_plus
  })) as RawDashboardData[];
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    metrics: [],
    historicalData: [],
    dailyShipments: [],
    siteDistribution: [],
    accountsPayable: [],
    customers: [],
    products: {
      online: [],
      inside: [],
      outside: []
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    showLoading("Loading Dashboard", "Fetching data...");

    try {
      const transformedData = transformDashboardData(convertToDashboardData(rawDashboardData));
      setData(transformedData);
      showSuccess("Dashboard Updated", "Data loaded successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      showError("Error", message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    error,
    refreshData: loadData
  };
}