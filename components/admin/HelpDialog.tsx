'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from 'next/image';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define a type for documentation files
type DocFile = {
  name: string;
  path: string;
  type: 'md' | 'txt' | 'image';
};

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const [selectedFile, setSelectedFile] = useState<DocFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [showFileContent, setShowFileContent] = useState(false);

  // List of documentation files to show in the help dialog
  const docFiles: DocFile[] = [
    { name: 'README', path: '/README.md', type: 'md' },
    { name: 'Dashboard Data Flow', path: '/dashboard-data-flow.md', type: 'md' },
    { name: 'SQL Execution Fix', path: '/SQL-EXECUTION-FIX.md', type: 'md' },
    { name: 'Schema Query Reference', path: '/README-schema-queries.md', type: 'md' },
    { name: 'SQLite Schema', path: '/SQLiteSchema.md', type: 'md' },
    { name: 'P21 Tables', path: '/P21Tables.md', type: 'md' },
    { name: 'POR Tables', path: '/PORTables.md', type: 'md' },
    { name: 'POR Integration Guide', path: '/POR-INTEGRATION-GUIDE.md', type: 'md' },
    { name: 'POR MDB Query Guide', path: '/POR-MDB-Query-Guide.md', type: 'md' },
    { name: 'POR Queries Documentation', path: '/POR-QUERIES-DOCUMENTATION.md', type: 'md' },
    { name: 'Connection Manager Docs', path: '/connection-manager-docs.md', type: 'md' },
    { name: 'DB Tables', path: '/DBTables.txt', type: 'txt' },
    { name: 'Dashboard SQL Expressions', path: '/DashboardSQLexpressions.txt', type: 'txt' },
    { name: 'Database Structure', path: '/database-structure.txt', type: 'txt' },
    { name: 'Data Flow Diagram', path: '/data-flow-diagram.svg', type: 'image' }
  ];

  // Function to fetch and display file content
  const handleFileSelect = async (file: DocFile) => {
    setSelectedFile(file);
    
    if (file.type === 'image') {
      setShowFileContent(true);
      return;
    }
    
    try {
      const response = await fetch(`/api/docs?path=${encodeURIComponent(file.path)}`);
      if (response.ok) {
        const content = await response.text();
        setFileContent(content);
        setShowFileContent(true);
      } else {
        setFileContent('Error loading file content');
        setShowFileContent(true);
      }
    } catch (error) {
      setFileContent('Error loading file content');
      setShowFileContent(true);
    }
  };

  // Function to go back to file selection
  const handleBackToFileList = () => {
    setShowFileContent(false);
    setSelectedFile(null);
    setFileContent('');
  };

  // Reset state when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when dialog is closed
      setShowFileContent(false);
      setSelectedFile(null);
      setFileContent('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Documentation</DialogTitle>
          <DialogDescription>
            {showFileContent ? `Viewing: ${selectedFile?.name}` : 'Select a documentation file to view'}
          </DialogDescription>
        </DialogHeader>

        {!showFileContent ? (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {docFiles.map((file) => (
              <Card 
                key={file.path} 
                className="p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handleFileSelect(file)}
              >
                <div className="text-center">
                  {file.type === 'md' && <span className="text-blue-500 text-2xl">📄</span>}
                  {file.type === 'txt' && <span className="text-green-500 text-2xl">📝</span>}
                  {file.type === 'image' && <span className="text-purple-500 text-2xl">🖼️</span>}
                  <p className="mt-2 font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{file.type.toUpperCase()}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={handleBackToFileList}
              className="mb-4"
            >
              ← Back to Documentation Menu
            </Button>
            
            <div className="border rounded-md p-4 bg-gray-50">
              {selectedFile?.type === 'image' ? (
                <div className="flex justify-center">
                  {selectedFile.path.endsWith('.svg') ? (
                    <div className="w-full h-[600px] overflow-auto bg-white p-4 rounded-md">
                      <iframe 
                        src={selectedFile.path} 
                        width="100%" 
                        height="100%" 
                        className="border-0"
                        title="Data Flow Diagram"
                      />
                    </div>
                  ) : (
                    <Image 
                      src={selectedFile.path} 
                      alt="Documentation Image" 
                      width={700} 
                      height={500} 
                      className="object-contain"
                    />
                  )}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[60vh]">
                  {fileContent}
                </pre>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
