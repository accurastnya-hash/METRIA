import { NextRequest, NextResponse } from 'next/server';
import { ALL_FIXTURES } from '@/lib/fixtures/pools';
import { buildVerificationReceipt } from '@/lib/receipts/generator';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ receiptId: string }> }
) {
  try {
    const { receiptId } = await context.params;

    // Search across fixtures for receipt ID match
    const matchingFixture = Object.values(ALL_FIXTURES).find(
      (f) => f.receiptId === receiptId
    );

    if (matchingFixture) {
      const receipt = buildVerificationReceipt(matchingFixture);
      return NextResponse.json({
        success: true,
        receipt,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RECEIPT_NOT_FOUND',
          message: `Verification receipt with ID '${receiptId}' not found.`,
        },
      },
      { status: 404 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown internal error';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RECEIPT_FETCH_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
