'use client';

export const DATABASE_SCHEMA = {
  orders: {
    name: 'orders',
    columns: ['id', 'status', 'amount', 'date'],
    primaryKey: 'id'
  },
  accounts_payable: {
    name: 'accounts_payable',
    columns: ['id', 'amount', 'date', 'status'],
    primaryKey: 'id'
  },
  customers: {
    name: 'customers',
    columns: ['id', 'status', 'date'],
    primaryKey: 'id'
  },
  inventory: {
    name: 'inventory',
    columns: ['id', 'site', 'value', 'turnover', 'date'],
    primaryKey: 'id'
  },
  shipments: {
    name: 'shipments',
    columns: ['id', 'date', 'count'],
    primaryKey: 'id'
  },
  dashboard_variables: {
    name: 'dashboard_variables',
    columns: [
      'id',
      'name',
      'value',
      'chartGroup',
      'calculation',
      'sqlExpression',
      'p21DataDictionary'
    ],
    primaryKey: 'id'
  }
};