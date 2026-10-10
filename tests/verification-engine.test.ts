import { describe, it, expect } from 'vitest';
import { isConsistentDbcConfig, isDbcOwnedDataAccount, isTokenAccountForMint, isTokenMintAccount, verifyAddress } from '../src/lib/verification/engine';
import { METEORA_PROGRAMS, RAYDIUM_CPMM_PROGRAM_ID, VerificationStatus, PoolLifecycleStage } from '../src/lib/meteora/constants';
import { DYNAMIC_BONDING_CURVE_PROGRAM_ID, DAMM_V1_PROGRAM_ID } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { CP_AMM_PROGRAM_ID } from '@meteora-ag/cp-amm-sdk';
import { PublicKey } from '@solana/web3.js';
import { isDerivedDestinationAddress, isValidDammV2Account, migrationInstructionMatchesOrigin } from '../src/lib/verification/migration-proof';
import {
  FIXTURE_GRADUATED_DAMM_V2,
  FIXTURE_THRESHOLD_REACHED_UNMIGRATED,
  FIXTURE_ACTIVE_CURVE,
  FIXTURE_DISCREPANCY_FAULTY_DESTINATION,
} from '../src/lib/fixtures/pools';

describe('Verification Engine Address Resolution & Scenarios', () => {
  it('pins DBC to the installed official SDK and distinguishes DAMM v2 from Raydium CPMM', () => {
    expect(DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58()).toBe('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN');
    expect(METEORA_PROGRAMS.DBC_PROGRAM_ID).toBe(DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58());
    expect(METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID).toBe('cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG');
    expect(METEORA_PROGRAMS.DAMM_V1_PROGRAM_ID).toBe(DAMM_V1_PROGRAM_ID.toBase58());
    expect(METEORA_PROGRAMS.DAMM_V1_PROGRAM_ID).not.toBe(METEORA_PROGRAMS.DBC_PROGRAM_ID);
    expect(CP_AMM_PROGRAM_ID.toBase58()).toBe(METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID);
    expect(METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID).not.toBe(RAYDIUM_CPMM_PROGRAM_ID);
    expect(RAYDIUM_CPMM_PROGRAM_ID).toBe('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');
  });

  it('rejects executable programs and accounts owned by the wrong program for DBC account claims', () => {
    expect(isDbcOwnedDataAccount(METEORA_PROGRAMS.DBC_PROGRAM_ID, false)).toBe(true);
    expect(isDbcOwnedDataAccount(METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID, false)).toBe(false);
    expect(isDbcOwnedDataAccount(RAYDIUM_CPMM_PROGRAM_ID, false)).toBe(false);
    expect(isDbcOwnedDataAccount(METEORA_PROGRAMS.DBC_PROGRAM_ID, true)).toBe(false);
  });

  it('fails closed when the DBC config owner, SDK decode, or quote mint account is inconsistent', () => {
    expect(isConsistentDbcConfig(METEORA_PROGRAMS.DBC_PROGRAM_ID, false, true, true)).toBe(true);
    expect(isConsistentDbcConfig(METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID, false, true, true)).toBe(false);
    expect(isConsistentDbcConfig(METEORA_PROGRAMS.DBC_PROGRAM_ID, false, false, true)).toBe(false);
    expect(isConsistentDbcConfig(METEORA_PROGRAMS.DBC_PROGRAM_ID, false, true, false)).toBe(false);
  });

  it('requires DAMM v2 ownership and SDK decoding, and does not confuse a destination with its DBC origin', () => {
    expect(isValidDammV2Account(METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID, false, true)).toBe(true);
    expect(isValidDammV2Account(RAYDIUM_CPMM_PROGRAM_ID, false, true)).toBe(false);
    expect(isValidDammV2Account(METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID, true, true)).toBe(false);
    expect(isValidDammV2Account(METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID, false, false)).toBe(false);
    expect(migrationInstructionMatchesOrigin('origin-dbc-pool', 'origin-dbc-pool')).toBe(true);
    expect(migrationInstructionMatchesOrigin('destination-damm-pool', 'origin-dbc-pool')).toBe(false);
    expect(isDerivedDestinationAddress('expected-destination', 'expected-destination')).toBe(true);
    expect(isDerivedDestinationAddress('other-mint-matched-pool', 'expected-destination')).toBe(false);
  });

  it('requires a present, initialized SPL Token or Token-2022 mint layout', () => {
    const data = new Uint8Array(82);
    data[45] = 1;
    expect(isTokenMintAccount('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', data)).toBe(true);
    expect(isTokenMintAccount(RAYDIUM_CPMM_PROGRAM_ID, data)).toBe(false);
    expect(isTokenMintAccount('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', new Uint8Array(81))).toBe(false);
    data[45] = 0;
    expect(isTokenMintAccount('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', data)).toBe(false);
  });

  it('checks token vault owner and embedded mint address', () => {
    const data = new Uint8Array(165);
    const mint = 'So11111111111111111111111111111111111111112';
    data.set(new PublicKey(mint).toBytes(), 0);
    expect(isTokenAccountForMint('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', data, mint)).toBe(true);
    expect(isTokenAccountForMint(RAYDIUM_CPMM_PROGRAM_ID, data, mint)).toBe(false);
    expect(isTokenAccountForMint('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', data, '11111111111111111111111111111111')).toBe(false);
  });

  it('rejects invalid Solana base58 address with INSUFFICIENT_DATA', async () => {
    const result = await verifyAddress('not-a-valid-solana-address-!!!');
    expect(result.status).toBe(VerificationStatus.INSUFFICIENT_DATA);
    expect(result.statusSummary).toContain('Invalid Solana base58');
  });

  it('correctly returns fully migrated DAMM v2 fixture as VERIFIED', async () => {
    const result = await verifyAddress(FIXTURE_GRADUATED_DAMM_V2.inputAddress, 'simulated-fixture');
    expect(result.status).toBe(VerificationStatus.VERIFIED);
    expect(result.stage).toBe(PoolLifecycleStage.RECONCILED);
    expect(result.dbcState.isMigrated).toBe(true);
    expect(result.destinationState?.programLabel).toBe('Meteora DAMM v2 (CP-AMM)');
    expect(result.destinationState?.lpLockedStatus).toBe('LOCKED');
    expect(result.resolvedPoolAddress).toBe(FIXTURE_GRADUATED_DAMM_V2.dbcState.poolAddress);
    expect(result.resolvedPoolAddress).not.toBe(result.destinationState?.poolAddress);
    expect(result.canonicalHash).toBeDefined();
  });

  it('correctly identifies threshold reached unmigrated curve as UNVERIFIED with proper stage', async () => {
    const result = await verifyAddress(
      FIXTURE_THRESHOLD_REACHED_UNMIGRATED.inputAddress,
      'simulated-fixture'
    );
    expect(result.status).toBe(VerificationStatus.UNVERIFIED);
    expect(result.stage).toBe(PoolLifecycleStage.THRESHOLD_REACHED);
    expect(result.dbcState.isMigrated).toBe(false);
    expect(result.dbcState.progressPercentage).toBe(100);
    expect(result.destinationState).toBeNull();
  });

  it('correctly identifies active trading curve in progress', async () => {
    const result = await verifyAddress(FIXTURE_ACTIVE_CURVE.inputAddress, 'simulated-fixture');
    expect(result.status).toBe(VerificationStatus.UNVERIFIED);
    expect(result.stage).toBe(PoolLifecycleStage.ACTIVE_TRADING);
    expect(result.dbcState.isMigrated).toBe(false);
    expect(result.dbcState.progressPercentage).toBeCloseTo(46.2, 1);
  });

  it('correctly catches DISCREPANCY when destination liquidity is missing', async () => {
    const result = await verifyAddress(
      FIXTURE_DISCREPANCY_FAULTY_DESTINATION.inputAddress,
      'simulated-fixture'
    );
    expect(result.status).toBe(VerificationStatus.DISCREPANCY);
    expect(result.dbcState.isMigrated).toBe(true);
    expect(result.claims.some((c) => c.status === VerificationStatus.DISCREPANCY)).toBe(true);
  });

  it('strictly isolates simulated fixtures with explicit isSimulatedFixture flag', async () => {
    const result = await verifyAddress(FIXTURE_GRADUATED_DAMM_V2.inputAddress, 'simulated-fixture');
    expect(result.isSimulatedFixture).toBe(true);
    expect(result.cluster).toBe('simulated-fixture');
  });

  it('returns INSUFFICIENT_DATA for an unallocated address on mainnet-beta without falling back to fixtures', async () => {
    // Generate a valid base58 address that does not exist on mainnet
    const randomAddress = '9xQeWvG816bUx9EPjFWdd5AufqSSqeM2qN1xzybapC8G';
    const result = await verifyAddress(randomAddress, 'mainnet-beta', { rpcTimeoutMs: 3000 });
    expect(result.status).toBe(VerificationStatus.INSUFFICIENT_DATA);
    expect(result.isSimulatedFixture).toBe(false);
    expect(result.cluster).toBe('mainnet-beta');
  });
});
