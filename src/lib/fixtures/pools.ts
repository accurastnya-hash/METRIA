/**
 * METRIA — Realistic Test Fixtures & Deterministic Demonstration Scenarios
 * Ground truth testbed representing real on-chain scenarios
 */

import {
  MigrationOption,
  PoolLifecycleStage,
  VerificationStatus,
  METHODOLOGY_VERSION,
  METEORA_PROGRAMS,
  WELL_KNOWN_TOKENS,
} from '../meteora/constants';
import { VerificationResult } from '../verification/types';
import { generateCanonicalHash } from '../receipts/generator';

// Scenario 1: Fully Graduated & Reconciled DBC -> DAMM v2 CP-AMM Pool
export const FIXTURE_GRADUATED_DAMM_V2: VerificationResult = (() => {
  const claims = [
    {
      id: 'CLAIM_POOL_OWNERSHIP',
      title: 'DBC Program Ownership',
      description: 'Account owned by Meteora DBC program (dbcij3LW...)',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Pool account is owned by the canonical DBC program ID.',
    },
    {
      id: 'CLAIM_MINTS_VALID',
      title: 'Token Mints Integrity',
      description: 'Base and Quote mints are valid on-chain SPL tokens',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Base token (NOVA) and Quote token (WSOL) correctly initialized with proper decimal scaling.',
    },
    {
      id: 'CLAIM_THRESHOLD_EVALUATION',
      title: 'Graduation Threshold Status',
      description: 'Real quote reserves meet or exceed configured migration threshold',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Reserve threshold of 85.0 SOL was met (85.0001 SOL accumulated).',
    },
    {
      id: 'CLAIM_MIGRATION_DESTINATION',
      title: 'Destination AMM Architecture',
      description: 'Configured destination targets Meteora DAMM v2 (cpamdpZ...)',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: 'DAMM_V2_CP_AMM',
      requiredEvidenceFound: true,
      explanation: 'MigrationOption is 1 (Meteora Constant Product AMM v2).',
    },
    {
      id: 'CLAIM_DESTINATION_POOL_EXISTS',
      title: 'Destination AMM Pool On-Chain State',
      description: 'CP-AMM pool exists and matches base and quote token pair',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: 'E7BqN81J3K2y97wA7Cvh3nQoPjLw5b7vG8p21nFwM2aD',
      requiredEvidenceFound: true,
      explanation: 'Destination CP-AMM pool account found on-chain with identical token pair.',
    },
    {
      id: 'CLAIM_LIQUIDITY_RECONCILED',
      title: 'Post-Migration Reserve Capitalization',
      description: 'DBC curve vaults drained and AMM vaults funded with transferred liquidity',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'DBC vaults show 0 lamports; DAMM v2 vaults hold 85.0 SOL and 200,000,000 NOVA.',
    },
    {
      id: 'CLAIM_LP_CUSTODY_LOCK',
      title: 'LP Position & Ownership Audit',
      description: 'LP tokens locked or held in verified non-circulating custody',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: 'LOCKED',
      requiredEvidenceFound: true,
      explanation: 'LP tokens permanently burned / locked in canonical Meteora lock vault.',
    },
  ];

  const poolAddress = '8xWj21K9QvLpM9Z3sF7XgY8nR1WvK2mD5qP9tL3bE4uA';
  const inputAddress = 'NovA111111111111111111111111111111111111111';
  const stage = PoolLifecycleStage.RECONCILED;
  const status = VerificationStatus.VERIFIED;
  const cluster = 'simulated-fixture';

  const canonicalHash = generateCanonicalHash({
    cluster,
    inputAddress,
    resolvedPoolAddress: poolAddress,
    status,
    stage,
    claims,
  });

  return {
    receiptId: 'rcpt_graduated_novadamm_8xwj21',
    canonicalHash,
    methodologyVersion: METHODOLOGY_VERSION,
    timestamp: '2026-10-09T23:45:00.000Z',
    cluster,
    isSimulatedFixture: true,
    inputAddress,
    resolvedType: 'TOKEN_MINT',
    resolvedPoolAddress: poolAddress,
    status,
    stage,
    statusSummary: 'Lifecycle fully verified. Curve graduated and migrated into Meteora DAMM v2 with reconciled liquidity.',
    stageExplanation: 'The bonding curve successfully accumulated the required 85 SOL threshold. A verified migration transaction executed, seeding DAMM v2 CP-AMM pool E7BqN81J... with permanent locked liquidity.',
    dbcState: {
      poolAddress,
      programId: METEORA_PROGRAMS.DBC_PROGRAM_ID,
      baseMint: {
        address: inputAddress,
        symbol: 'NOVA',
        decimals: 6,
      },
      quoteMint: {
        address: WELL_KNOWN_TOKENS.SOL.mint,
        symbol: 'SOL',
        decimals: 9,
      },
      baseVault: 'BVault11111111111111111111111111111111111111',
      quoteVault: 'QVault11111111111111111111111111111111111111',
      configAddress: 'Cfg11111111111111111111111111111111111111111',
      migrationOption: MigrationOption.DAMM_V2_CP_AMM,
      migrationOptionLabel: 'Meteora DAMM v2 (CP-AMM)',
      migrationThresholdRaw: '85000000000',
      migrationThresholdFormatted: '85.0 SOL',
      virtualBaseReserves: '1073000000000000',
      virtualQuoteReserves: '30000000000',
      realBaseReserves: '0',
      realQuoteReserves: '0',
      progressPercentage: 100,
      isMigrated: true,
      migrationTargetAddress: 'E7BqN81J3K2y97wA7Cvh3nQoPjLw5b7vG8p21nFwM2aD',
      migratedAtSlot: 312891040,
      migratedTxSignature: '4aZyK9XwF7B12mL8rQp23nVb91Km3L4pRt7WvG21nFwM2aD3vP8kR5tY6uJ1XwF7B12mL8rQp23nVb91Km3L4pRt',
    },
    destinationState: {
      programId: METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID,
      programLabel: 'Meteora DAMM v2 (CP-AMM)',
      poolAddress: 'E7BqN81J3K2y97wA7Cvh3nQoPjLw5b7vG8p21nFwM2aD',
      token0Mint: inputAddress,
      token1Mint: WELL_KNOWN_TOKENS.SOL.mint,
      token0Vault: 'DVault011111111111111111111111111111111111111',
      token1Vault: 'DVault111111111111111111111111111111111111111',
      token0Balance: '200,000,000.00 NOVA',
      token1Balance: '85.0001 SOL',
      lpMint: 'LPMint111111111111111111111111111111111111111',
      lpSupply: '130,384,048',
      poolAuthority: METEORA_PROGRAMS.DAMM_V2_AUTHORITY_PDA,
      isAuthorityCanonical: true,
      lpLockedStatus: 'LOCKED',
      feeTierBps: 25,
    },
    claims,
    evidence: [
      {
        type: 'ACCOUNT_STATE',
        label: 'DBC Pool Account State',
        targetAddress: poolAddress,
        value: 'is_migrated == true',
        confidence: 'DIRECT_FACT',
      },
      {
        type: 'TRANSACTION_SIGNATURE',
        label: 'Migration Execution Transaction',
        signature: '4aZyK9XwF7B12mL8rQp23nVb91Km3L4pRt7WvG21nFwM2aD3vP8kR5tY6uJ1XwF7B12mL8rQp23nVb91Km3L4pRt',
        value: 'Executed at slot 312891040',
        confidence: 'DIRECT_FACT',
      },
      {
        type: 'VAULT_BALANCE',
        label: 'DAMM v2 Token0 Vault Balance',
        targetAddress: 'DVault011111111111111111111111111111111111111',
        value: '200,000,000 NOVA',
        confidence: 'DIRECT_FACT',
      },
      {
        type: 'VAULT_BALANCE',
        label: 'DAMM v2 Token1 Vault Balance',
        targetAddress: 'DVault111111111111111111111111111111111111111',
        value: '85.0001 SOL',
        confidence: 'DIRECT_FACT',
      },
    ],
    missingEvidence: [],
    limitations: [
      'Verification reflects historical on-chain state at evaluation slot. Ongoing AMM trades may fluctuate balances.',
      'Token price sustainability or creator behavior is outside verification scope.',
    ],
  };
})();

