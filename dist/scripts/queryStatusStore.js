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
import { create } from 'zustand';
export const useQueryStatusStore = create((set, get) => {
    const initializeStore = () => {
        const pollingActive = localStorage.getItem('queryStatusPollingActive') === 'true';
        const pollingInterval = localStorage.getItem('queryStatusPollingInterval');
        if (pollingActive && pollingInterval) {
            set({
                isPolling: true,
                pollInterval: parseInt(pollingInterval),
                isRunning: true
            });
        }
        else {
            set({
                isPolling: false,
                pollInterval: null,
                isRunning: false
            });
        }
    };
    if (typeof window !== 'undefined') {
        initializeStore();
    }
    return {
        isPolling: false,
        pollInterval: null,
        activeRowId: null,
        isRunning: false,
        error: null,
        updatedData: [],
        startPolling: () => {
            // Don't start a new polling if already polling
            set((state) => {
                if (state.isPolling) {
                    console.log('Already polling, not starting a new poll');
                    return state;
                }
                console.log('Starting status polling');
                // Start the polling
                const interval = window.setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        console.log('Polling for query status...');
                        const statusResponse = yield fetch('/api/admin/run/status');
                        if (!statusResponse.ok) {
                            console.error('Failed to check query status:', statusResponse.statusText);
                            throw new Error('Failed to check query status');
                        }
                        const statusData = yield statusResponse.json();
                        console.log('Query status response:', statusData);
                        const { status, error, activeRow, updatedData } = statusData;
                        // Update the store state with all the data from the server
                        set(state => (Object.assign(Object.assign({}, state), { activeRowId: activeRow, error: error || null, updatedData: updatedData || [], isRunning: status === 'running' })));
                        if (status === 'error') {
                            console.error('Query execution error:', error);
                            set(state => (Object.assign(Object.assign({}, state), { isPolling: false, isRunning: false, pollInterval: null, activeRowId: null, error: error || 'Failed to run queries' })));
                            clearInterval(interval);
                            // Clear localStorage
                            if (typeof window !== 'undefined') {
                                localStorage.removeItem('queryStatusPollingActive');
                                localStorage.removeItem('queryStatusPollingInterval');
                            }
                        }
                        // Only stop polling if status is 'idle', not when 'complete'
                        // This allows the continuous execution to keep running
                        if (status === 'idle') {
                            console.log('Query execution idle, stopping polling');
                            set(state => (Object.assign(Object.assign({}, state), { isPolling: false, isRunning: false, pollInterval: null, activeRowId: null })));
                            clearInterval(interval);
                            // Clear localStorage
                            if (typeof window !== 'undefined') {
                                localStorage.removeItem('queryStatusPollingActive');
                                localStorage.removeItem('queryStatusPollingInterval');
                            }
                        }
                    }
                    catch (error) {
                        console.error('Error polling query status:', error);
                        // Don't stop polling on network errors, just log them
                        // This prevents the UI from getting stuck in a running state
                        // when there are temporary network issues
                    }
                }), 1000);
                // Store the interval ID in localStorage to persist across page navigations
                if (typeof window !== 'undefined') {
                    localStorage.setItem('queryStatusPollingActive', 'true');
                    localStorage.setItem('queryStatusPollingInterval', interval.toString());
                }
                return {
                    isPolling: true,
                    isRunning: true,
                    pollInterval: interval,
                    error: null
                };
            });
        },
        stopPolling: () => {
            set((state) => {
                console.log('Stopping status polling');
                if (state.pollInterval !== null) {
                    clearInterval(state.pollInterval);
                }
                // Clear the localStorage flags
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('queryStatusPollingActive');
                    localStorage.removeItem('queryStatusPollingInterval');
                }
                return {
                    isPolling: false,
                    pollInterval: null,
                    isRunning: false,
                    activeRowId: null
                };
            });
        },
        setActiveRowId: (id) => set({ activeRowId: id }),
        setIsRunning: (isRunning) => set({ isRunning }),
        setError: (error) => set({ error }),
        setUpdatedData: (updatedData) => set({ updatedData })
    };
});
