import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DatabaseStatus } from '@/lib/db/types';

interface DatabaseStatusDisplayProps {
  statuses: DatabaseStatus[];
}

const StatusIndicator = ({ status }: { status: 'connected' | 'disconnected' | 'error' | 'pending' }) => {
  const color = status === 'connected' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-500' : 'bg-red-500';
  const text = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-sm">{text}</span>
    </div>
  );
};

export default function DatabaseStatusDisplay({ statuses }: DatabaseStatusDisplayProps) {
  const getStatus = (name: string) => statuses.find(s => s.serverName === name);

  const p21Status = getStatus('P21');
  const porStatus = getStatus('POR');
  const sqliteStatus = getStatus('SQLite');

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-medium mb-4">Connection Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* P21 Status */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">P21 Database</h4>
          <div className="space-y-1 mb-4">
            <p className="text-sm text-gray-500">DSN: {p21Status?.details?.dsn || 'N/A'}</p>
          </div>
          <StatusIndicator status={p21Status?.status || 'disconnected'} />
        </div>

        {/* POR Status */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">POR Database (MS Access)</h4>
          <div className="space-y-1 mb-4">
            <p className="text-sm text-gray-500 truncate">Path: {porStatus?.details?.filePath || 'N/A'}</p>
          </div>
          <StatusIndicator status={porStatus?.status || 'disconnected'} />
        </div>

        {/* SQLite Status */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Local Database</h4>
          <div className="space-y-1 mb-4">
            <p className="text-sm text-gray-500">Type: SQLite</p>
            <p className="text-sm text-gray-500">Location: {sqliteStatus?.details?.filePath || './data/dashboard.db'}</p>
          </div>
          <StatusIndicator status={sqliteStatus?.status || 'disconnected'} />
        </div>
      </div>
    </Card>
  );
}
