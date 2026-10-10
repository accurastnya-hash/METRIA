/**
 * METRIA — Master Verification Engine
 * Core protocol discovery, claim reconciliation, and evidence aggregation
 * Fully integrated with official Meteora DBC and CP-AMM (DAMM v2) SDKs
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { DynamicBondingCurveClient, DYNAMIC_BONDING_CURVE_PROGRAM_ID } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { CpAmm, CP_AMM_PROGRAM_ID } from '@meteora-ag/cp-amm-sdk';
import {
  VerificationCluster,
  VerificationResult,
  AddressType,
  ClaimEvaluation,
  EvidenceReference,
  DestinationPoolState,
} from './types';
import {
  METEORA_PROGRAMS,
  METHODOLOGY_VERSION,
  MigrationOption,
  PoolLifecycleStage,
  VerificationStatus,
  WELL_KNOWN_TOKENS,
} from '../meteora/constants';
import { ALL_FIXTURES } from '../fixtures/pools';
import {
  isValidSolanaAddress,
  createSolanaConnection,
  fetchAccountWithTimeout,
} from '../solana/client';
import { evaluateLifecycleStage } from './state-machine';
import { generateCanonicalHash } from '../receipts/generator';
import { buildMigrationProofClaims, findDammV2MigrationProof } from './migration-proof';

export interface VerificationOptions {
  rpcTimeoutMs?: number;
}

export function isDbcOwnedDataAccount(owner: string, executable: boolean): boolean {
  return owner === METEORA_PROGRAMS.DBC_PROGRAM_ID && !executable;
}

export function isConsistentDbcConfig(
  owner: string,
  executable: boolean,
  decoded: boolean,
  quoteMintAccountExists: boolean
): boolean {
  return isDbcOwnedDataAccount(owner, executable) && decoded && quoteMintAccountExists;
}

export function isTokenMintAccount(owner: string, data: Uint8Array): boolean {
  const tokenPrograms = ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'];
  return tokenPrograms.includes(owner) && data.length >= 82 && data[45] === 1;
}

export function isTokenAccountForMint(owner: string, data: Uint8Array, mint: string): boolean {
  const tokenPrograms = ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'];
  if (!tokenPrograms.includes(owner) || data.length < 165) return false;
  return new PublicKey(data.slice(0, 32)).toBase58() === mint;
}

export async function verifyAddress(
  address: string,
  cluster: VerificationCluster = 'mainnet-beta',
  options: VerificationOptions = {}
): Promise<VerificationResult> {
  const cleanAddress = address.trim();

  // 1. Base58 Address Validation
  if (!isValidSolanaAddress(cleanAddress)) {
    return createEmptyFailureResult(
      cleanAddress,
      cluster,
      'UNKNOWN',
      VerificationStatus.INSUFFICIENT_DATA,
      'Invalid Solana base58 address format. Please check the public key.'
    );
  }

  // 2. Strict Cluster Isolation: Fixture Catalog ONLY in simulated-fixture cluster
  // or if explicitly requested in simulated mode. Never disguise fixtures as mainnet!
  if (cluster === 'simulated-fixture') {
    if (ALL_FIXTURES[cleanAddress]) {
      const fixture = ALL_FIXTURES[cleanAddress];
      return {
        ...fixture,
        inputAddress: cleanAddress,
        cluster: 'simulated-fixture',
        isSimulatedFixture: true,
      };
    }
    return createEmptyFailureResult(
      cleanAddress,
      cluster,
      'UNKNOWN',
      VerificationStatus.INSUFFICIENT_DATA,
      'No simulated fixture exists for this address. Simulated-fixture requests never query a live RPC.'
    );
  }

  // 3. Live On-Chain RPC Investigation
  try {
    const connection = createSolanaConnection(cluster);
    const targetPubkey = new PublicKey(cleanAddress);

    // Fetch primary account info to check existence and owner
    const accountInfo = await fetchAccountWithTimeout(
      connection,
      cleanAddress,
      options.rpcTimeoutMs
    );

    if (!accountInfo) {
      return createEmptyFailureResult(
        cleanAddress,
        cluster,
        'UNKNOWN',
        VerificationStatus.INSUFFICIENT_DATA,
        `Account does not exist on cluster '${cluster}'. No initialized Solana account found at this address.`
      );
    }

    const ownerString = accountInfo.owner.toBase58();
    const dbcClient = new DynamicBondingCurveClient(connection, 'confirmed');
    const cpAmm = new CpAmm(connection);

    // Case A: The address is directly a DBC VirtualPool
    if (ownerString === METEORA_PROGRAMS.DBC_PROGRAM_ID) {
      return await verifyLiveDbcPool(
        cleanAddress,
        cleanAddress,
        'DBC_POOL',
        cluster,
        connection,
        dbcClient,
        cpAmm
      );
    }

    // Case B: The address is a Token Mint. Search for DBC pool with base_mint
    try {
      const poolByMint = await dbcClient.state.getPoolByBaseMint(targetPubkey);
      if (poolByMint) {
        const poolAddress = poolByMint.publicKey.toBase58();
        return await verifyLiveDbcPool(
          cleanAddress,
          poolAddress,
          'TOKEN_MINT',
          cluster,
          connection,
          dbcClient,
          cpAmm
        );
      }
    } catch {
      // Ignore filter lookup error, fallback to check owner
    }

    // If account exists but is not DBC program and no DBC pool was found
    return createEmptyFailureResult(
      cleanAddress,
      cluster,
      'TOKEN_MINT',
      VerificationStatus.INSUFFICIENT_DATA,
      `Address belongs to program ${ownerString}. No associated Meteora Dynamic Bonding Curve pool found for this token on ${cluster}.`
    );
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return createEmptyFailureResult(
      cleanAddress,
      cluster,
      'UNKNOWN',
      VerificationStatus.INSUFFICIENT_DATA,
      `RPC query failed or timed out on cluster '${cluster}': ${errMsg}`
    );
  }
}

/**
 * Parses and verifies DBC pool using official Meteora SDKs
 */
