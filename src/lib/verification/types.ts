/**
 * METRIA — Domain Types for Lifecycle Verification & Developer Infrastructure
 */

import {
  MigrationOption,
  PoolLifecycleStage,
  VerificationStatus,
} from '../meteora/constants';
import type { MigrationProof, MigrationProofClaim } from './migration-proof';

export type VerificationCluster = 'mainnet-beta' | 'devnet' | 'simulated-fixture';

export type AddressType = 'TOKEN_MINT' | 'DBC_POOL' | 'UNKNOWN';

export type EvidenceConfidence =
  | 'DIRECT_FACT'       // Directly read from immutable on-chain account data
  | 'SDK_DERIVED'       // Derived using official SDK deterministic formulas
  | 'CALCULATED_METRIC' // Calculated arithmetic relation (e.g. ratios, percentages)
  | 'INFERENCE'         // Reasonable deduction without 100% cryptographic proof
  | 'UNAVAILABLE';      // Data not provided or unavailable

export type EvidenceType =
  | 'ACCOUNT_STATE'
  | 'TRANSACTION_SIGNATURE'
  | 'PDA_SEED'
  | 'VAULT_BALANCE'
  | 'MIGRATION_FLAG';

export interface EvidenceReference {
  type: EvidenceType;
  label: string;
  targetAddress?: string;
  signature?: string;
  explorerUrl?: string;
  value: string;
  confidence: EvidenceConfidence;
  details?: string;
}

export interface ClaimEvaluation {
  id: string;
  title: string;
  description: string;
  status: VerificationStatus;
  confidence: EvidenceConfidence;
  value: string | number | boolean;
  requiredEvidenceFound: boolean;
  explanation: string;
  discrepancyNote?: string;
  rawDetails?: Record<string, unknown>;
}

export interface DbcPoolState {
  poolAddress: string;
  programId: string;
  baseMint: {
    address: string;
    symbol?: string;
    decimals: number;
  };
  quoteMint: {
    address: string;
    symbol: string;
    decimals: number;
  };
  baseVault: string;
  quoteVault: string;
  configAddress: string;
  migrationOption: MigrationOption | null;
  migrationFeeOption?: number;
  migrationOptionLabel: string;
  migrationThresholdRaw: string;
  migrationThresholdFormatted: string;
  virtualBaseReserves: string;
  virtualQuoteReserves: string;
  realBaseReserves: string;
  realQuoteReserves: string;
  progressPercentage: number | null;
  isMigrated: boolean | null;
  migrationTargetAddress: string | null;
  migratedAtSlot?: number;
  migratedTxSignature?: string;
}

export interface DestinationPoolState {
  programId: string;
  programLabel: 'Meteora DAMM v2 (CP-AMM)' | 'Legacy DAMM v1' | 'Custom Adapter' | 'Unknown';
  poolAddress: string;
  token0Mint: string;
  token1Mint: string;
  token0Vault: string;
  token1Vault: string;
  token0Balance: string;
  token1Balance: string;
  token0BalanceRaw?: string;
  token1BalanceRaw?: string;
  token0Decimals?: number;
  token1Decimals?: number;
  lpMint: string;
  lpSupply: string;
  poolAuthority: string;
  isAuthorityCanonical: boolean;
  lpLockedStatus: 'LOCKED' | 'BURNED' | 'HELD_BY_CREATOR' | 'UNVERIFIED';
  feeTierBps?: number;
}

export interface VerificationResult {
  receiptId: string;
  canonicalHash: string;
  methodologyVersion: string;
  timestamp: string;
  observationSlot?: number;
  cluster: VerificationCluster;
  isSimulatedFixture: boolean;
  inputAddress: string;
  resolvedType: AddressType;
  resolvedPoolAddress: string;
  status: VerificationStatus;
  stage: PoolLifecycleStage;
  statusSummary: string;
  stageExplanation: string;
  dbcState: DbcPoolState;
  destinationState: DestinationPoolState | null;
  migrationProof?: MigrationProof;
  migrationClaims?: MigrationProofClaim[];
  claims: ClaimEvaluation[];
  evidence: EvidenceReference[];
  missingEvidence: string[];
  limitations: string[];
}

export interface VerificationReceiptPayload {
  receiptId: string;
  canonicalHash: string;
  methodologyVersion: string;
  verificationTimestamp: string;
  observationSlot?: number;
  cluster: VerificationCluster;
  isSimulatedFixture: boolean;
  inputAddress: string;
  resolvedPoolAddress: string;
  status: VerificationStatus;
  stage: PoolLifecycleStage;
  claimsSummary: Array<{
    claimId: string;
    status: VerificationStatus;
    value: string | number | boolean;
  }>;
  dbcPool: {
    address: string;
    programId?: string;
    configAddress?: string;
    baseMint: string;
    quoteMint: string;
    baseDecimals?: number;
    quoteDecimals?: number;
    migrationOption: string;
    migrationFeeOption?: number;
    migrationThreshold: string;
    isMigrated: boolean | null;
  };
  destinationPool: {
    address: string | null;
    programId: string | null;
    lpSupply: string | null;
    isLocked: string | null;
    token0Mint?: string | null;
    token1Mint?: string | null;
    token0Vault?: string | null;
    token1Vault?: string | null;
    token0CurrentBalance?: string | null;
    token1CurrentBalance?: string | null;
    token0CurrentBalanceRaw?: string | null;
    token1CurrentBalanceRaw?: string | null;
    token0Decimals?: number | null;
    token1Decimals?: number | null;
  };
  evidenceSignatures: string[];
  missingEvidenceCount: number;
  migrationProof?: MigrationProof;
  migrationClaims?: MigrationProofClaim[];
}
