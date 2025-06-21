import { NextResponse } from 'next/server';

/**
 * Returns the P21 DSN and POR path values directly from environment variables.
 * This API route is intended for client-side components that need to display
 * these values (e.g., the Connection Status panel) without hard-coding them
 * or exposing other environment data.
 */
export async function GET() {
  return NextResponse.json({
    p21Dsn: process.env.P21_DSN ?? null,
    porPath: process.env.POR_PATH ?? null,
  });
}
