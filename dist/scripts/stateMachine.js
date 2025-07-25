'use client';
export class DashboardStateMachine {
    constructor() {
        this.state = {
            data: {
                metrics: [],
                historicalData: [],
                accounts: [],
                customerMetrics: [],
                inventory: [],
                porOverview: [],
                siteDistribution: [],
                arAging: [],
                dailyOrders: [],
                webOrders: []
            }
        };
        this.listeners = new Set();
    }
    getState() {
        return this.state;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
    dispatch(action) {
        switch (action.type) {
            case 'REFRESH':
                // Don't transform, use API data directly
                this.state = {
                    data: action.payload
                };
                break;
            case 'UPDATE_DATA':
                this.state = {
                    data: Object.assign(Object.assign({}, this.state.data), action.payload)
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
        // Don't initialize with any data, wait for API
        return;
    }
    refresh(dashboardData) {
        // Validate and transform data before setting state
        const validatedData = {
            metrics: Array.isArray(dashboardData.metrics) ? dashboardData.metrics : [],
            historicalData: Array.isArray(dashboardData.historicalData) ? dashboardData.historicalData : [],
            accounts: Array.isArray(dashboardData.accounts) ? dashboardData.accounts.map(account => ({
                id: account.id || '',
                date: account.date || '',
                payable: Number(account.payable) || 0,
                receivable: Number(account.receivable) || 0,
                overdue: Number(account.overdue) || 0
            })) : [],
            customerMetrics: Array.isArray(dashboardData.customerMetrics) ? dashboardData.customerMetrics : [],
            inventory: Array.isArray(dashboardData.inventory) ? dashboardData.inventory : [],
            porOverview: Array.isArray(dashboardData.porOverview) ? dashboardData.porOverview : [],
            siteDistribution: Array.isArray(dashboardData.siteDistribution) ? dashboardData.siteDistribution : [],
            arAging: Array.isArray(dashboardData.arAging) ? dashboardData.arAging : [],
            dailyOrders: Array.isArray(dashboardData.dailyOrders) ? dashboardData.dailyOrders : [],
            webOrders: Array.isArray(dashboardData.webOrders) ? dashboardData.webOrders : []
        };
        this.dispatch({ type: 'LOAD_DATA', payload: validatedData });
    }
}
export const dashboardStateMachine = new DashboardStateMachine();
