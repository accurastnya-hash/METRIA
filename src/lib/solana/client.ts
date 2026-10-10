/**
 * METRIA — Solana RPC Client & Connection Manager
 * Strict cluster isolation, deterministic timeouts, and resilient error recovery
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { VerificationCluster } from '../verification/types';

export const DEFAULT_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
export const DEFAULT_DEVNET_RPC = 'https://api.devnet.solana.com';
export const RPC_TIMEOUT_MS = 10000;

export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBuffer()) || pubkey.toBase58().length >= 32;
  } catch {
    return false;
  }
}

export function getRpcUrl(cluster: VerificationCluster): string {
  if (cluster === 'devnet') {
    return process.env.SOLANA_DEVNET_RPC_URL || DEFAULT_DEVNET_RPC;
  }
  return (
    process.env.SOLANA_RPC_URL ||
    DEFAULT_MAINNET_RPC
  );
}

export function createSolanaConnection(cluster: VerificationCluster): Connection {
  const url = getRpcUrl(cluster);
  return new Connection(url, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: RPC_TIMEOUT_MS,
  });
}

/**
 * Fetch account info with strict timeout wrapper to prevent hanging calls
 */
export async function fetchAccountWithTimeout(
  connection: Connection,
  address: string,
  timeoutMs: number = RPC_TIMEOUT_MS
) {
  const pubkey = new PublicKey(address);

  const timeoutPromise = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error(`RPC request timed out after ${timeoutMs}ms`)), timeoutMs)
  );

  return Promise.race([
    connection.getAccountInfo(pubkey),
    timeoutPromise,
  ]);
}