async function verifyLiveDbcPool(
  inputAddress: string,
  poolAddress: string,
  resolvedType: AddressType,
  cluster: VerificationCluster,
  connection: Connection,
  dbcClient: DynamicBondingCurveClient,
  cpAmm: CpAmm
): Promise<VerificationResult> {
  const poolPubkey = new PublicKey(poolAddress);
  const directPoolResponse = await connection.getAccountInfoAndContext(poolPubkey, 'confirmed');
  const directPoolAccount = directPoolResponse.value;
  const observationSlot = directPoolResponse.context.slot;
  if (!directPoolAccount || !isDbcOwnedDataAccount(directPoolAccount.owner.toBase58(), directPoolAccount.executable)) {
    return createEmptyFailureResult(inputAddress, cluster, resolvedType, VerificationStatus.INSUFFICIENT_DATA,
      `DBC ownership check failed: expected non-executable account owned by ${METEORA_PROGRAMS.DBC_PROGRAM_ID}.`);
  }
  if (DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58() !== METEORA_PROGRAMS.DBC_PROGRAM_ID) {
    return createEmptyFailureResult(inputAddress, cluster, resolvedType, VerificationStatus.INSUFFICIENT_DATA,
      'Configured DBC program ID does not match the installed official DBC SDK.');
  }
  if (CP_AMM_PROGRAM_ID.toBase58() !== METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID) {
    return createEmptyFailureResult(inputAddress, cluster, resolvedType, VerificationStatus.INSUFFICIENT_DATA,
      'Configured DAMM v2 program ID does not match the installed official CP-AMM SDK.');
  }
  const poolData = await dbcClient.state.getPool(poolPubkey);

  if (!poolData) {
    return createEmptyFailureResult(
      inputAddress,
      cluster,
      resolvedType,
      VerificationStatus.INSUFFICIENT_DATA,
      'DBC VirtualPool account could not be deserialized by Meteora SDK.'
    );
  }

  // Extract on-chain PoolState fields
  const poolState = poolData.poolState;
  const baseMintPubkey = poolState.baseMint;
  const quoteVaultPubkey = poolState.quoteVault;
  const baseVaultPubkey = poolState.baseVault;
  const configPubkey = poolState.config;
  const realQuoteReserves = BigInt(poolState.quoteReserve.toString());
  const realBaseReserves = BigInt(poolState.baseReserve.toString());
  const isMigrated = poolState.isMigrated === 1;

  // Fetch and validate PoolConfig. Missing or inconsistent configuration must fail closed.
  let migrationThresholdLamports: bigint;
  let migrationOptionNumber: number;
  let migrationFeeOptionNumber: number;
  let quoteMintAddress: string;
  let quoteSymbol = 'TOKEN';
  let quoteDecimals = 0;
  let baseTokenDecimals = 0;

  try {
    const configAccount = await connection.getAccountInfo(configPubkey, 'confirmed');
    if (!configAccount || !isDbcOwnedDataAccount(configAccount.owner.toBase58(), configAccount.executable)) {
      throw new Error(`Pool config ${configPubkey.toBase58()} is missing or not owned by the DBC program.`);
    }
    const configData = await dbcClient.state.getPoolConfig(configPubkey);
    if (!configData) throw new Error('DBC SDK could not decode the PoolConfig account.');
    migrationThresholdLamports = BigInt(configData.migrationQuoteThreshold.toString());
    migrationOptionNumber = configData.migrationOption;
    migrationFeeOptionNumber = configData.migrationFeeOption;
    quoteMintAddress = configData.quoteMint.toBase58();
    if (quoteMintAddress === WELL_KNOWN_TOKENS.USDC.mint) {
      quoteSymbol = 'USDC';
    }
    const [baseMintInfo, quoteMintInfo, baseVaultInfo, quoteVaultInfo] = await Promise.all([
      connection.getAccountInfo(baseMintPubkey, 'confirmed'),
      connection.getAccountInfo(new PublicKey(quoteMintAddress), 'confirmed'),
      connection.getAccountInfo(baseVaultPubkey, 'confirmed'),
      connection.getAccountInfo(quoteVaultPubkey, 'confirmed'),
    ]);
    if (!baseMintInfo || !isTokenMintAccount(baseMintInfo.owner.toBase58(), baseMintInfo.data) ||
        !quoteMintInfo || !isTokenMintAccount(quoteMintInfo.owner.toBase58(), quoteMintInfo.data)) {
      throw new Error('Base or configured quote mint is missing or is not a decodable SPL Token/Token-2022 mint account.');
    }
    if (!baseVaultInfo || !isTokenAccountForMint(baseVaultInfo.owner.toBase58(), baseVaultInfo.data, baseMintPubkey.toBase58()) ||
        !quoteVaultInfo || !isTokenAccountForMint(quoteVaultInfo.owner.toBase58(), quoteVaultInfo.data, quoteMintAddress)) {
      throw new Error('DBC base or quote vault is missing, not a token account, or stores the wrong mint.');
    }
    if (!isConsistentDbcConfig(configAccount.owner.toBase58(), configAccount.executable, Boolean(configData), Boolean(quoteMintInfo))) {
      throw new Error('DBC config ownership, decode, or configured quote mint account check failed.');
    }
    baseTokenDecimals = baseMintInfo.data[44];
    quoteDecimals = quoteMintInfo.data[44];
    if (quoteMintAddress === WELL_KNOWN_TOKENS.USDC.mint) quoteSymbol = 'USDC';
    else if (quoteMintAddress === WELL_KNOWN_TOKENS.SOL.mint) quoteSymbol = 'SOL';
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return createEmptyFailureResult(inputAddress, cluster, resolvedType, VerificationStatus.INSUFFICIENT_DATA,
      `DBC configuration validation failed: ${reason}`);
  }

  // Calculate graduation progress
  const progressPercentage =
    migrationThresholdLamports > BigInt(0)
      ? Number((realQuoteReserves * BigInt(10000)) / migrationThresholdLamports) / 100
      : 0;

  // A migrated flag alone is not evidence that a particular destination received assets.
  const migrationProof = await findDammV2MigrationProof({
    connection,
    poolAddress,
    baseMint: baseMintPubkey,
    quoteMint: new PublicKey(quoteMintAddress),
    baseDecimals: baseTokenDecimals,
    quoteDecimals,
    baseVault: baseVaultPubkey,
    quoteVault: quoteVaultPubkey,
    migrationFeeOption: migrationFeeOptionNumber,
    migrated: isMigrated && migrationOptionNumber === 1,
  });
  // Destination state is populated only from a transaction-linked DAMM v2 proof.
  let destinationState: DestinationPoolState | null = null;
  const destinationAddressConfirmed = Boolean(
    migrationProof.destinationAddress &&
    migrationProof.destinationAddress === migrationProof.derivedDestinationAddress &&
    migrationProof.destinationDecoded &&
    migrationProof.destinationOwner === METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID
  );
  let destinationPoolFound = migrationProof.status === 'VERIFIED';
  let destinationMintsMatch = destinationAddressConfirmed;
  // Historical transaction balance deltas prove asset movement; current balances are displayed separately and may have changed since migration.
  let destinationReservesFunded = migrationProof.assetFlowReconciled;
  let lpLocked = false;

  if (destinationAddressConfirmed && migrationProof.destinationAddress) {
    try {
      const destPoolAddress = migrationProof.destinationAddress;
      const dest = await cpAmm.fetchPoolState(new PublicKey(destPoolAddress));
      const tokenA = dest.tokenAMint.toBase58();
      const tokenB = dest.tokenBMint.toBase58();
      const b0 = await connection.getTokenAccountBalance(dest.tokenAVault);
      const b1 = await connection.getTokenAccountBalance(dest.tokenBVault);
      const permLock = BigInt(dest.permanentLockLiquidity?.toString() ?? '0');
      lpLocked = permLock > BigInt(0);
      destinationState = {
        programId: METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID,
        programLabel: 'Meteora DAMM v2 (CP-AMM)',
        poolAddress: destPoolAddress,
        token0Mint: tokenA,
        token1Mint: tokenB,
        token0Vault: dest.tokenAVault.toBase58(),
        token1Vault: dest.tokenBVault.toBase58(),
        token0Balance: b0.value.uiAmountString ?? '0',
        token1Balance: b1.value.uiAmountString ?? '0',
        token0BalanceRaw: b0.value.amount,
        token1BalanceRaw: b1.value.amount,
        token0Decimals: b0.value.decimals,
        token1Decimals: b1.value.decimals,
        lpMint: 'PositionNFT / CP-AMM',
        lpSupply: 'Position/NFT supply not enumerated',
        poolAuthority: METEORA_PROGRAMS.DAMM_V2_AUTHORITY_PDA,
        isAuthorityCanonical: true,
        lpLockedStatus: lpLocked ? 'LOCKED' : 'UNVERIFIED',
      };
      destinationReservesFunded = migrationProof.assetFlowReconciled;
    } catch (error) {
      destinationPoolFound = false;
      destinationMintsMatch = false;
      destinationReservesFunded = false;
      migrationProof.status = 'DISCREPANCY';
      migrationProof.reasons.push(`Live destination state/balance recheck failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const migrationClaims = buildMigrationProofClaims({
    proof: migrationProof,
    cluster,
    originPool: poolAddress,
    config: configPubkey.toBase58(),
    thresholdMet: realQuoteReserves >= migrationThresholdLamports,
    migrated: isMigrated,
    migrationOption: migrationOptionNumber,
    migrationFeeOption: migrationFeeOptionNumber,
  });

  // Evaluate state machine
  const evaluation = evaluateLifecycleStage({
    hasValidDbcAccount: true,
    realQuoteReserves,
    migrationThreshold: migrationThresholdLamports,
    isMigratedFlag: isMigrated,
    migrationTxFound: migrationProof.status === 'VERIFIED',
    destinationPoolFound,
    destinationMintsMatch,
    destinationReservesFunded,
    lpLocked,
    migrationEvidenceUnavailable: isMigrated && migrationProof.status !== 'VERIFIED' && migrationProof.status !== 'DISCREPANCY',
    migrationEvidenceDiscrepancy: isMigrated && migrationProof.status === 'DISCREPANCY',
  });

  const formattedThreshold = `${(Number(migrationThresholdLamports) / 10 ** quoteDecimals).toFixed(2)} ${quoteSymbol}`;

  const claims: ClaimEvaluation[] = [
    {
      id: 'CLAIM_POOL_OWNERSHIP',
      title: 'DBC Program Ownership',
      description: 'Account owned by Meteora DBC program (dbcij3LW...)',
      status: VerificationStatus.VERIFIED,
      confidence: 'DIRECT_FACT',
      value: true,
      requiredEvidenceFound: true,
      explanation: 'Verified on-chain account owner matches Meteora Dynamic Bonding Curve program.',
    },
    {
      id: 'CLAIM_THRESHOLD_EVALUATION',
      title: 'Graduation Threshold Evaluation',
      description: 'Quote reserves compared to migration threshold',
      status: realQuoteReserves >= migrationThresholdLamports ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
      confidence: 'DIRECT_FACT',
      value: realQuoteReserves >= migrationThresholdLamports,
      requiredEvidenceFound: true,
      explanation: `Current reserves: ${(Number(realQuoteReserves) / 10 ** quoteDecimals).toFixed(4)} ${quoteSymbol} (Target: ${formattedThreshold}).`,
    },
    {
      id: 'CLAIM_MIGRATION_FLAG',
      title: 'On-Chain Migration State',
      description: 'DBC pool is_migrated flag evaluated',
      status: isMigrated ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
      confidence: 'DIRECT_FACT',
      value: isMigrated,
      requiredEvidenceFound: true,
      explanation: isMigrated ? 'Pool is marked is_migrated == true on-chain.' : 'Pool is actively trading. Migration not initiated.',
    },
    ...(isMigrated ? [{
      id: 'CLAIM_MIGRATION_TRANSACTION',
      title: 'Migration Transaction Linkage',
      description: 'Successful DBC migration instruction references the originating pool',
      status: migrationProof.transactionConfirmed ? VerificationStatus.VERIFIED : migrationProof.status === 'DISCREPANCY' ? VerificationStatus.DISCREPANCY : VerificationStatus.INSUFFICIENT_DATA,
      confidence: migrationProof.transactionConfirmed ? 'DIRECT_FACT' as const : 'UNAVAILABLE' as const,
      value: migrationProof.transactionSignature ?? false,
      requiredEvidenceFound: migrationProof.transactionConfirmed,
      explanation: migrationProof.transactionConfirmed
        ? `Successful ${migrationProof.instruction} transaction ${migrationProof.transactionSignature} references this originating DBC pool. Asset flow and destination checks are reported separately.`
        : migrationProof.reasons.join(' '),
      discrepancyNote: migrationProof.status === 'DISCREPANCY' ? migrationProof.reasons.join(' ') : undefined,
    }] : []),
  ];

  if (isMigrated) {
    claims.push({
      id: 'CLAIM_DESTINATION_RECONCILIATION',
      title: 'Destination AMM Reconciliation',
      description: 'Instruction-linked destination account and historical source-to-destination asset flow',
      status: evaluation.status,
      confidence: 'DIRECT_FACT',
      value: destinationAddressConfirmed,
      requiredEvidenceFound: evaluation.status === VerificationStatus.VERIFIED,
      explanation: migrationProof.status === 'VERIFIED'
        ? 'The successful DBC migration instruction, SDK-derived destination, DAMM v2 account and transaction asset-flow evidence reconcile.'
        : destinationAddressConfirmed
          ? 'The instruction-linked destination PDA and DAMM v2 account decode, but complete source-to-destination asset-flow proof is not established.'
          : migrationProof.reasons.join(' ') || 'A transaction-linked DAMM v2 destination has not been confirmed.',
      discrepancyNote: migrationProof.status === 'DISCREPANCY' ? migrationProof.reasons.join(' ') : undefined,
    });
  }

  const evidence: EvidenceReference[] = [
    {
      type: 'ACCOUNT_STATE',
      label: 'On-Chain DBC VirtualPool',
      targetAddress: poolAddress,
      value: `Base: ${baseMintPubkey.toBase58().slice(0, 8)}... | Quote Vault: ${quoteVaultPubkey.toBase58().slice(0, 8)}...`,
      confidence: 'DIRECT_FACT',
    },
    {
      type: 'MIGRATION_FLAG',
      label: 'DBC migrated state',
      targetAddress: poolAddress,
      value: String(isMigrated),
      confidence: 'DIRECT_FACT',
      details: `Origin account observed at confirmed RPC slot ${observationSlot}.`,
    },
    {
      type: 'ACCOUNT_STATE',
      label: 'DBC pool configuration',
      targetAddress: configPubkey.toBase58(),
      value: `migrationOption=${migrationOptionNumber}; migrationFeeOption=${migrationFeeOptionNumber}; quoteMint=${quoteMintAddress}`,
      confidence: 'DIRECT_FACT',
      details: 'Configuration account owner and decode verified with the official DBC SDK.',
    },
    ...(migrationProof.dammConfigAddress ? [{
      type: 'ACCOUNT_STATE' as const,
      label: 'DAMM v2 migration configuration',
      targetAddress: migrationProof.dammConfigAddress,
      value: `owner=${migrationProof.dammConfigOwner}; sdkDecoded=${migrationProof.dammConfigDecoded}`,
      confidence: 'DIRECT_FACT' as const,
    }] : []),
    ...(migrationProof.derivedDestinationAddress ? [{
      type: 'PDA_SEED' as const,
      label: 'SDK-derived DAMM v2 destination',
      targetAddress: migrationProof.derivedDestinationAddress,
      value: `observed=${migrationProof.destinationAddress ?? 'unavailable'}`,
      confidence: 'SDK_DERIVED' as const,
      details: 'Derived from the verified DAMM config and the DBC base/quote mints using the installed official DBC SDK.',
    }] : []),
    ...(migrationProof.transactionSignature ? [{
      type: 'TRANSACTION_SIGNATURE' as const,
      label: 'DBC migration transaction',
      targetAddress: poolAddress,
      signature: migrationProof.transactionSignature,
      explorerUrl: `https://solscan.io/tx/${migrationProof.transactionSignature}`,
      value: `instruction=${migrationProof.instruction}; error=${migrationProof.transactionError ?? 'none'}; slot=${migrationProof.transactionSlot}`,
      confidence: migrationProof.transactionConfirmed ? 'DIRECT_FACT' as const : 'UNAVAILABLE' as const,
    }] : []),
    ...(migrationProof.assetFlowReconciled ? [{
      type: 'VAULT_BALANCE' as const,
      label: 'Historical migration asset-flow deltas',
      targetAddress: migrationProof.destinationAddress ?? undefined,
      signature: migrationProof.transactionSignature ?? undefined,
      value: `base=${migrationProof.baseVaultDeltaRaw}; quote=${migrationProof.quoteVaultDeltaRaw}`,
      confidence: 'DIRECT_FACT' as const,
      details: 'Raw integer token-balance changes from transaction metadata; current balances are separate observations.',
    }] : []),
  ];

  const canonicalHash = generateCanonicalHash({
    cluster,
    inputAddress,
    resolvedPoolAddress: poolAddress,
    status: evaluation.status,
    stage: evaluation.stage,
    claims,
    migrationProof,
    migrationClaims,
    observationSlot,
    destinationPool: {
      address: destinationState?.poolAddress ?? null,
      programId: destinationState?.programId ?? null,
      lpSupply: destinationState?.lpSupply ?? null,
      isLocked: destinationState?.lpLockedStatus ?? null,
      token0Mint: destinationState?.token0Mint ?? null,
      token1Mint: destinationState?.token1Mint ?? null,
      token0Vault: destinationState?.token0Vault ?? null,
      token1Vault: destinationState?.token1Vault ?? null,
      token0CurrentBalance: destinationState?.token0Balance ?? null,
      token1CurrentBalance: destinationState?.token1Balance ?? null,
      token0CurrentBalanceRaw: destinationState?.token0BalanceRaw ?? null,
      token1CurrentBalanceRaw: destinationState?.token1BalanceRaw ?? null,
      token0Decimals: destinationState?.token0Decimals ?? null,
      token1Decimals: destinationState?.token1Decimals ?? null,
    },
    dbcPool: {
      address: poolAddress,
      programId: METEORA_PROGRAMS.DBC_PROGRAM_ID,
      configAddress: configPubkey.toBase58(),
      baseMint: baseMintPubkey.toBase58(),
      quoteMint: quoteMintAddress,
      baseDecimals: baseTokenDecimals,
      quoteDecimals,
      migrationOption: migrationOptionNumber === 0 ? `Legacy DAMM v1 (${METEORA_PROGRAMS.DAMM_V1_PROGRAM_ID})` : 'Meteora DAMM v2 (CP-AMM)',
      migrationFeeOption: migrationFeeOptionNumber,
      migrationThreshold: formattedThreshold,
      isMigrated,
    },
  });

  return {
    receiptId: `rcpt_live_${poolAddress.slice(0, 8).toLowerCase()}`,
    canonicalHash,
    methodologyVersion: METHODOLOGY_VERSION,
    timestamp: new Date().toISOString(),
    observationSlot,
    cluster,
    isSimulatedFixture: false,
    inputAddress,
    resolvedType,
    resolvedPoolAddress: poolAddress,
    status: evaluation.status,
    stage: evaluation.stage,
    statusSummary: evaluation.summary,
    stageExplanation: evaluation.stageExplanation,
    dbcState: {
      poolAddress,
      programId: METEORA_PROGRAMS.DBC_PROGRAM_ID,
      baseMint: {
        address: baseMintPubkey.toBase58(),
        symbol: baseMintPubkey.toBase58().slice(0, 4).toUpperCase(),
        decimals: baseTokenDecimals,
      },
      quoteMint: {
        address: quoteMintAddress,
        symbol: quoteSymbol,
        decimals: quoteDecimals,
      },
      baseVault: baseVaultPubkey.toBase58(),
      quoteVault: quoteVaultPubkey.toBase58(),
      configAddress: configPubkey.toBase58(),
      migrationFeeOption: migrationFeeOptionNumber,
      migrationOption: migrationOptionNumber === 0 ? MigrationOption.DAMM_V1_LEGACY : MigrationOption.DAMM_V2_CP_AMM,
      migrationOptionLabel: migrationOptionNumber === 0 ? `Legacy DAMM v1 (${METEORA_PROGRAMS.DAMM_V1_PROGRAM_ID})` : 'Meteora DAMM v2 (CP-AMM)',
      migrationThresholdRaw: migrationThresholdLamports.toString(),
      migrationThresholdFormatted: formattedThreshold,
      virtualBaseReserves: '0',
      virtualQuoteReserves: '0',
      realBaseReserves: realBaseReserves.toString(),
      realQuoteReserves: realQuoteReserves.toString(),
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      isMigrated,
      migrationTargetAddress: destinationState?.poolAddress ?? null,
    },
    destinationState,
    migrationProof,
    migrationClaims,
    claims,
    evidence,
    missingEvidence: isMigrated && migrationProof.status !== 'VERIFIED'
      ? [
          ...(!migrationProof.transactionConfirmed ? ['Successful DBC migration transaction linked to an SDK-verified DAMM v2 pool'] : []),
          ...(migrationOptionNumber !== 1 ? ['Configured migration route is not DAMM v2 and this proof pipeline does not resolve it.'] : []),
          ...(!migrationProof.assetFlowReconciled && migrationProof.transactionConfirmed ? ['Historical source-to-destination asset-flow reconciliation'] : []),
          ...migrationProof.reasons,
        ]
      : isMigrated ? [] : ['Migration not executed on-chain'],
    limitations: [
      `Live on-chain verification executed against cluster '${cluster}'.`,
      `Origin pool observed at confirmed RPC context slot ${observationSlot}; dependent account reads are point-in-time and may use adjacent slots.`,
    ],
  };
}


