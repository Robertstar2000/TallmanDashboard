'use client';
import React from 'react';
/**
 * Spinner component for loading states
 */
export default function Spinner({ size = 'medium', color = 'primary', className = '' }) {
    // Size mappings
    const sizeMap = {
        small: 'h-4 w-4 border-2',
        medium: 'h-6 w-6 border-2',
        large: 'h-8 w-8 border-3',
    };
    // Color mappings
    const colorMap = {
        primary: 'border-blue-600 border-t-transparent',
        secondary: 'border-gray-600 border-t-transparent',
        white: 'border-white border-t-transparent',
    };
    return (<div className={`inline-block ${className}`} role="status" aria-label="Loading">
      <div className={`animate-spin rounded-full ${sizeMap[size]} ${colorMap[color]}`}/>
      <span className="sr-only">Loading...</span>
    </div>);
}
