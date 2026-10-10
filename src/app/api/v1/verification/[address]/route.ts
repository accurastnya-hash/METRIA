import { NextRequest, NextResponse } from 'next/server';
import { verifyAddress } from '@/lib/verification/engine';
import { parseVerificationQuery } from '@/lib/api/schemas';
import { buildVerificationReceipt } from '@/lib/receipts/generator';

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
    const receipt = buildVerificationReceipt(result);

    return NextResponse.json(
      {
        success: true,
        data: result,
        receipt,
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
          code: 'VERIFICATION_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
