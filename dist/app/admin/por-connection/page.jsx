'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MSAccessConnectionDialog from '@/components/admin/MSAccessConnectionDialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function PORConnectionPage() {
    return (<div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">POR Database Connection</h1>
        <Link href="/admin" passHref>
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <MSAccessConnectionDialog />
        
        <Card>
          <CardHeader>
            <CardTitle>Connection Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              To connect to the POR database, you need to provide the full path to your POR.MDB file.
            </p>
            <p className="mb-4">
              Example: <code>C:\Users\BobM\Desktop\POR.MDB</code>
            </p>
            <p className="mb-4">
              Make sure to include the filename with the .MDB extension.
            </p>
            <p>
              Once connected, the dashboard will be able to read data from your POR database.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>);
}
