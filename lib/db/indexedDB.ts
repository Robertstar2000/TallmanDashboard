'use client';

import { initialData } from './initial-data';
import type { AdminVariable } from '@/lib/types/dashboard';

const DB_NAME = 'dashboardDB';
const DB_VERSION = 2;
const STORE_NAME = 'variables';

export type { AdminVariable };

let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function initializeDatabase(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // Clear existing data
  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  // Add initial data
  for (const item of initialData) {
    await new Promise<void>((resolve, reject) => {
      const addRequest = store.add(item);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllVariables(): Promise<AdminVariable[]> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const variables = request.result;
      if (variables.length === 0) {
        initializeDatabase().then(() => {
          getAllVariables().then(resolve).catch(reject);
        }).catch(reject);
      } else {
        resolve(variables);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function updateVariable(id: number, field: string, value: string): Promise<boolean> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (!item) {
        resolve(false);
        return;
      }

      // Update the appropriate field based on the variable type
      if (field === 'value') {
        if ('p21' in item) item.p21 = value;
        else if ('inventory' in item) item.inventory = value;
        else if ('total' in item) item.total = value;
        else if ('new' in item) item.new = value;
        else if ('columbus' in item) item.columbus = value;
        else if ('value' in item) item.value = value;
      } else {
        // Update any other field directly
        (item as any)[field] = value;
      }

      const updateRequest = store.put(item);
      updateRequest.onsuccess = () => resolve(true);
      updateRequest.onerror = () => reject(updateRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function getVariablesByGroup(group: string): Promise<AdminVariable[]> {
  const allVariables = await getAllVariables();
  return allVariables.filter(v => v.chartGroup === group);
}

export async function resetDatabase(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    // Clear existing data
    const clearRequest = store.clear();
    
    clearRequest.onerror = () => {
      reject(clearRequest.error);
    };

    clearRequest.onsuccess = () => {
      // Add all initial data in one transaction
      try {
        initialData.forEach(item => {
          store.add(item);
        });
      } catch (error) {
        reject(error);
        return;
      }

      // Wait for transaction to complete
      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(tx.error);
      };
    };
  });
}

// Initialize the database when this module loads
if (typeof window !== 'undefined') {
  getDB().then(async (db) => {
    // Check if we need to initialize
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const countRequest = store.count();
    
    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        // Only initialize if empty
        resetDatabase().catch(console.error);
      }
    };
  }).catch(console.error);
}
