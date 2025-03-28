import { Button } from "@/components/ui/button";

interface ConnectionStatusProps {
  title: string;
  connected: string | boolean | null;
  onConnect: () => void;
  readonly?: boolean;
}

export function ConnectionStatus({
  title,
  connected,
  onConnect,
  readonly = false
}: ConnectionStatusProps) {
  // Convert the connected value to a boolean for display
  const isConnected = connected === true || connected === 'connected';
  
  return (
    <div className="flex items-center gap-2 p-4 border rounded-lg">
      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      {readonly ? (
        <span className="text-sm font-medium">
          {title} {isConnected ? 'Ready' : 'Not Available'}
        </span>
      ) : (
        <Button 
          variant={isConnected ? "outline" : "default"}
          onClick={onConnect}
          size="sm"
          className="flex-1"
        >
          {title} {isConnected ? 'Connected' : 'Connect'}
        </Button>
      )}
    </div>
  );
}
