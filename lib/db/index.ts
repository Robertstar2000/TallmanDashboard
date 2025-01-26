'use client';

import { ARAgingData, RawARAgingData } from '@/lib/types/dashboard';
import { executeQuery, isServerConnected } from './sqlite';
import { storage } from './storage';

// Storage utility functions
function getStorageItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// Data access functions
function getMetrics() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('metrics') || [];
}

function updateMetric(metric: any) {
  if (typeof window === 'undefined') return;
  const metrics = getMetrics();
  const index = metrics.findIndex((m: any) => m.name === metric.name);
  if (index !== -1) {
    metrics[index] = metric;
  } else {
    metrics.push(metric);
  }
  storage.setItem('metrics', metrics);
}

function getHistoricalData() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('historicalData') || [];
}

function updateHistoricalData(data: any) {
  if (typeof window === 'undefined') return;
  storage.setItem('historicalData', data);
}

function updateARAgingData(data: any) {
  if (typeof window === 'undefined') return;
  storage.setItem('arAging', data);
}

function getDailyShipments() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('dailyShipments') || [];
}

function updateDailyShipments(data: any) {
  if (typeof window === 'undefined') return;
  storage.setItem('dailyShipments', data);
}

function getSiteDistribution() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('siteDistribution') || [];
}

function updateSiteDistribution(data: any) {
  if (typeof window === 'undefined') return;
  storage.setItem('siteDistribution', data);
}

function getProducts() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('products') || [];
}

function updateProducts(data: any) {
  if (typeof window === 'undefined') return;
  storage.setItem('products', data);
}

function getDailyOrders() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('dailyOrders') || [];
}

function getCustomerMetrics() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('customerMetrics') || [];
}

function getAccounts() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('accounts') || [];
}

function getPOR() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('por') || [];
}

function getInventoryValue() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('inventoryValue') || [];
}

function getWebMetrics() {
  if (typeof window === 'undefined') return [];
  return storage.getItem('webMetrics') || [];
}

// Export all functions in a single statement
export {
  executeQuery,
  isServerConnected,
  getMetrics,
  updateMetric,
  getHistoricalData,
  updateHistoricalData,
  updateARAgingData,
  getDailyShipments,
  updateDailyShipments,
  getSiteDistribution,
  updateSiteDistribution,
  getProducts,
  updateProducts,
  getDailyOrders,
  getCustomerMetrics,
  getAccounts,
  getPOR,
  getInventoryValue,
  getWebMetrics
};