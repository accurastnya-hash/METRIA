/**
 * METRIA — Lifecycle Verification State Machine
 * Deterministic transitions based strictly on verified on-chain evidence
 */

import {
  PoolLifecycleStage,
  VerificationStatus,
} from '../meteora/constants';

export interface StateMachineEvaluationInput {
  hasValidDbcAccount: boolean;
  realQuoteReserves: bigint;
  migrationThreshold: bigint;
  isMigratedFlag: boolean;
  migrationTxFound: boolean;
  destinationPoolFound: boolean;
  destinationMintsMatch: boolean;
  destinationReservesFunded: boolean;
  lpLocked: boolean;
  migrationEvidenceUnavailable?: boolean;
  migrationEvidenceDiscrepancy?: boolean;
}

export interface StateMachineEvaluationOutput {
  stage: PoolLifecycleStage;
  status: VerificationStatus;
  summary: string;
  stageExplanation: string;
}

export function evaluateLifecycleStage(
  input: StateMachineEvaluationInput
): StateMachineEvaluationOutput {
  if (!input.hasValidDbcAccount) {
    return {
      stage: PoolLifecycleStage.ACTIVE_TRADING,
      status: VerificationStatus.INSUFFICIENT_DATA,
      summary: 'DBC pool account data is missing, malformed, or not recognized.',
      stageExplanation: 'Cannot establish lifecycle stage because account data could not be verified on-chain.',
    };
  }

  // Check for discrepancy: marked migrated, but destination pool is empty or invalid
  if (input.isMigratedFlag) {
    if (input.migrationEvidenceDiscrepancy) {
      return {
        stage: PoolLifecycleStage.MIGRATION_INITIATED,
        status: VerificationStatus.DISCREPANCY,
        summary: 'Migration evidence conflicts with the configured DBC-to-DAMM v2 route.',
        stageExplanation: 'A decoded migration instruction, destination account, owner, config, or asset-flow invariant did not reconcile.',
      };
    }
    if (input.migrationEvidenceUnavailable) {
      return {
        stage: PoolLifecycleStage.MIGRATION_INITIATED,
        status: VerificationStatus.INSUFFICIENT_DATA,
        summary: 'DBC state is marked migrated, but available RPC history does not prove the destination transaction.',
        stageExplanation: 'The migration history scan was bounded or incomplete. No destination is promoted from mint matching or PDA derivation alone.',
      };
    }
    if (input.destinationPoolFound && (!input.destinationMintsMatch || !input.destinationReservesFunded)) {
      return {
        stage: PoolLifecycleStage.MIGRATION_INITIATED,
        status: VerificationStatus.DISCREPANCY,
        summary: 'CRITICAL DISCREPANCY: DBC curve marked migrated, but destination pool reserves do not reconcile.',
        stageExplanation: 'The DBC account has is_migrated set to true, but the target AMM pool has zero funds or mismatched token mints.',
      };
    }
    if (!input.destinationPoolFound && input.migrationTxFound) {
      return {
        stage: PoolLifecycleStage.MIGRATION_INITIATED,
        status: VerificationStatus.DISCREPANCY,
        summary: 'DISCREPANCY: Migration transaction executed, but destination pool cannot be verified.',
        stageExplanation: 'On-chain migration event occurred, but target liquidity pool does not exist at configured address.',
      };
    }
  }

  // Normal flow: Fully reconciled migration
  if (
    input.isMigratedFlag &&
    input.destinationPoolFound &&
    input.destinationMintsMatch &&
    input.destinationReservesFunded
  ) {
    return {
      stage: PoolLifecycleStage.RECONCILED,
      status: VerificationStatus.VERIFIED,
      summary: 'Lifecycle fully verified. Curve graduated and migrated into destination AMM with reconciled liquidity.',
      stageExplanation: 'All lifecycle criteria satisfied: threshold met, migration confirmed, destination pool verified, and reserves funded.',
    };
  }

  // Threshold reached but NOT migrated
  if (input.realQuoteReserves >= input.migrationThreshold && !input.isMigratedFlag) {
    return {
      stage: PoolLifecycleStage.THRESHOLD_REACHED,
      status: VerificationStatus.UNVERIFIED,
      summary: 'Graduation threshold reached. Migration has not yet executed or confirmed on-chain.',
      stageExplanation: 'Curve accumulated the required quote reserves. The pool is eligible for migration but migration crank has not completed.',
    };
  }

  // Active trading along curve
  return {
    stage: PoolLifecycleStage.ACTIVE_TRADING,
    status: VerificationStatus.UNVERIFIED,
    summary: 'Active dynamic bonding curve in progress. Accumulating reserves toward migration threshold.',
    stageExplanation: 'The token is actively trading along the dynamic bonding curve. Threshold has not yet been achieved.',
  };
}
