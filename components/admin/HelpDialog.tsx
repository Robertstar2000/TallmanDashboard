'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Help</DialogTitle>
          <DialogDescription>
            Guide to using the Dashboard and Admin Interface
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h3 className="font-semibold mb-2">Admin Page Controls</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Top Bar Controls</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Run Button:</strong> Start/stop automatic data refresh</li>
                  <li><strong>Reset Button:</strong> Reset all changes back to initial state</li>
                  <li><strong>Refresh Button:</strong> Manually refresh current data</li>
                  <li><strong>Save Button:</strong> Save current changes to the database</li>
                  <li><strong>Connect Button:</strong> Open database connection dialog</li>
                  <li><strong>Real-time Toggle:</strong> Switch between test data and live database data</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Spreadsheet Fields</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Name:</strong> Display name of the metric or chart</li>
                  <li><strong>Chart Group:</strong> Category grouping for the dashboard</li>
                  <li><strong>Calculation:</strong> Type of calculation (COUNT, SUM, etc.)</li>
                  <li><strong>SQL Expression:</strong> Query used to fetch real-time data</li>
                  <li><strong>P21 Data Dictionary:</strong> Database schema reference for P21</li>
                  <li><strong>Value:</strong> Current value of the metric</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Dashboard Features</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Metrics Section:</strong> Shows key performance indicators and metrics</li>
              <li><strong>Charts Section:</strong> Visual representations of data trends</li>
              <li><strong>Real-time Updates:</strong> Data refreshes automatically when running in real-time mode</li>
              <li><strong>Test Mode:</strong> Use sample data for testing and development</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Database Connections</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>P21 Connection:</strong> Connect to P21 database for live data</li>
              <li><strong>Test Mode:</strong> Uses local test data without database connection</li>
              <li><strong>Connection Status:</strong> Shown in top bar when connected</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Tips</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use test mode for initial setup and validation</li>
              <li>Save changes before switching between real-time and test modes</li>
              <li>Check connection status before running real-time queries</li>
              <li>Use the refresh button to manually update data if needed</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
