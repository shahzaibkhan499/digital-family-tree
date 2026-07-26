import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Digital Family Tree API',
    version: '0.1.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
    },
    timestamp: new Date().toISOString(),
  });
}
