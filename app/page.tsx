'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="bg-white shadow-sm border-b mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Tallman Dashboard - Test Mode</h1>
            <nav className="flex space-x-4">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">React Test</h2>
          <p className="mb-4">Count: {count}</p>
          <button 
            onClick={() => setCount(count + 1)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Increment
          </button>
          <div className="mt-4">
            <p className="text-green-600">✅ React hooks are working correctly!</p>
            <p className="text-sm text-gray-600 mt-2">
              If you can see this page and the button works, React is functioning properly.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}