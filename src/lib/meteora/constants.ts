/**
 * METRIA — Meteora Ecosystem Protocol Constants
 * Independent Builder Infrastructure
 */

export const METEORA_PROGRAMS = {
  // Meteora Dynamic Bonding Curve (DBC)
  DBC_PROGRAM_ID: 'dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN',

  // Meteora DAMM v1; exported as DAMM_V1_PROGRAM_ID by the official DBC SDK.
  DAMM_V1_PROGRAM_ID: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',

  // Meteora DAMM v2 (CP-AMM / Constant Product AMM)
  DAMM_V2_PROGRAM_ID: 'cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG',
  DAMM_V2_AUTHORITY_PDA: 'HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC',

  // Meteora DLMM (Dynamic Liquidity Market Maker)
  DLMM_PROGRAM_ID: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
} as const;

// Explicitly distinguished from Meteora DAMM v2. This is Raydium CPMM.
export const RAYDIUM_CPMM_PROGRAM_ID = 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C';

export const WELL_KNOWN_TOKENS = {
  SOL: {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
  },
  USDC: {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  MET: {
    mint: 'METvsvL9b4yWR7mC9w4Z4Zf95vA68m49nQ3k46Q1J2k',
    symbol: 'MET',
    name: 'Meteora',
    decimals: 6,
  },
} as const;

export enum MigrationOption {
  DAMM_V1_LEGACY = 0,
  DAMM_V2_CP_AMM = 1,
  CUSTOM_ADAPTER = 2,
}

export enum PoolLifecycleStage {
  ACTIVE_TRADING = 'ACTIVE_TRADING',
  THRESHOLD_REACHED = 'THRESHOLD_REACHED',
  MIGRATION_INITIATED = 'MIGRATION_INITIATED',
  MIGRATION_CONFIRMED = 'MIGRATION_CONFIRMED',
  DESTINATION_VERIFIED = 'DESTINATION_VERIFIED',
  RECONCILED = 'RECONCILED',
}

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  DISCREPANCY = 'DISCREPANCY',
  UNVERIFIED = 'UNVERIFIED',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
}

export const METHODOLOGY_VERSION = '2.0.0';
export const INDEPENDENT_DISCLOSURE =
  'METRIA is an independent builder project for the Meteora ecosystem. It is not an official Meteora product.';
