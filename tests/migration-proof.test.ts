import { describe, expect, it, vi } from 'vitest';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { DynamicBondingCurveIdl } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { METEORA_PROGRAMS } from '../src/lib/meteora/constants';
import {
  buildMigrationProofClaims,
  findDammV2MigrationProof,
  resolveTransactionAccountKeys,
} from '../src/lib/verification/migration-proof';
import { formatTokenAmountFlow } from '../src/lib/verification/amount-format';

const pool = Keypair.generate().publicKey;
const baseMint = Keypair.generate().publicKey;
const quoteMint = Keypair.generate().publicKey;
const baseVault = Keypair.generate().publicKey;
const quoteVault = Keypair.generate().publicKey;
const keys = Array.from({ length: 40 }, () => Keypair.generate().publicKey);
keys[0] = new PublicKey(METEORA_PROGRAMS.DBC_PROGRAM_ID);
keys[1] = pool;
const migrationDiscriminator = DynamicBondingCurveIdl.instructions.find((ix) => ix.name === 'migration_damm_v2')!.discriminator;

function makeConnection(signatures: string[], transaction: unknown): Connection {
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  vi.spyOn(connection, 'getSignaturesForAddress').mockResolvedValue(signatures.map((signature) => ({
    signature, slot: 1, err: null, memo: null, blockTime: 1, confirmationStatus: 'confirmed',
  })) as never);
  vi.spyOn(connection, 'getTransaction').mockResolvedValue(transaction as never);
  return connection;
}

function transaction(source: PublicKey, error: unknown = null) {
  const instructionAccounts = Array.from({ length: 26 }, (_, index) => index + 1);
  instructionAccounts[0] = source.equals(pool) ? 1 : 2;
  return {
    slot: 10,
    blockTime: 100,
    transaction: {
      message: {
        staticAccountKeys: keys,
        compiledInstructions: [{ programIdIndex: 0, accountKeyIndexes: instructionAccounts, data: Uint8Array.from(migrationDiscriminator) }],
      },
    },
    meta: { err: error, loadedAddresses: { writable: [], readonly: [] }, preTokenBalances: [], postTokenBalances: [], innerInstructions: [] },
  };
}

const baseInput = {
  poolAddress: pool.toBase58(), baseMint, quoteMint, baseVault, quoteVault,
  baseDecimals: 6, quoteDecimals: 9,
  migrationFeeOption: 0, migrated: true,
};