// Scenario 2: Threshold Reached, But Migration Transaction Pending/Not Executed
export const FIXTURE_THRESHOLD_REACHED_UNMIGRATED: VerificationResult = (() => {
  const claims = [
    {
      id: 'CLAIM_POOL_OWNERSHIP',
      title: 'DBC Program Ownership',
      description: 'Account owned by Meteora DBC program (dbcij3LW...)',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Pool account is owned by the canonical DBC program ID.',
    },
    {
      id: 'CLAIM_MINTS_VALID',
      title: 'Token Mints Integrity',
      description: 'Base and Quote mints are valid on-chain SPL tokens',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Base token (SOLAR) and Quote token (WSOL) are valid.',
    },
    {
      id: 'CLAIM_THRESHOLD_EVALUATION',
      title: 'Graduation Threshold Status',
      description: 'Real quote reserves meet or exceed configured migration threshold',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Reserve threshold of 85.0 SOL reached (85.12 SOL held in vault). Curve is fully funded.',
    },
    {
      id: 'CLAIM_MIGRATION_EXECUTION',
      title: 'Migration Transaction Execution',
      description: 'DBC migration instruction has been confirmed on-chain',
      status: VerificationStatus.UNVERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: false,
      requiredEvidenceFound: false,
      explanation: 'Pool is not marked is_migrated. Migration instruction has not been confirmed yet.',
    },
    {
      id: 'CLAIM_DESTINATION_POOL_EXISTS',
      title: 'Destination AMM Pool State',
      description: 'Post-graduation AMM pool established with transferred assets',
      status: VerificationStatus.UNVERIFIED,
      confidence: 'UNAVAILABLE' as const,
      value: 'NOT_CREATED',
      requiredEvidenceFound: false,
      explanation: 'Destination pool cannot be reconciled until migration crank executes.',
    },
  ];

  const poolAddress = '9qRz42Kp7wLuT1X8mC5vB4nA2WvK8mD6qP1tL9bE7uB';
  const inputAddress = 'SoLaR11111111111111111111111111111111111111';
  const stage = PoolLifecycleStage.THRESHOLD_REACHED;
  const status = VerificationStatus.UNVERIFIED;
  const cluster = 'simulated-fixture';

  const canonicalHash = generateCanonicalHash({
    cluster,
    inputAddress,
    resolvedPoolAddress: poolAddress,
    status,
    stage,
    claims,
  });

  return {
    receiptId: 'rcpt_thresh_solar_9qrz42',
    canonicalHash,
    methodologyVersion: METHODOLOGY_VERSION,
    timestamp: '2026-10-10T00:15:00.000Z',
    cluster,
    isSimulatedFixture: true,
    inputAddress,
    resolvedType: 'TOKEN_MINT',
    resolvedPoolAddress: poolAddress,
    status,
    stage,
    statusSummary: 'Threshold reached but migration not completed. Liquidity remains locked inside DBC curve vault awaiting migration crank.',
    stageExplanation: 'The bonding curve met the 85 SOL graduation requirement, but migration has not yet executed. METRIA strictly differentiates threshold completion from migration execution.',
    dbcState: {
      poolAddress,
      programId: METEORA_PROGRAMS.DBC_PROGRAM_ID,
      baseMint: {
        address: inputAddress,
        symbol: 'SOLAR',
        decimals: 6,
      },
      quoteMint: {
        address: WELL_KNOWN_TOKENS.SOL.mint,
        symbol: 'SOL',
        decimals: 9,
      },
      baseVault: 'BVault22222222222222222222222222222222222222',
      quoteVault: 'QVault22222222222222222222222222222222222222',
      configAddress: 'Cfg22222222222222222222222222222222222222222',
      migrationOption: MigrationOption.DAMM_V2_CP_AMM,
      migrationOptionLabel: 'Meteora DAMM v2 (CP-AMM)',
      migrationThresholdRaw: '85000000000',
      migrationThresholdFormatted: '85.0 SOL',
      virtualBaseReserves: '1073000000000000',
      virtualQuoteReserves: '30000000000',
      realBaseReserves: '200000000000000',
      realQuoteReserves: '85120000000',
      progressPercentage: 100,
      isMigrated: false,
      migrationTargetAddress: null,
    },
    destinationState: null,
    claims,
    evidence: [
      {
        type: 'VAULT_BALANCE',
        label: 'DBC Quote Vault Balance',
        targetAddress: 'QVault22222222222222222222222222222222222222',
        value: '85.12 SOL',
        confidence: 'DIRECT_FACT',
      },
      {
        type: 'ACCOUNT_STATE',
        label: 'DBC Pool Account State',
        targetAddress: poolAddress,
        value: 'is_migrated == false',
        confidence: 'DIRECT_FACT',
      },
    ],
    missingEvidence: [
      'Migration instruction execution signature',
      'Destination AMM Pool creation event',
      'Destination vault deposit transaction',
    ],
    limitations: [
      'Migration service may be delayed by high network congestion or pending crank trigger.',
      'Curve trading is typically paused when threshold is reached, pending migration.',
    ],
  };
})();

