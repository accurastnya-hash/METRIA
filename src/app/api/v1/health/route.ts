import { NextResponse } from 'next/server';
import { METHODOLOGY_VERSION, INDEPENDENT_DISCLOSURE } from '@/lib/meteora/constants';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'METRIA',
    tagline: 'Every launch. Every transition. Verified.',
    version: METHODOLOGY_VERSION,
    cluster: 'per-request',
    timestamp: new Date().toISOString(),
    disclosure: INDEPENDENT_DISCLOSURE,
  });
}
