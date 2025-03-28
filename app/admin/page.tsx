'use client';

import { useState } from 'react';
import { AdminClient } from './AdminClient';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryStatusStore } from '@/lib/stores/queryStatusStore';
import { HelpDialog } from '@/components/admin/HelpDialog';

export default function AdminPage() {
  const router = useRouter();
  const isRunning = useQueryStatusStore(state => state.isRunning);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  
  const handleNavigateToDashboard = () => {
    // Don't stop the worker when navigating to dashboard
    // Just navigate directly
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowHelpDialog(true)}
              className="bg-blue-50 hover:bg-blue-100"
            >
              HELP
            </Button>
            <Link href="/test-admin-query">
              <Button variant="outline">Test Queries</Button>
            </Link>
            <Button variant="outline" onClick={handleNavigateToDashboard}>
              Return to Dashboard
            </Button>
          </div>
        </div>
        
        <AdminClient />
        
        {/* Help Dialog */}
        <HelpDialog 
          open={showHelpDialog} 
          onOpenChange={setShowHelpDialog} 
        />
      </div>
    </div>
  );
}
