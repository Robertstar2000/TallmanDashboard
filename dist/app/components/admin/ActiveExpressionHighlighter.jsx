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
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
/**
 * Component to highlight the currently active expression in the admin interface
 */
export default function ActiveExpressionHighlighter() {
    const [activeExpression, setActiveExpression] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const router = useRouter();
    // Poll for active expression updates
    useEffect(() => {
        const fetchActiveExpression = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/admin/active-expression');
                if (response.ok) {
                    const data = yield response.json();
                    setActiveExpression(data);
                }
                else {
                    console.error('Failed to fetch active expression:', response.statusText);
                    setActiveExpression(null);
                }
            }
            catch (error) {
                console.error('Error fetching active expression:', error);
                setActiveExpression(null);
            }
        });
        // Initial fetch
        fetchActiveExpression();
        // Set up polling interval (every 1 second)
        const intervalId = setInterval(() => {
            fetchActiveExpression();
            setLastRefresh(new Date());
        }, 1000);
        // Clean up on unmount
        return () => clearInterval(intervalId);
    }, []);
    // Function to scroll to the active row
    const scrollToActiveRow = () => {
        if (activeExpression === null || activeExpression === void 0 ? void 0 : activeExpression.id) {
            const rowElement = document.getElementById(`row-${activeExpression.id}`);
            if (rowElement) {
                rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };
    // Function to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-blue-100 border-blue-500';
            case 'executing':
                return 'bg-yellow-100 border-yellow-500';
            case 'completed':
                return 'bg-green-100 border-green-500';
            case 'failed':
                return 'bg-red-100 border-red-500';
            default:
                return 'bg-gray-100 border-gray-500';
        }
    };
    // If no active expression, don't render anything
    if (!activeExpression || !activeExpression.id) {
        return null;
    }
    const statusColorClass = getStatusColor(activeExpression.status);
    return (<div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg border-l-4 z-50 max-w-md transition-all duration-300 ease-in-out ${statusColorClass}`} style={{ opacity: 0.9 }}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">
            {activeExpression.status === 'active' && 'Active Expression'}
            {activeExpression.status === 'executing' && 'Executing Expression'}
            {activeExpression.status === 'completed' && 'Completed Expression'}
            {activeExpression.status === 'failed' && 'Failed Expression'}
          </h3>
          <button onClick={scrollToActiveRow} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
            Scroll to Row
          </button>
        </div>
        <div className="text-sm">
          <p><strong>Row ID:</strong> {activeExpression.id}</p>
          <p><strong>Status:</strong> {activeExpression.status}</p>
          <p><strong>Last Updated:</strong> {new Date(activeExpression.timestamp).toLocaleTimeString()}</p>
        </div>
      </div>
    </div>);
}
