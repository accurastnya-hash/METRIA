import { describe, it, expect } from 'vitest';
import { evaluateLifecycleStage } from '../src/lib/verification/state-machine';
import { PoolLifecycleStage, VerificationStatus } from '../src/lib/meteora/constants';

describe('Lifecycle State Machine Invariants', () => {
  it('assigns INSUFFICIENT_DATA when DBC account is missing or invalid', () => {
    const result = evaluateLifecycleStage({
      hasValidDbcAccount: false,
      realQuoteReserves: BigInt(0),
      migrationThreshold: BigInt(85_000_000_000),
      isMigratedFlag: false,
      migrationTxFound: false,
      destinationPoolFound: false,
      destinationMintsMatch: false,
      destinationReservesFunded: false,
      lpLocked: false,
    });

    expect(result.status).toBe(VerificationStatus.INSUFFICIENT_DATA);
    expect(result.stage).toBe(PoolLifecycleStage.ACTIVE_TRADING);
  });

  it('keeps pool in ACTIVE_TRADING when quote reserves are below threshold', () => {
    const result = evaluateLifecycleStage({
      hasValidDbcAccount: true,
      realQuoteReserves: BigInt(40_000_000_000), // 40 SOL
      migrationThreshold: BigInt(85_000_000_000), // 85 SOL
      isMigratedFlag: false,
      migrationTxFound: false,
      destinationPoolFound: false,
      destinationMintsMatch: false,
      destinationReservesFunded: false,
      lpLocked: false,
    });

    expect(result.status).toBe(VerificationStatus.UNVERIFIED);
    expect(result.stage).toBe(PoolLifecycleStage.ACTIVE_TRADING);
  });

  it('transitions to THRESHOLD_REACHED without claiming migration', () => {
    const result = evaluateLifecycleStage({
      hasValidDbcAccount: true,
      realQuoteReserves: BigInt(85_000_000_000), // 85 SOL
      migrationThreshold: BigInt(85_000_000_000),
      isMigratedFlag: false,
      migrationTxFound: false,
      destinationPoolFound: false,
      destinationMintsMatch: false,
      destinationReservesFunded: false,
      lpLocked: false,
    });

    expect(result.status).toBe(VerificationStatus.UNVERIFIED);
    expect(result.stage).toBe(PoolLifecycleStage.THRESHOLD_REACHED);
    expect(result.summary).toContain('Graduation threshold reached');
  });

  it('detects DISCREPANCY when is_migrated is true but destination pool has no reserves', () => {
    const result = evaluateLifecycleStage({
      hasValidDbcAccount: true,
      realQuoteReserves: BigInt(0),
      migrationThreshold: BigInt(85_000_000_000),
      isMigratedFlag: true,
      migrationTxFound: true,
      destinationPoolFound: true,
      destinationMintsMatch: true,
      destinationReservesFunded: false, // EMPTY!
      lpLocked: false,
    });

    expect(result.status).toBe(VerificationStatus.DISCREPANCY);
    expect(result.stage).toBe(PoolLifecycleStage.MIGRATION_INITIATED);
    expect(result.summary).toContain('DISCREPANCY');
  });

  it('detects DISCREPANCY when migration tx found but destination pool missing', () => {
    const result = evaluateLifecycleStage({
      hasValidDbcAccount: true,
      realQuoteReserves: BigInt(0),
      migrationThreshold: BigInt(85_000_000_000),
      isMigratedFlag: true,
      migrationTxFound: true,
      destinationPoolFound: false, // Not found!
      destinationMintsMatch: false,
      destinationReservesFunded: false,
      lpLocked: false,
    });

    expect(result.status).toBe(VerificationStatus.DISCREPANCY);
    expect(result.stage).toBe(PoolLifecycleStage.MIGRATION_INITIATED);
  });

  it('keeps a migrated flag with unavailable history explicitly insufficient instead of inventing a destination', () => {
    const result = evaluateLifecycleStage({
      hasValidDbcAccount: true,
      realQuoteReserves: BigInt(0),
      migrationThreshold: BigInt(85_000_000_000),
      isMigratedFlag: true,
      migrationTxFound: false,
      destinationPoolFound: false,
      destinationMintsMatch: false,
      destinationReservesFunded: false,
      lpLocked: false,
      migrationEvidenceUnavailable: true,
    });
    expect(result.status).toBe(VerificationStatus.INSUFFICIENT_DATA);
    expect(result.stage).toBe(PoolLifecycleStage.MIGRATION_INITIATED);
    expect(result.summary).toContain('does not prove the destination transaction');
  });

  it('verifies RECONCILED state when all on-chain requirements pass', () => {
    const result = evaluateLifecycleStage({
      hasValidDbcAccount: true,
      realQuoteReserves: BigInt(0),
      migrationThreshold: BigInt(85_000_000_000),
      isMigratedFlag: true,
      migrationTxFound: true,
      destinationPoolFound: true,
      destinationMintsMatch: true,
      destinationReservesFunded: true,
      lpLocked: true,
    });

    expect(result.status).toBe(VerificationStatus.VERIFIED);
    expect(result.stage).toBe(PoolLifecycleStage.RECONCILED);
    expect(result.summary).toContain('Lifecycle fully verified');
  });
});