describe('DBC migration proof engine (mocked RPC cases are not live evidence)', () => {
  it('formats raw historical token flow without losing integer precision', () => {
    expect(formatTokenAmountFlow('250000003101446 out / 250000003101446 in', 6))
      .toBe('250000003.101446 out / 250000003.101446 in (6 decimals) · raw 250000003101446 out / 250000003101446 in');
    expect(formatTokenAmountFlow('88000000000 out / 88000000000 in', 9)).toContain('88 out / 88 in (9 decimals)');
  });
  it('does no transaction search for an unmigrated DBC pool', async () => {
    const connection = new Connection('http://127.0.0.1:8899');
    const signatures = vi.spyOn(connection, 'getSignaturesForAddress');
    const proof = await findDammV2MigrationProof({ ...baseInput, connection, migrated: false });
    expect(proof.status).toBe('NOT_MIGRATED');
    expect(signatures).not.toHaveBeenCalled();
    const claims = buildMigrationProofClaims({
      proof, cluster: 'mainnet-beta', originPool: pool.toBase58(), config: Keypair.generate().publicKey.toBase58(),
      thresholdMet: false, migrated: false, migrationOption: 1, migrationFeeOption: 0,
    });
    expect(claims.find((claim) => claim.id === 'MIGRATION_TRANSACTION_CONFIRMED')?.status).toBe('UNVERIFIED');
    expect(claims.find((claim) => claim.id === 'ASSET_FLOW_RECONCILED')?.status).toBe('UNVERIFIED');
  });

  it('keeps legacy DAMM v1 and missing transaction evidence outside the DAMM v2 claim path', async () => {
    const connection = new Connection('http://127.0.0.1:8899');
    const proof = await findDammV2MigrationProof({ ...baseInput, connection, migrated: false });
    const claims = buildMigrationProofClaims({
      proof, cluster: 'mainnet-beta', originPool: pool.toBase58(), config: Keypair.generate().publicKey.toBase58(),
      thresholdMet: false, migrated: true, migrationOption: 0, migrationFeeOption: 0,
    });
    expect(claims.find((claim) => claim.id === 'MIGRATION_ROUTE_CONFIRMED')?.status).toBe('INSUFFICIENT_DATA');
    expect(claims.find((claim) => claim.id === 'MIGRATION_TRANSACTION_CONFIRMED')?.status).toBe('INSUFFICIENT_DATA');
    expect(claims.find((claim) => claim.id === 'ASSET_FLOW_RECONCILED')?.status).toBe('INSUFFICIENT_DATA');
  });

  it('reports a successful migration instruction separately from unproven asset flow', async () => {
    const connection = new Connection('http://127.0.0.1:8899');
    const proof = await findDammV2MigrationProof({ ...baseInput, connection, migrated: false });
    proof.status = 'INCOMPLETE';
    proof.transactionConfirmed = true;
    proof.transactionSignature = 'confirmed-signature';
    proof.instruction = 'migrationDammV2';
    const claims = buildMigrationProofClaims({
      proof, cluster: 'mainnet-beta', originPool: pool.toBase58(), config: Keypair.generate().publicKey.toBase58(),
      thresholdMet: true, migrated: true, migrationOption: 1, migrationFeeOption: 6,
    });
    expect(claims.find((claim) => claim.id === 'MIGRATION_TRANSACTION_CONFIRMED')?.status).toBe('VERIFIED');
    expect(claims.find((claim) => claim.id === 'ASSET_FLOW_RECONCILED')?.status).toBe('INSUFFICIENT_DATA');
  });

  it('does not count a failed migration_damm_v2 transaction as migration proof', async () => {
    const connection = makeConnection(['failed-signature'], transaction(pool, { InstructionError: [0, { Custom: 6022 }] }));
    const proof = await findDammV2MigrationProof({ ...baseInput, connection });
    expect(proof.status).toBe('INCOMPLETE');
    expect(proof.failedMigrationSignatures).toEqual(['failed-signature']);
    expect(proof.transactionSignature).toBeNull();
  });

  it('rejects a successful migration instruction tied to a different source DBC pool', async () => {
    const otherPool = Keypair.generate().publicKey;
    const connection = makeConnection(['wrong-source'], transaction(otherPool));
    const proof = await findDammV2MigrationProof({ ...baseInput, connection });
    expect(proof.status).toBe('INCOMPLETE');
    expect(proof.destinationAddress).toBeNull();
  });

  it('reports a bounded history limit and unavailable transaction details explicitly', async () => {
    const limited = makeConnection(['a', 'b'], null);
    const limitProof = await findDammV2MigrationProof({ ...baseInput, connection: limited, maxSignatures: 2 });
    expect(limitProof.status).toBe('HISTORY_LIMIT_REACHED');
    expect(limitProof.historyExhausted).toBe(false);

    const unavailable = makeConnection(['missing'], null);
    const unavailableProof = await findDammV2MigrationProof({ ...baseInput, connection: unavailable });
    expect(unavailableProof.status).toBe('INCOMPLETE');
    expect(unavailableProof.reasons.join(' ')).toContain('Transaction details unavailable');
  });

  it('reports RPC rate limits as unavailable evidence instead of absence', async () => {
    const connection = new Connection('http://127.0.0.1:8899');
    vi.spyOn(connection, 'getSignaturesForAddress').mockRejectedValue(new Error('429 Too Many Requests'));
    const proof = await findDammV2MigrationProof({ ...baseInput, connection });
    expect(proof.status).toBe('INCOMPLETE');
    expect(proof.reasons.join(' ')).toContain('429 Too Many Requests');
  });

  it('includes versioned transaction address lookup table keys in account-index resolution', () => {
    const staticKey = Keypair.generate().publicKey;
    const writable = Keypair.generate().publicKey;
    const readonly = Keypair.generate().publicKey;
    expect(resolveTransactionAccountKeys({ staticAccountKeys: [staticKey] }, { writable: [writable], readonly: [readonly] }))
      .toEqual([staticKey.toBase58(), writable.toBase58(), readonly.toBase58()]);
  });
});