// Scenario 3: Active Trading Bonding Curve (In Progress)
export const FIXTURE_ACTIVE_CURVE: VerificationResult = (() => {
  const claims = [
    {
      id: 'CLAIM_POOL_OWNERSHIP',
      title: 'DBC Program Ownership',
      description: 'Account owned by Meteora DBC program (dbcij3LW...)',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Pool account is owned by the canonical DBC program ID.',
    },
    {
      id: 'CLAIM_MINTS_VALID',
      title: 'Token Mints Integrity',
      description: 'Base and Quote mints are valid on-chain SPL tokens',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Base token (ORBIT) and Quote token (WSOL) are active.',
    },
    {
      id: 'CLAIM_THRESHOLD_EVALUATION',
      title: 'Graduation Threshold Status',
      description: 'Real quote reserves meet or exceed configured migration threshold',
      status: VerificationStatus.UNVERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: false,
      requiredEvidenceFound: true,
      explanation: 'Current accumulation is 39.27 SOL out of 85.0 SOL (46.20% progress). Threshold not reached.',
    },
    {
      id: 'CLAIM_MIGRATION_EXECUTION',
      title: 'Migration Status',
      description: 'DBC pool has entered migration phase',
      status: VerificationStatus.UNVERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: false,
      requiredEvidenceFound: true,
      explanation: 'Curve remains in active trading phase. No migration initiated.',
    },
  ];

  const poolAddress = '3pLk71Qw8vKmT9Z2sC4vB8nA1WvK6mD9qP2tL4bE8uC';
  const inputAddress = 'Urbt111111111111111111111111111111111111111';
  const stage = PoolLifecycleStage.ACTIVE_TRADING;
  const status = VerificationStatus.UNVERIFIED;
  const cluster = 'simulated-fixture';

  const canonicalHash = generateCanonicalHash({
    cluster,
    inputAddress,
    resolvedPoolAddress: poolAddress,
    status,
    stage,
    claims,
  });

  return {
    receiptId: 'rcpt_active_orbit_3plk71',
    canonicalHash,
    methodologyVersion: METHODOLOGY_VERSION,
    timestamp: '2026-10-10T00:30:00.000Z',
    cluster,
    isSimulatedFixture: true,
    inputAddress,
    resolvedType: 'TOKEN_MINT',
    resolvedPoolAddress: poolAddress,
    status,
    stage,
    statusSummary: 'Active bonding curve in progress. 46.20% toward graduation threshold.',
    stageExplanation: 'The token is currently trading along the dynamic bonding curve. 39.27 SOL has been accumulated toward the 85.0 SOL migration threshold.',
    dbcState: {
      poolAddress,
      programId: METEORA_PROGRAMS.DBC_PROGRAM_ID,
      baseMint: {
        address: inputAddress,
        symbol: 'ORBIT',
        decimals: 6,
      },
      quoteMint: {
        address: WELL_KNOWN_TOKENS.SOL.mint,
        symbol: 'SOL',
        decimals: 9,
      },
      baseVault: 'BVault33333333333333333333333333333333333333',
      quoteVault: 'QVault33333333333333333333333333333333333333',
      configAddress: 'Cfg33333333333333333333333333333333333333333',
      migrationOption: MigrationOption.DAMM_V2_CP_AMM,
      migrationOptionLabel: 'Meteora DAMM v2 (CP-AMM)',
      migrationThresholdRaw: '85000000000',
      migrationThresholdFormatted: '85.0 SOL',
      virtualBaseReserves: '1073000000000000',
      virtualQuoteReserves: '30000000000',
      realBaseReserves: '542000000000000',
      realQuoteReserves: '39270000000',
      progressPercentage: 46.2,
      isMigrated: false,
      migrationTargetAddress: null,
    },
    destinationState: null,
    claims,
    evidence: [
      {
        type: 'VAULT_BALANCE',
        label: 'DBC Real Quote Reserve',
        targetAddress: 'QVault33333333333333333333333333333333333333',
        value: '39.27 SOL',
        confidence: 'DIRECT_FACT',
      },
      {
        type: 'ACCOUNT_STATE',
        label: 'DBC Pool Account State',
        targetAddress: poolAddress,
        value: 'Active trading mode',
        confidence: 'DIRECT_FACT',
      },
    ],
    missingEvidence: [
      'Graduation threshold not reached (45.73 SOL remaining)',
      'Migration evidence not applicable at this stage',
    ],
    limitations: [
      'Curve price updates dynamically with each swap transaction.',
      'Verification certifies curve parameters and reserve math at current slot.',
    ],
  };
})();

