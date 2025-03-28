import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import path from 'path';
import { initializeDatabase } from '@/lib/db/initialize-db';

// Simple endpoint to initialize the database with sample data
export async function POST() {
  try {
    console.log('Admin: Initializing database tables');
    
    // Define the database path
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    
    // Use the new simplified initialization function with the database path
    try {
      await initializeDatabase(dbPath);
      
      // Revalidate affected pages
      revalidatePath('/admin');
      revalidatePath('/');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database initialized successfully with sample data'
      });
    } catch (error) {
      console.error('Database initialization failed:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error during database initialization' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    let errorMessage = 'Failed to initialize database';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
