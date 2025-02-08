'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '@/lib/types/dashboard';
import { transformDashboardData } from '@/lib/db/data-transformers';
import { showSuccess, showError, showLoading } from '@/lib/utils/toast';
import { rawDashboardData } from '@/lib/db/raw-data';

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
      const transformedData = transformDashboardData(rawDashboardData);
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
    refreshData: loadData,
    updateData: (category: keyof DashboardData, newData: any) => {
      setData(prev => ({
        ...prev,
        [category]: newData
      }));
    }
  };
}