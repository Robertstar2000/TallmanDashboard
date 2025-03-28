'use client';

import { Suspense } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Import the client component dynamically to prevent server-side bundling
const DashboardClient = dynamic(
  () => import('@/components/DashboardClient'),
  {
    ssr: false,
    loading: () => <div>Loading dashboard...</div>
  }
);

// Define types for ErrorBoundary props
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

// Define type for ErrorBoundary state
interface ErrorBoundaryState {
  hasError: boolean;
}

// Simple error boundary component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Dashboard error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function HomePage() {
  const router = useRouter();
  
  const handleNavigateToAdmin = () => {
    // Navigate to admin page without stopping the background worker
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tallman Dashboard</h1>
          <Button 
            variant="outline" 
            onClick={handleNavigateToAdmin}
            className="z-50 relative"  // Ensure button is always on top
          >
            Admin
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading dashboard...</div>}>
          <ErrorBoundary fallback={
            <div className="p-4">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>Error loading dashboard. Please use the Admin button to configure the dashboard.</p>
              </div>
            </div>
          }>
            <DashboardClient />
          </ErrorBoundary>
        </Suspense>
      </main>
    </div>
  );
}