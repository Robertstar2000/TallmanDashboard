export const dynamic = 'force-dynamic';

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/context/AuthContext';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tallman Dashboard',
  description: 'Dashboard for Tallman Equipment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
