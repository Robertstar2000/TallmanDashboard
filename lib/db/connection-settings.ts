'use client';

import { DatabaseConnection } from '@/lib/types/dashboard';

export interface StoredConnectionSettings {
  id: string;
  settings: DatabaseConnection;
  lastUpdated: string;
}

export async function saveConnectionSettings(type: 'p21' | 'por', settings: DatabaseConnection): Promise<void> {
  try {
    const response = await fetch('/api/connection-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: type,
        settings,
        lastUpdated: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save connection settings');
    }
  } catch (error) {
    console.error('Error saving connection settings:', error);
    throw error;
  }
}

export async function getConnectionSettings(type: 'p21' | 'por'): Promise<DatabaseConnection | null> {
  try {
    const response = await fetch(`/api/connection-settings/${type}`);
    if (!response.ok) {
      return null;
    }
    const data: StoredConnectionSettings = await response.json();
    return data.settings;
  } catch (error) {
    console.error('Error getting connection settings:', error);
    return null;
  }
}
