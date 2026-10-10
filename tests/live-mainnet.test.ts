import { describe, it, expect } from 'vitest';
import { Connection, PublicKey } from '@solana/web3.js';
import { DynamicBondingCurveClient, DYNAMIC_BONDING_CURVE_PROGRAM_ID } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { verifyAddress } from '../src/lib/verification/engine';
import { METEORA_PROGRAMS, VerificationStatus, PoolLifecycleStage } from '../src/lib/meteora/constants';
import { findDammV2MigrationProof } from '../src/lib/verification/migration-proof';
import { buildVerificationReceipt, verifyReceiptIntegrity } from '../src/lib/receipts/generator';

describe('Live Mainnet-Beta Verification Tests', () => {
  it('verifies real on-chain Meteora DBC pool FrvcJryeu... on mainnet-beta', async () => {
    const poolAddress = 'FrvcJryeuBhPnB8NS854rdfzjbLrc6gGuMF4vpAkcxFC';
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const direct = await connection.getAccountInfo(new PublicKey(poolAddress), 'confirmed');
    expect(DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58()).toBe(METEORA_PROGRAMS.DBC_PROGRAM_ID);
    expect(direct).not.toBeNull();
    expect(direct!.owner.toBase58()).toBe(METEORA_PROGRAMS.DBC_PROGRAM_ID);
    expect(direct!.executable).toBe(false);
    expect(Array.from(direct!.data.slice(0, 8))).toEqual([213, 224, 5, 209, 98, 69, 119, 92]);
    const sdk = new DynamicBondingCurveClient(connection, 'confirmed');
    const decoded = await sdk.state.getPool(new PublicKey(poolAddress));
    expect(decoded).not.toBeNull();
    const state = decoded!.poolState;
    expect(state.baseMint.toBase58()).toBe('6o4vdqyvStu7EfgnMJ8ZycnUV3Kfxdz9sQWsnDDtjups');
    expect(state.config.toBase58()).toBe('437qMje8uMQzWRw6enTCBgnnLvL4cTRM8dfkq8MQNhSM');
    const configAccount = await connection.getAccountInfo(state.config, 'confirmed');
    expect(configAccount?.owner.toBase58()).toBe(METEORA_PROGRAMS.DBC_PROGRAM_ID);
    expect(configAccount?.executable).toBe(false);
    const config = await sdk.state.getPoolConfig(state.config);
    expect(config).not.toBeNull();
    expect(config!.quoteMint.toBase58()).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    expect(config!.migrationOption).toBe(1);
    expect(config!.migrationQuoteThreshold.toString()).toBe('15390982211');
    for (const mint of [state.baseMint, config!.quoteMint]) {
      const mintInfo = await connection.getAccountInfo(mint, 'confirmed');
      expect(mintInfo).not.toBeNull();
      expect(['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb']).toContain(mintInfo!.owner.toBase58());
      expect(mintInfo!.data.length).toBeGreaterThanOrEqual(82);
      expect(mintInfo!.data[45]).toBe(1);
    }
    const result = await verifyAddress(poolAddress, 'mainnet-beta', { rpcTimeoutMs: 10000 });

    expect(result.isSimulatedFixture).toBe(false);
    expect(result.cluster).toBe('mainnet-beta');
    expect(result.status).toBe(VerificationStatus.UNVERIFIED); // active trading curve
    expect(result.stage).toBe(PoolLifecycleStage.ACTIVE_TRADING);
    expect(result.dbcState.poolAddress).toBe(poolAddress);
    expect(result.dbcState.quoteMint.symbol).toBe('USDC');
    expect(result.dbcState.migrationOptionLabel).toBe('Meteora DAMM v2 (CP-AMM)');
    expect(result.dbcState.isMigrated).toBe(false);
    expect(result.claims.length).toBeGreaterThan(0);
    expect(result.migrationClaims?.find((claim) => claim.id === 'DBC_POOL_CONFIRMED')?.status).toBe('VERIFIED');
    expect(result.migrationClaims?.find((claim) => claim.id === 'MIGRATED_STATE_CONFIRMED')?.status).toBe('UNVERIFIED');
    expect(result.migrationClaims?.find((claim) => claim.id === 'MIGRATION_TRANSACTION_CONFIRMED')?.status).toBe('UNVERIFIED');
    expect(result.migrationClaims?.find((claim) => claim.id === 'ASSET_FLOW_RECONCILED')?.status).toBe('UNVERIFIED');
    expect(verifyReceiptIntegrity(buildVerificationReceipt(result)).isValid).toBe(true);
    expect(result.canonicalHash).toHaveLength(64);
    const wrongType = await verifyAddress('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C', 'mainnet-beta', { rpcTimeoutMs: 10000 });
    expect(wrongType.status).toBe(VerificationStatus.INSUFFICIENT_DATA);
    expect(wrongType.statusSummary).toContain('No associated Meteora Dynamic Bonding Curve pool');
  }, 15000);

  it('independently proves a successful DBC-to-DAMM-v2 migration on mainnet-beta', async () => {
    const poolAddress = '11A3VXuStYb6WmbZXZNK4smEQC4wuc6SuT1Yf6ETPRr';
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const poolKey = new PublicKey(poolAddress);
    const direct = await connection.getAccountInfo(poolKey, 'confirmed');
    expect(direct).not.toBeNull();
    expect(direct!.owner.toBase58()).toBe(METEORA_PROGRAMS.DBC_PROGRAM_ID);
    expect(direct!.executable).toBe(false);
    const sdk = new DynamicBondingCurveClient(connection, 'confirmed');
    const decoded = await sdk.state.getPool(poolKey);
    expect(decoded).not.toBeNull();
    const pool = decoded!.poolState;
    const configInfo = await connection.getAccountInfo(pool.config, 'confirmed');
    expect(configInfo?.owner.toBase58()).toBe(METEORA_PROGRAMS.DBC_PROGRAM_ID);
    expect(configInfo?.executable).toBe(false);
    const config = await sdk.state.getPoolConfig(pool.config);
    expect(config).not.toBeNull();
    expect(config!.migrationOption).toBe(1);
    const baseMintInfo = await connection.getAccountInfo(pool.baseMint, 'confirmed');
    const quoteMintInfo = await connection.getAccountInfo(config!.quoteMint, 'confirmed');
    expect(baseMintInfo).not.toBeNull();
    expect(quoteMintInfo).not.toBeNull();
    const tokenProgramIds = ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'];
    for (const mintInfo of [baseMintInfo!, quoteMintInfo!]) {
      expect(tokenProgramIds).toContain(mintInfo.owner.toBase58());
      expect(mintInfo.data.length).toBeGreaterThanOrEqual(82);
      expect(mintInfo.data[45]).toBe(1);
    }
    const proof = await findDammV2MigrationProof({
      connection,
      poolAddress,
      baseMint: pool.baseMint,
      quoteMint: config!.quoteMint,
      baseDecimals: baseMintInfo!.data[44],
      quoteDecimals: quoteMintInfo!.data[44],
      baseVault: pool.baseVault,
      quoteVault: pool.quoteVault,
      migrationFeeOption: config!.migrationFeeOption,
      migrated: pool.isMigrated === 1,
      maxSignatures: 50,
    });
    expect(proof.status).toBe('VERIFIED');
    expect(proof.transactionSignature).toBe('4nQZsKMzhTjF2yk5Y4LVJkPQtGYJUhFooXqCauzCnSNHpHNWb6Pctt9soi65XFhRjWW4GQH2mG41ybsAcsr8oxh2');
    expect(proof.destinationAddress).toBe('35HVrd1oRCn9sKrG2szU5HoZoEanDAfuyDeTGGoav52x');
    expect(proof.derivedDestinationAddress).toBe(proof.destinationAddress);
    expect(proof.destinationOwner).toBe(METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID);
    expect(proof.dammConfigOwner).toBe(METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID);
    expect(proof.dammConfigDecoded).toBe(true);
    expect(proof.destinationDecoded).toBe(true);
    expect(proof.assetFlowReconciled).toBe(true);
    expect(proof.failedMigrationSignatures).toContain('469282JixDxmD3QLWiFNbPPgQd7xYLLAgEBD3u7angbgHQXqdigvamSWRYKiK4ssMuWJiSN48HLJEVEEYdtL6kWG');
  }, 45000);
});
