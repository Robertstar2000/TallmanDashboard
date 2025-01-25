'use client';

import { DashboardData } from '@/lib/types/dashboard';
import { transformDashboardData } from '@/lib/db/data-transformers';

type DashboardState = {
  data: DashboardData;
};

type DashboardAction = 
  | { type: 'REFRESH'; payload: any }
  | { type: 'UPDATE_DATA'; payload: Partial<DashboardData> }
  | { type: 'LOAD_DATA'; payload: DashboardData };

export class DashboardStateMachine {
  private state: DashboardState;
  private listeners: Set<(state: DashboardState) => void>;

  constructor() {
    this.state = {
      data: {
        metrics: [],
        accountsPayable: [],
        historicalData: [],
        dailyShipments: [],
        siteDistribution: [],
        customers: [],
        products: {
          online: [],
          inside: [],
          outside: []
        }
      }
    };
    this.listeners = new Set();
  }

  getState(): DashboardState {
    return this.state;
  }

  subscribe(listener: (state: DashboardState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  dispatch(action: DashboardAction) {
    switch (action.type) {
      case 'REFRESH':
        this.state = {
          data: transformDashboardData(action.payload)
        };
        break;
      case 'UPDATE_DATA':
        this.state = {
          data: { ...this.state.data, ...action.payload }
        };
        break;
      case 'LOAD_DATA':
        this.state = {
          data: action.payload
        };
        break;
    }
    this.notify();
  }

  initialize() {
    this.dispatch({ type: 'REFRESH', payload: null });
  }

  refresh(rawDashboardData: any) {
    this.dispatch({ type: 'REFRESH', payload: rawDashboardData });
  }
}

export const dashboardStateMachine = new DashboardStateMachine();
