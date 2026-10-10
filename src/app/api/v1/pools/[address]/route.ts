import { NextRequest, NextResponse } from 'next/server';
import { verifyAddress } from '@/lib/verification/engine';
import { parseVerificationQuery } from '@/lib/api/schemas';
import { METEORA_PROGRAMS } from '@/lib/meteora/constants';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await context.params;
    const { searchParams } = new URL(request.url);

    const queryParse = parseVerificationQuery(searchParams);
    if (!queryParse.success) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_QUERY', message: 'Unsupported query parameters.', details: queryParse.error.flatten() } }, { status: 400 });
    }

    const result = await verifyAddress(address, queryParse.data.cluster);
    if (result.dbcState.poolAddress === 'N/A' || result.dbcState.programId !== METEORA_PROGRAMS.DBC_PROGRAM_ID) {
      return NextResponse.json({ success: false, error: { code: 'DBC_POOL_NOT_VERIFIED', message: result.statusSummary } }, { status: 422 });
    }

    return NextResponse.json(
      {
        success: true,
        pool: {
          address: result.dbcState.poolAddress,
          cluster: result.cluster,
          baseMint: result.dbcState.baseMint,
          quoteMint: result.dbcState.quoteMint,
          migrationOption: result.dbcState.migrationOptionLabel,
          migrationThreshold: result.dbcState.migrationThresholdFormatted,
          realBaseReserves: result.dbcState.realBaseReserves,
          realQuoteReserves: result.dbcState.realQuoteReserves,
          progressPercentage: result.dbcState.progressPercentage,
          isMigrated: result.dbcState.isMigrated,
          migrationTargetAddress: result.dbcState.migrationTargetAddress,
          lifecycleStage: result.stage,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown internal error';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'POOL_FETCH_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
