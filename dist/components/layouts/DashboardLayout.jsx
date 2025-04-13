import { AdminButton } from '@/components/AdminButton';
export function DashboardLayout({ children }) {
    return (<div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 py-1">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-3xl font-bold text-red-600">Tallman Leadership Dashboard</h1>
          <AdminButton />
        </div>
        {children}
      </div>
    </div>);
}
