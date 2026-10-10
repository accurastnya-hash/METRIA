import { describe, it, expect } from 'vitest';
import { isValidSolanaAddress, getRpcUrl } from '../src/lib/solana/client';

describe('Solana Client & Address Validation', () => {
  it('validates legitimate Solana public keys', () => {
    // Canonical Token mints & standard base58 keys
    expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true);
    expect(isValidSolanaAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
    expect(isValidSolanaAddress('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN')).toBe(true);
  });

  it('rejects malformed or empty addresses', () => {
    expect(isValidSolanaAddress('')).toBe(false);
    expect(isValidSolanaAddress('0')).toBe(false);
    expect(isValidSolanaAddress('invalid-key-with-0-or-O')).toBe(false);
    expect(isValidSolanaAddress('short')).toBe(false);
  });

  it('resolves correct RPC URLs by cluster', () => {
    expect(getRpcUrl('devnet')).toContain('devnet');
    expect(getRpcUrl('mainnet-beta')).toContain('mainnet');
  });
});
