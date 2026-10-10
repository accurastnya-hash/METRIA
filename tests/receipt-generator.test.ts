import { describe, it, expect } from 'vitest';
import {
  generateCanonicalHash,
  buildVerificationReceipt,
  formatHumanReadableReport,
  verifyReceiptIntegrity,
} from '../src/lib/receipts/generator';
import { FIXTURE_GRADUATED_DAMM_V2 } from '../src/lib/fixtures/pools';
import { VerificationStatus } from '../src/lib/meteora/constants';
import type { VerificationReceiptPayload } from '../src/lib/verification/types';

describe('Receipt Generation & Cryptographic Hashing', () => {
  it('generates deterministic SHA-256 hash regardless of claims order', () => {
    const claimsA = [
      { id: 'CLAIM_A', status: 'VERIFIED', value: true },
      { id: 'CLAIM_B', status: 'VERIFIED', value: 'OK' },
    ];

    const claimsB = [
      { id: 'CLAIM_B', status: 'VERIFIED', value: 'OK' },
      { id: 'CLAIM_A', status: 'VERIFIED', value: true },
    ];

    const hash1 = generateCanonicalHash({
      cluster: 'mainnet-beta',
      inputAddress: 'Addr1',
      resolvedPoolAddress: 'Pool1',
      status: 'VERIFIED',
      stage: 'RECONCILED',
      claims: claimsA,
    });

    const hash2 = generateCanonicalHash({
      cluster: 'mainnet-beta',
      inputAddress: 'Addr1',
      resolvedPoolAddress: 'Pool1',
      status: 'VERIFIED',
      stage: 'RECONCILED',
      claims: claimsB,
    });

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // standard sha256 hex length
  });

  it('builds exportable VerificationReceiptPayload with canonical fields', () => {
    const receipt = buildVerificationReceipt(FIXTURE_GRADUATED_DAMM_V2);
    expect(receipt.receiptId).toBe(FIXTURE_GRADUATED_DAMM_V2.receiptId);
    expect(receipt.canonicalHash).toBe(FIXTURE_GRADUATED_DAMM_V2.canonicalHash);
    expect(receipt.dbcPool.isMigrated).toBe(true);
    expect(receipt.destinationPool.address).toBe('E7BqN81J3K2y97wA7Cvh3nQoPjLw5b7vG8p21nFwM2aD');
    expect(receipt.destinationPool.isLocked).toBe('LOCKED');
  });

  it('formats human readable report containing METRIA independent disclosure', () => {
    const report = formatHumanReadableReport(FIXTURE_GRADUATED_DAMM_V2);
    expect(report).toContain('METRIA VERIFICATION RECEIPT');
    expect(report).toContain('METRIA is an independent builder project for the Meteora ecosystem');
    expect(report).toContain('Point-in-time observation does not guarantee future solvency');
    expect(report).toContain(FIXTURE_GRADUATED_DAMM_V2.receiptId);
  });

  it('validates receipt integrity and detects unauthorized claim tampering', () => {
    const validReceipt = buildVerificationReceipt(FIXTURE_GRADUATED_DAMM_V2);

    // 1. Valid receipt check
    const validCheck = verifyReceiptIntegrity(validReceipt);
    expect(validCheck.isValid).toBe(true);

    // 2. Tampered status check
    const tamperedReceipt = {
      ...validReceipt,
      status: VerificationStatus.DISCREPANCY, // unauthorized status alteration
    };
    const tamperedCheck = verifyReceiptIntegrity(tamperedReceipt);
    expect(tamperedCheck.isValid).toBe(false);

    // 3. Tampered claim check
    const tamperedClaimReceipt = {
      ...validReceipt,
      claimsSummary: validReceipt.claimsSummary.map((c) =>
        c.claimId === 'CLAIM_POOL_OWNERSHIP' ? { ...c, status: VerificationStatus.DISCREPANCY } : c
      ),
    };
    const tamperedClaimCheck = verifyReceiptIntegrity(tamperedClaimReceipt);
    expect(tamperedClaimCheck.isValid).toBe(false);
  });

  it('covers migration transaction proof data in the deterministic receipt hash', () => {
    const proof = {
      originPool: 'origin', baseDecimals: 6, quoteDecimals: 9,
      status: 'VERIFIED' as const, scannedSignatures: 2, historyExhausted: false, limit: 50,
      failedMigrationSignatures: [], transactionSignature: 'signature', transactionSlot: 7,
      transactionTimestamp: '2026-01-01T00:00:00.000Z', transactionError: null,
      transactionConfirmed: true,
      instruction: 'migrationDammV2', destinationAddress: 'destination', derivedDestinationAddress: 'destination',
      dammConfigAddress: 'config', dammConfigOwner: 'damm', dammConfigDecoded: true,
      destinationOwner: 'damm', destinationDecoded: true, baseMint: 'base', quoteMint: 'quote',
      destinationBaseVault: 'base-vault', destinationQuoteVault: 'quote-vault',
      baseVaultDeltaRaw: '10 out / 10 in', quoteVaultDeltaRaw: '20 out / 20 in',
      assetFlowEvaluated: true, assetFlowReconciled: true, reasons: [],
    };
    const claims = FIXTURE_GRADUATED_DAMM_V2.claims.map((claim) => ({ id: claim.id, status: claim.status, value: claim.value }));
    const migrationClaims: NonNullable<VerificationReceiptPayload['migrationClaims']> = [];
    const destinationPool = {
      address: FIXTURE_GRADUATED_DAMM_V2.destinationState?.poolAddress ?? null,
      programId: FIXTURE_GRADUATED_DAMM_V2.destinationState?.programId ?? null,
      lpSupply: FIXTURE_GRADUATED_DAMM_V2.destinationState?.lpSupply ?? null,
      isLocked: FIXTURE_GRADUATED_DAMM_V2.destinationState?.lpLockedStatus ?? null,
      token0Mint: FIXTURE_GRADUATED_DAMM_V2.destinationState?.token0Mint ?? null,
      token1Mint: FIXTURE_GRADUATED_DAMM_V2.destinationState?.token1Mint ?? null,
      token0Vault: FIXTURE_GRADUATED_DAMM_V2.destinationState?.token0Vault ?? null,
      token1Vault: FIXTURE_GRADUATED_DAMM_V2.destinationState?.token1Vault ?? null,
      token0CurrentBalance: FIXTURE_GRADUATED_DAMM_V2.destinationState?.token0Balance ?? null,
      token1CurrentBalance: FIXTURE_GRADUATED_DAMM_V2.destinationState?.token1Balance ?? null,
      token0CurrentBalanceRaw: FIXTURE_GRADUATED_DAMM_V2.destinationState?.token0BalanceRaw ?? null,
      token1CurrentBalanceRaw: FIXTURE_GRADUATED_DAMM_V2.destinationState?.token1BalanceRaw ?? null,
      token0Decimals: FIXTURE_GRADUATED_DAMM_V2.destinationState?.token0Decimals ?? null,
      token1Decimals: FIXTURE_GRADUATED_DAMM_V2.destinationState?.token1Decimals ?? null,
    };
    const dbcPool = {
      address: FIXTURE_GRADUATED_DAMM_V2.dbcState.poolAddress,
      programId: FIXTURE_GRADUATED_DAMM_V2.dbcState.programId,
      configAddress: FIXTURE_GRADUATED_DAMM_V2.dbcState.configAddress,
      baseMint: FIXTURE_GRADUATED_DAMM_V2.dbcState.baseMint.address,
      quoteMint: FIXTURE_GRADUATED_DAMM_V2.dbcState.quoteMint.address,
      baseDecimals: FIXTURE_GRADUATED_DAMM_V2.dbcState.baseMint.decimals,
      quoteDecimals: FIXTURE_GRADUATED_DAMM_V2.dbcState.quoteMint.decimals,
      migrationOption: FIXTURE_GRADUATED_DAMM_V2.dbcState.migrationOptionLabel,
      migrationThreshold: FIXTURE_GRADUATED_DAMM_V2.dbcState.migrationThresholdFormatted,
      isMigrated: FIXTURE_GRADUATED_DAMM_V2.dbcState.isMigrated,
    };
    const hash = generateCanonicalHash({
      cluster: FIXTURE_GRADUATED_DAMM_V2.cluster,
      inputAddress: FIXTURE_GRADUATED_DAMM_V2.inputAddress,
      resolvedPoolAddress: FIXTURE_GRADUATED_DAMM_V2.resolvedPoolAddress,
      status: FIXTURE_GRADUATED_DAMM_V2.status,
      stage: FIXTURE_GRADUATED_DAMM_V2.stage,
      claims,
      migrationProof: proof,
      migrationClaims,
      destinationPool,
      dbcPool,
    });
    const result = { ...FIXTURE_GRADUATED_DAMM_V2, canonicalHash: hash, migrationProof: proof, migrationClaims };
    const receipt = buildVerificationReceipt(result);
    expect(verifyReceiptIntegrity(receipt).isValid).toBe(true);
    expect(receipt.evidenceSignatures).toContain('signature');
    const changedVaultReceipt = { ...receipt, destinationPool: { ...receipt.destinationPool, token0CurrentBalance: 'tampered' } };
    expect(verifyReceiptIntegrity(changedVaultReceipt).isValid).toBe(false);
    receipt.migrationProof!.transactionSignature = 'tampered';
    expect(verifyReceiptIntegrity(receipt).isValid).toBe(false);
  });
});