// Scenario 4: Discrepancy / Inconsistency Detected (Marked migrated, but AMM vault empty)
export const FIXTURE_DISCREPANCY_FAULTY_DESTINATION: VerificationResult = (() => {
  const claims = [
    {
      id: 'CLAIM_POOL_OWNERSHIP',
      title: 'DBC Program Ownership',
      description: 'Account owned by Meteora DBC program (dbcij3LW...)',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Pool account is owned by the canonical DBC program ID.',
    },
    {
      id: 'CLAIM_THRESHOLD_EVALUATION',
      title: 'Graduation Threshold Status',
      description: 'Real quote reserves meet or exceed configured migration threshold',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Curve met the 85.0 SOL threshold.',
    },
    {
      id: 'CLAIM_MIGRATION_FLAG',
      title: 'Migration Status Flag',
      description: 'Pool state indicates is_migrated == true',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT' as const,
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Pool is_migrated flag is set to true on-chain.',
    },
    {
      id: 'CLAIM_DESTINATION_RESERVES',
      title: 'Destination AMM Reserves Reconciliation',
      description: 'Target AMM pool vaults hold the migrated liquidity reserves',
      status: VerificationStatus.DISCREPANCY,
      confidence: 'DIRECT_FACT' as const,
      value: false,
      requiredEvidenceFound: true,
      explanation: 'CRITICAL DISCREPANCY: Destination pool vaults have 0 balance. Drained curve liquidity is unaccounted for.',
      discrepancyNote: 'DBC pool indicates migration occurred, but destination CP-AMM vaults are uncapitalized.',
    },
  ];

  const poolAddress = '5xKm91Lp2wQvR8Z3sF4vB7nA8WvK1mD4qP9tL2bE5uD';
  const inputAddress = 'GhST111111111111111111111111111111111111111';
  const stage = PoolLifecycleStage.MIGRATION_INITIATED;
  const status = VerificationStatus.DISCREPANCY;
  const cluster = 'simulated-fixture';

  const canonicalHash = generateCanonicalHash({
    cluster,
    inputAddress,
    resolvedPoolAddress: poolAddress,
    status,
    stage,
    claims,
  });

  return {
    receiptId: 'rcpt_discrepancy_ghost_5xkm91',
    canonicalHash,
    methodologyVersion: METHODOLOGY_VERSION,
    timestamp: '2026-10-10T00:45:00.000Z',
    cluster,
    isSimulatedFixture: true,
    inputAddress,
    resolvedType: 'TOKEN_MINT',
    resolvedPoolAddress: poolAddress,
    status,
    stage,
    statusSummary: 'DISCREPANCY DETECTED: Curve marked as migrated, but destination AMM pool has zero verified liquidity.',
    stageExplanation: 'A critical discrepancy was discovered between DBC pool state and destination pool state. While is_migrated is set, destination token vaults contain zero balances.',
    dbcState: {
      poolAddress,
      programId: METEORA_PROGRAMS.DBC_PROGRAM_ID,
      baseMint: {
        address: inputAddress,
        symbol: 'GHOST',
        decimals: 6,
      },
      quoteMint: {
        address: WELL_KNOWN_TOKENS.SOL.mint,
        symbol: 'SOL',
        decimals: 9,
      },
      baseVault: 'BVault44444444444444444444444444444444444444',
      quoteVault: 'QVault44444444444444444444444444444444444444',
      configAddress: 'Cfg44444444444444444444444444444444444444444',
      migrationOption: MigrationOption.DAMM_V2_CP_AMM,
      migrationOptionLabel: 'Meteora DAMM v2 (CP-AMM)',
      migrationThresholdRaw: '85000000000',
      migrationThresholdFormatted: '85.0 SOL',
      virtualBaseReserves: '1073000000000000',
      virtualQuoteReserves: '30000000000',
      realBaseReserves: '0',
      realQuoteReserves: '0',
      progressPercentage: 100,
      isMigrated: true,
      migrationTargetAddress: 'EmptyPool11111111111111111111111111111111111',
    },
    destinationState: {
      programId: METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID,
      programLabel: 'Meteora DAMM v2 (CP-AMM)',
      poolAddress: 'EmptyPool11111111111111111111111111111111111',
      token0Mint: inputAddress,
      token1Mint: WELL_KNOWN_TOKENS.SOL.mint,
      token0Vault: 'EmptyVault011111111111111111111111111111111',
      token1Vault: 'EmptyVault111111111111111111111111111111111',
      token0Balance: '0.00 GHOST',
      token1Balance: '0.00 SOL',
      lpMint: 'EmptyLPMint11111111111111111111111111111111',
      lpSupply: '0',
      poolAuthority: METEORA_PROGRAMS.DAMM_V2_AUTHORITY_PDA,
      isAuthorityCanonical: true,
      lpLockedStatus: 'UNVERIFIED',
    },
    claims,
    evidence: [
      {
        type: 'ACCOUNT_STATE',
        label: 'DBC is_migrated Flag',
        targetAddress: poolAddress,
        value: 'true',
        confidence: 'DIRECT_FACT',
      },
      {
        type: 'VAULT_BALANCE',
        label: 'Target AMM Vault 0 Balance',
        targetAddress: 'EmptyVault011111111111111111111111111111111',
        value: '0 GHOST',
        confidence: 'DIRECT_FACT',
      },
      {
        type: 'VAULT_BALANCE',
        label: 'Target AMM Vault 1 Balance',
        targetAddress: 'EmptyVault111111111111111111111111111111111',
        value: '0 SOL',
        confidence: 'DIRECT_FACT',
      },
    ],
    missingEvidence: [
      'Missing liquidity custody on destination CP-AMM pool',
      'Transaction proof reconciling drained assets with destination deposit',
    ],
    limitations: [
      'This verdict signals an unverified migration failure or abnormal liquidity diversion.',
      'Do not rely on this pool without on-chain investigation of the migration transaction.',
    ],
  };
})();

