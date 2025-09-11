import { NextRequest, NextResponse } from 'next/server';
import { ConnectionDetails } from '@/lib/db/types';

// Placeholder default configurations
const defaultP21Config: Partial<ConnectionDetails> = {
  type: 'P21',
  dsn: process.env.DEFAULT_P21_DSN || 'P21Prod', // Example: Read from env var or use fallback
  database: process.env.DEFAULT_P21_DB || 'P21', 
  user: process.env.DEFAULT_P21_USER || 'sa', 
  // Avoid storing default passwords directly in code if possible
  // password: process.env.DEFAULT_P21_PASSWORD || '', 
};

const defaultPorConfig: Partial<ConnectionDetails> = {
  type: 'POR',
  filePath: process.env.DEFAULT_POR_PATH || 'C:\\path\\to\\default\\POR.mdb', // Example
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serverType = searchParams.get('serverType');

  if (!serverType) {
    return NextResponse.json({ error: 'Missing serverType query parameter' }, { status: 400 });
  }

  let defaultConfig: Partial<ConnectionDetails> | null = null;

  if (serverType === 'P21') {
    defaultConfig = defaultP21Config;
  } else if (serverType === 'POR') {
    defaultConfig = defaultPorConfig;
  } else {
    return NextResponse.json({ error: 'Invalid serverType specified' }, { status: 400 });
  }

  if (!defaultConfig) {
     return NextResponse.json({ error: 'Could not determine default config' }, { status: 500 });
  }

  return NextResponse.json(defaultConfig);
}
