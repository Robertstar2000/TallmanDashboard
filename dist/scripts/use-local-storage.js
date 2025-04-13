import { useState, useEffect } from 'react';
/**
 * Custom hook for managing state in localStorage
 * @param key The key to store the value under in localStorage
 * @param initialValue The initial value to use if no value is found in localStorage
 * @returns A stateful value and a function to update it
 */
export function useLocalStorage(key, initialValue) {
    // State to store our value
    const [storedValue, setStoredValue] = useState(initialValue);
    // Initialize the state on mount
    useEffect(() => {
        try {
            // Get from local storage by key
            const item = window.localStorage.getItem(key);
            // Parse stored json or if none, return initialValue
            setStoredValue(item ? JSON.parse(item) : initialValue);
        }
        catch (error) {
            // If error, return initialValue
            console.error(`Error reading localStorage key "${key}":`, error);
            setStoredValue(initialValue);
        }
    }, [key, initialValue]);
    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage
    const setValue = (value) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            // Save state
            setStoredValue(valueToStore);
            // Save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        }
        catch (error) {
            // A more advanced implementation would handle the error case
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };
    return [storedValue, setValue];
}
