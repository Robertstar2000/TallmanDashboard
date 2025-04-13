'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { defaultAdminData } from '@/lib/db/admin';
import { executeTestQuery, executeProductionQuery } from '@/lib/db/admin';
export class AdminStateMachine {
    constructor() {
        this.updateTimeout = null;
        this.updateInterval = 2000; // 2 seconds between updates
        this.isExecuting = false;
        this.executeUpdate = null;
        this.minDisplayTime = 500; // Minimum time to display each row
        console.log('Constructing AdminStateMachine');
        this.state = {
            variables: defaultAdminData,
            isTestMode: true,
            isRunning: false,
            activeRowId: null,
            lastUpdated: new Date().toISOString(),
            currentIndex: 0
        };
        this.listeners = new Set();
        console.log('AdminStateMachine constructed with', this.state.variables.length, 'variables');
    }
    getState() {
        return this.state;
    }
    subscribe(listener) {
        console.log('New listener subscribed to AdminStateMachine');
        this.listeners.add(listener);
        return () => {
            console.log('Listener unsubscribed from AdminStateMachine');
            this.listeners.delete(listener);
        };
    }
    notify() {
        console.log('Notifying listeners of state change');
        this.listeners.forEach(listener => listener(this.state));
    }
    clearUpdateTimeout() {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }
    }
    dispatch(action) {
        console.log('Dispatching action:', action.type, action);
        switch (action.type) {
            case 'INITIALIZE':
                console.log('Initializing state machine');
                this.state = Object.assign(Object.assign({}, this.state), { isTestMode: true, isRunning: false, activeRowId: null, lastUpdated: 'Not started', currentIndex: 0 });
                break;
            case 'SET_TEST_MODE':
                console.log('Setting test mode:', action.payload);
                this.clearUpdateTimeout();
                this.isExecuting = false; // Reset execution state
                this.state = Object.assign(Object.assign({}, this.state), { isTestMode: action.payload, isRunning: false, activeRowId: null, lastUpdated: `Switched to ${action.payload ? 'test' : 'production'} mode` });
                // Automatically restart updates after mode switch
                setTimeout(() => {
                    if (this.state.variables.length > 0) {
                        this.toggleRunning(true);
                    }
                }, 100);
                break;
            case 'SET_RUNNING':
                console.log('Setting running state:', action.payload);
                if (!action.payload) {
                    // Stopping the updates
                    this.clearUpdateTimeout();
                    this.isExecuting = false;
                    this.state = Object.assign(Object.assign({}, this.state), { isRunning: false, activeRowId: null, lastUpdated: 'Updates stopped' });
                }
                else {
                    // Starting the updates
                    this.isExecuting = false; // Reset execution state
                    this.state = Object.assign(Object.assign({}, this.state), { isRunning: true, lastUpdated: 'Starting updates...' });
                    this.startUpdateLoop();
                }
                break;
            case 'SET_ACTIVE_ROW':
                console.log('Setting active row:', action.payload);
                this.state = Object.assign(Object.assign({}, this.state), { activeRowId: action.payload });
                break;
            case 'UPDATE_VARIABLE':
                console.log('Updating variable:', action.payload.id, 'with value:', action.payload.value);
                const variable = this.state.variables.find(v => v.id === action.payload.id);
                if (!variable && action.payload.id !== 'system_error') {
                    console.error('Variable not found:', action.payload.id);
                    return;
                }
                this.state = Object.assign(Object.assign({}, this.state), { variables: this.state.variables.map(v => {
                        if (v.id === action.payload.id) {
                            return action.payload;
                        }
                        return v;
                    }) });
                break;
            case 'SET_VARIABLES':
                console.log('Updating variables:', action.payload);
                this.state = Object.assign(Object.assign({}, this.state), { variables: action.payload });
                break;
            case 'SET_LAST_UPDATED':
                console.log('Setting last updated:', action.payload);
                this.state = Object.assign(Object.assign({}, this.state), { lastUpdated: action.payload });
                break;
            case 'SET_CURRENT_INDEX':
                console.log('Setting current index:', action.payload);
                this.state = Object.assign(Object.assign({}, this.state), { currentIndex: action.payload });
                break;
        }
        this.notify();
    }
    initialize() {
        console.log('Initializing admin state machine');
        this.dispatch({ type: 'INITIALIZE' });
        this.clearUpdateTimeout();
        this.isExecuting = false;
    }
    toggleTestMode(isTestMode) {
        console.log('Toggling test mode:', isTestMode);
        this.dispatch({ type: 'SET_TEST_MODE', payload: isTestMode });
    }
    toggleRunning(isRunning) {
        console.log('Toggling running state:', isRunning);
        this.dispatch({ type: 'SET_RUNNING', payload: isRunning });
        if (isRunning) {
            console.log('Starting update loop');
            this.startUpdateLoop();
        }
        else {
            console.log('Clearing update timeout');
            this.clearUpdateTimeout();
        }
    }
    startUpdateLoop() {
        console.log('Starting update loop');
        // Clear any existing timeout
        this.clearUpdateTimeout();
        this.isExecuting = false;
        const scheduleNext = () => {
            if (this.state.isRunning) {
                console.log('Scheduling next update');
                if (this.updateTimeout) {
                    clearTimeout(this.updateTimeout);
                }
                this.updateTimeout = setTimeout(executeUpdate, this.updateInterval);
            }
            else {
                console.log('Not scheduling next update - not running');
            }
        };
        const executeUpdate = () => __awaiter(this, void 0, void 0, function* () {
            console.log('Execute update called. Running:', this.state.isRunning, 'Executing:', this.isExecuting);
            if (!this.state.isRunning) {
                console.log('Not running, stopping updates');
                return;
            }
            if (this.isExecuting) {
                console.log('Already executing, scheduling next update');
                scheduleNext();
                return;
            }
            // Get all variables that have SQL expressions
            const updatableVariables = this.state.variables.filter(v => {
                const hasSqlExpression = this.state.isTestMode ?
                    Boolean(v.testSqlExpression) :
                    Boolean(v.sqlExpression);
                console.log('Variable', v.id, 'has SQL expression:', hasSqlExpression);
                return hasSqlExpression && v.id !== 'system_error';
            });
            console.log('Found', updatableVariables.length, 'updatable variables');
            if (updatableVariables.length === 0) {
                console.log('No updatable variables found');
                scheduleNext();
                return;
            }
            this.isExecuting = true;
            try {
                // Use the filtered list for the current index
                const currentIndex = this.state.currentIndex % updatableVariables.length;
                const currentVariable = updatableVariables[currentIndex];
                if (!currentVariable) {
                    console.error('No variable found at index:', currentIndex);
                    this.isExecuting = false;
                    scheduleNext();
                    return;
                }
                // Find the actual index in the full variables array
                const fullIndex = this.state.variables.findIndex(v => v.id === currentVariable.id);
                console.log('Processing variable:', currentVariable.id, 'at index:', fullIndex);
                // Set active row using the full index
                this.dispatch({
                    type: 'SET_ACTIVE_ROW',
                    payload: fullIndex
                });
                // Update status
                this.dispatch({
                    type: 'SET_LAST_UPDATED',
                    payload: `Updating ${currentVariable.name}...`
                });
                // Execute the query based on mode
                console.log('Executing query for:', currentVariable.id);
                const value = this.state.isTestMode
                    ? yield executeTestQuery(currentVariable)
                    : yield executeProductionQuery(currentVariable);
                console.log('Query result for', currentVariable.id, ':', value);
                // Ensure minimum display time for visual feedback
                yield new Promise(resolve => setTimeout(resolve, this.minDisplayTime));
                // Update the variable with the new value
                const updatedVariable = Object.assign(Object.assign({}, currentVariable), { value: value });
                // Dispatch the updated variable
                this.dispatch({
                    type: 'UPDATE_VARIABLE',
                    payload: updatedVariable
                });
                // Move to next variable and wrap around if at the end
                const nextIndex = (currentIndex + 1) % updatableVariables.length;
                console.log('Moving to next index:', nextIndex);
                // Update current index
                this.dispatch({
                    type: 'SET_CURRENT_INDEX',
                    payload: nextIndex
                });
                // Update last updated time
                this.dispatch({
                    type: 'SET_LAST_UPDATED',
                    payload: `Last updated: ${new Date().toLocaleTimeString()}`
                });
            }
            catch (error) {
                console.error('Error executing query:', error);
                // Update the variable with the error
                this.dispatch({
                    type: 'UPDATE_VARIABLE',
                    payload: Object.assign(Object.assign({}, currentVariable), { error: error instanceof Error ? error.message : String(error) })
                });
            }
            finally {
                this.isExecuting = false;
                console.log('Update cycle completed');
                // Schedule next update
                scheduleNext();
            }
        });
        // Store executeUpdate in instance for potential external access
        this.executeUpdate = executeUpdate;
        // Start the first update
        console.log('Starting first update');
        executeUpdate();
    }
}
export const adminStateMachine = new AdminStateMachine();
