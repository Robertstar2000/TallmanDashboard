'use client';

import { DatabaseConnection, DatabaseConnections } from '@/lib/types/dashboard';

export interface StoredConnectionSettings {
  id: string;
  settings: DatabaseConnection;
  lastUpdated: string;
}

export async function saveConnectionSettings(connections: DatabaseConnections): Promise<void> {
  try {
    // Save P21 connection
    if (connections.p21) {
      const response = await fetch('/api/connection-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'p21',
          settings: connections.p21,
          lastUpdated: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save P21 connection settings');
      }
    }

    // Save POR connection
    if (connections.por) {
      const response = await fetch('/api/connection-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'por',
          settings: connections.por,
          lastUpdated: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save POR connection settings');
      }
    }
  } catch (error) {
    console.error('Error saving connection settings:', error);
    throw error;
  }
}

export async function getConnectionSettings(): Promise<DatabaseConnections | null> {
  try {
    const connections: DatabaseConnections = {
      p21: null,
      por: null
    };

    // Get P21 connection
    const p21Response = await fetch('/api/connection-settings/p21');
    if (p21Response.ok) {
      const p21Data: StoredConnectionSettings = await p21Response.json();
      connections.p21 = p21Data.settings;
    }

    // Get POR connection
    const porResponse = await fetch('/api/connection-settings/por');
    if (porResponse.ok) {
      const porData: StoredConnectionSettings = await porResponse.json();
      connections.por = porData.settings;
    }

    return connections;
  } catch (error) {
    console.error('Error getting connection settings:', error);
    return null;
  }
}