export const ALL_FIXTURES: Record<string, VerificationResult> = {
  [FIXTURE_GRADUATED_DAMM_V2.inputAddress]: FIXTURE_GRADUATED_DAMM_V2,
  [FIXTURE_GRADUATED_DAMM_V2.resolvedPoolAddress]: FIXTURE_GRADUATED_DAMM_V2,
  [FIXTURE_THRESHOLD_REACHED_UNMIGRATED.inputAddress]: FIXTURE_THRESHOLD_REACHED_UNMIGRATED,
  [FIXTURE_THRESHOLD_REACHED_UNMIGRATED.resolvedPoolAddress]: FIXTURE_THRESHOLD_REACHED_UNMIGRATED,
  [FIXTURE_ACTIVE_CURVE.inputAddress]: FIXTURE_ACTIVE_CURVE,
  [FIXTURE_ACTIVE_CURVE.resolvedPoolAddress]: FIXTURE_ACTIVE_CURVE,
  [FIXTURE_DISCREPANCY_FAULTY_DESTINATION.inputAddress]: FIXTURE_DISCREPANCY_FAULTY_DESTINATION,
  [FIXTURE_DISCREPANCY_FAULTY_DESTINATION.resolvedPoolAddress]: FIXTURE_DISCREPANCY_FAULTY_DESTINATION,
};
