'use server';

import type { ServerConfig } from './server';

export interface ServerHealthResult {
  isConnected: boolean;
  error?: string;
  details?: any;
  config?: any;
}

export async function checkServerHealth(serverType: 'P21' | 'POR'): Promise<ServerHealthResult> {
  try {
    const response = await fetch('/api/admin/health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverType }),
    });

    const data = await response.json();
    return {
      isConnected: data.isConnected,
      error: data.error,
      details: data.details,
      config: data.config,
    };
  } catch (error) {
    return {
      isConnected: false,
      error: 'Failed to check server health',
    };
  }
}

export async function getServerConfig(serverType: 'P21' | 'POR'): Promise<ServerConfig | null> {
  try {
    const response = await fetch(`/api/connection-settings/${serverType}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch server config');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching server config:', error);
    return null;
  }
}

export async function updateServerConfig(serverType: 'P21' | 'POR', config: ServerConfig): Promise<boolean> {
  try {
    const response = await fetch(`/api/connection-settings/${serverType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to update server config');
    }

    return true;
  } catch (error) {
    console.error('Error updating server config:', error);
    return false;
  }
}
