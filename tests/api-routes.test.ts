import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as verificationGet } from '../src/app/api/v1/verification/[address]/route';
import { GET as poolsGet } from '../src/app/api/v1/pools/[address]/route';
import { GET as receiptGet } from '../src/app/api/v1/receipts/[receiptId]/route';
import { GET as healthGet } from '../src/app/api/v1/health/route';
import { FIXTURE_GRADUATED_DAMM_V2 } from '../src/lib/fixtures/pools';

const addressParams = (address: string) => Promise.resolve({ address });
const receiptParams = (receiptId: string) => Promise.resolve({ receiptId });

describe('API route behavior', () => {
  it('returns HTTP 400 for invalid cluster and unsupported query parameters', async () => {
    const response = await verificationGet(
      new NextRequest('http://localhost/api/v1/verification/foo?cluster=made-up'),
      { params: addressParams('foo') },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('INVALID_QUERY');
  });

  it('returns a simulated fixture only in the simulated cluster and marks it as simulation', async () => {
    const response = await verificationGet(
      new NextRequest(`http://localhost/api/v1/verification/${FIXTURE_GRADUATED_DAMM_V2.inputAddress}?cluster=simulated-fixture`),
      { params: addressParams(FIXTURE_GRADUATED_DAMM_V2.inputAddress) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.isSimulatedFixture).toBe(true);
    expect(body.data.cluster).toBe('simulated-fixture');
    expect(body.receipt.canonicalHash).not.toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('does not resolve unknown simulated addresses against a live RPC', async () => {
    const address = '11111111111111111111111111111111';
    const response = await verificationGet(
      new NextRequest(`http://localhost/api/v1/verification/${address}?cluster=simulated-fixture`),
      { params: addressParams(address) },
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.status).toBe('INSUFFICIENT_DATA');
    expect(body.data.statusSummary).toContain('never query a live RPC');
    expect(body.data.dbcState.programId).toBe('N/A');
    expect(body.data.dbcState.migrationOption).toBeNull();
    expect(body.data.dbcState.migrationThresholdFormatted).toBe('Unavailable');
    expect(body.data.dbcState.progressPercentage).toBeNull();
    expect(body.data.dbcState.isMigrated).toBeNull();
    expect(body.data.dbcState.isMigrated).toBeNull();
  });

  it('rejects an unverified address from the DBC pool endpoint', async () => {
    const address = '11111111111111111111111111111111';
    const response = await poolsGet(
      new NextRequest(`http://localhost/api/v1/pools/${address}?cluster=simulated-fixture`),
      { params: addressParams(address) },
    );
    expect(response.status).toBe(422);
  });

  it('documents receipt lookup as fixture-only in behavior and returns 404 for unknown/live IDs', async () => {
    const fixtureResponse = await receiptGet(
      new NextRequest(`http://localhost/api/v1/receipts/${FIXTURE_GRADUATED_DAMM_V2.receiptId}`),
      { params: receiptParams(FIXTURE_GRADUATED_DAMM_V2.receiptId) },
    );
    expect(fixtureResponse.status).toBe(200);
    const fixtureReceipt = (await fixtureResponse.json()).receipt;
    expect(fixtureReceipt.canonicalHash).toBe(FIXTURE_GRADUATED_DAMM_V2.canonicalHash);
    expect(fixtureReceipt.canonicalHash).not.toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

    const response = await receiptGet(
      new NextRequest('http://localhost/api/v1/receipts/live-receipt-not-persisted'),
      { params: receiptParams('live-receipt-not-persisted') },
    );
    expect(response.status).toBe(404);
  });

  it('returns liveness metadata without claiming an RPC check', async () => {
    const body = await (await healthGet()).json();
    expect(body.status).toBe('ok');
    expect(body.disclosure).toContain('independent');
  });
});