function createEmptyFailureResult(
  inputAddress: string,
  cluster: VerificationCluster,
  resolvedType: AddressType,
  status: VerificationStatus,
  reason: string
): VerificationResult {
  const canonicalHash = generateCanonicalHash({
    cluster,
    inputAddress,
    resolvedPoolAddress: 'N/A',
    status,
    stage: PoolLifecycleStage.ACTIVE_TRADING,
    claims: [],
  });

  return {
    receiptId: `rcpt_err_${Date.now()}`,
    canonicalHash,
    methodologyVersion: METHODOLOGY_VERSION,
    timestamp: new Date().toISOString(),
    cluster,
    isSimulatedFixture: false,
    inputAddress,
    resolvedType,
    resolvedPoolAddress: 'N/A',
    status,
    stage: PoolLifecycleStage.ACTIVE_TRADING,
    statusSummary: reason,
    stageExplanation: 'Verification could not proceed due to missing or unsupported account data.',
    dbcState: {
      poolAddress: 'N/A',
      programId: 'N/A',
      baseMint: {
        address: 'N/A',
        decimals: 0,
      },
      quoteMint: {
        address: 'N/A',
        symbol: 'Unavailable',
        decimals: 0,
      },
      baseVault: 'N/A',
      quoteVault: 'N/A',
      configAddress: 'N/A',
      migrationOption: null,
      migrationOptionLabel: 'Unknown / unavailable',
      migrationThresholdRaw: 'N/A',
      migrationThresholdFormatted: 'Unavailable',
      virtualBaseReserves: 'N/A',
      virtualQuoteReserves: 'N/A',
      realBaseReserves: 'N/A',
      realQuoteReserves: 'N/A',
      progressPercentage: null,
      isMigrated: null,
      migrationTargetAddress: null,
    },
    destinationState: null,
    claims: [],
    evidence: [],
    missingEvidence: ['Account existence on-chain', 'DBC Pool data'],
    limitations: ['Target address could not be resolved on the queried cluster.'],
  };
}
