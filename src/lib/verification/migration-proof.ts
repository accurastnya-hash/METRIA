import { Connection, PublicKey } from '@solana/web3.js';
import {
  DAMM_V2_MIGRATION_FEE_ADDRESS,
  DynamicBondingCurveIdl,
  createDbcProgram,
  deriveDammV2PoolAddress,
} from '@meteora-ag/dynamic-bonding-curve-sdk';
import { CpAmm } from '@meteora-ag/cp-amm-sdk';
import { METEORA_PROGRAMS } from '../meteora/constants';

export type MigrationProofStatus = 'NOT_MIGRATED' | 'VERIFIED' | 'INCOMPLETE' | 'DISCREPANCY' | 'HISTORY_LIMIT_REACHED';

export interface MigrationProof {
  originPool: string;
  status: MigrationProofStatus;
  scannedSignatures: number;
  historyExhausted: boolean;
  limit: number;
  failedMigrationSignatures: string[];
  transactionSignature: string | null;
  transactionSlot: number | null;
  transactionTimestamp: string | null;
  transactionError: string | null;
  transactionConfirmed: boolean;
  instruction: string | null;
  destinationAddress: string | null;
  derivedDestinationAddress: string | null;
  dammConfigAddress: string | null;
  dammConfigOwner: string | null;
  dammConfigDecoded: boolean;
  destinationOwner: string | null;
  destinationDecoded: boolean;
  baseMint: string;
  quoteMint: string;
  baseDecimals: number;
  quoteDecimals: number;
  destinationBaseVault: string | null;
  destinationQuoteVault: string | null;
  baseVaultDeltaRaw: string | null;
  quoteVaultDeltaRaw: string | null;
  assetFlowEvaluated: boolean;
  assetFlowReconciled: boolean;
  reasons: string[];
}

export interface MigrationProofClaim {
  id: string;
  status: 'VERIFIED' | 'DISCREPANCY' | 'UNVERIFIED' | 'INSUFFICIENT_DATA';
  evidence: string[];
  cluster: string;
  accountAddresses: string[];
  transactionSignature: string | null;
  slot: number | null;
  timestamp: string | null;
  method: string;
  missingEvidence: string[];
  limitations: string[];
}

export function buildMigrationProofClaims(input: {
  proof: MigrationProof;
  cluster: string;
  originPool: string;
  config: string;
  thresholdMet: boolean;
  migrated: boolean;
  migrationOption: number;
  migrationFeeOption: number;
}): MigrationProofClaim[] {
  const { proof } = input;
  const notSupported = input.migrationOption !== 1;
  const common = {
    cluster: input.cluster,
    transactionSignature: proof.transactionSignature,
    slot: proof.transactionSlot,
    timestamp: proof.transactionTimestamp,
    limitations: ['Mainnet RPC history is bounded and subject to provider retention; no result outside the scanned scope is inferred.'],
  };
  const claim = (id: string, status: MigrationProofClaim['status'], evidence: string[], accountAddresses: string[], missingEvidence: string[]): MigrationProofClaim => ({
    id,
    status,
    evidence,
    accountAddresses,
    missingEvidence,
    method: 'Read-only Solana RPC plus installed official Meteora SDK/IDL',
    ...common,
  });
  return [
    claim('DBC_POOL_CONFIRMED', 'VERIFIED', ['Direct owner check and official DBC SDK VirtualPool decode'], [input.originPool, input.config], []),
    claim('GRADUATION_THRESHOLD_CONFIRMED', input.thresholdMet ? 'VERIFIED' : 'UNVERIFIED', [input.thresholdMet ? 'Decoded quote reserve meets or exceeds config threshold' : 'Decoded quote reserve is below config threshold'], [input.originPool, input.config], input.thresholdMet ? [] : ['Pool has not reached its configured graduation threshold.']),
    claim('MIGRATED_STATE_CONFIRMED', input.migrated ? 'VERIFIED' : 'UNVERIFIED', [`DBC SDK isMigrated=${input.migrated}`], [input.originPool], input.migrated ? [] : ['DBC account is not marked migrated.']),
    claim('MIGRATION_ROUTE_CONFIRMED', notSupported ? 'INSUFFICIENT_DATA' : 'VERIFIED', [`DBC config migrationOption=${input.migrationOption}; migrationFeeOption=${input.migrationFeeOption}`], [input.config], notSupported ? ['This pipeline only proves DAMM v2 migrationOption=1.'] : []),
    claim('DESTINATION_CANDIDATE_FOUND', proof.destinationAddress ? 'VERIFIED' : 'UNVERIFIED', proof.destinationAddress ? [`Migration instruction account ${proof.destinationAddress}`] : [], proof.destinationAddress ? [proof.destinationAddress] : [], proof.destinationAddress ? [] : [input.migrated ? 'No successful instruction-linked destination candidate was observed.' : 'No destination is expected because the DBC account is not marked migrated.']),
    claim('DESTINATION_ADDRESS_CONFIRMED', proof.derivedDestinationAddress && proof.derivedDestinationAddress === proof.destinationAddress && proof.destinationDecoded && proof.destinationOwner === METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID ? 'VERIFIED' : proof.status === 'DISCREPANCY' ? 'DISCREPANCY' : input.migrated ? 'INSUFFICIENT_DATA' : 'UNVERIFIED', [proof.derivedDestinationAddress ? `SDK-derived=${proof.derivedDestinationAddress}` : '', proof.destinationOwner ? `owner=${proof.destinationOwner}; sdkDecoded=${proof.destinationDecoded}` : ''].filter(Boolean), [proof.dammConfigAddress, proof.destinationAddress].filter((value): value is string => Boolean(value)), proof.destinationDecoded ? [] : [input.migrated ? 'Destination owner, PDA, or DAMM v2 SDK pool decode has not been confirmed.' : 'No destination is expected before migration.']),
    claim('MIGRATION_TRANSACTION_CONFIRMED', proof.transactionConfirmed ? 'VERIFIED' : proof.status === 'DISCREPANCY' && proof.transactionSignature ? 'DISCREPANCY' : input.migrated ? 'INSUFFICIENT_DATA' : 'UNVERIFIED', proof.transactionSignature ? [`Successful ${proof.instruction ?? 'instruction'} references this DBC source; slot ${proof.transactionSlot ?? 'unknown'}`] : [], [input.originPool, proof.destinationAddress].filter((value): value is string => Boolean(value)), proof.transactionConfirmed ? [] : input.migrated ? proof.reasons.length ? proof.reasons : ['No successful source-linked migration transaction verified.'] : ['DBC is not marked migrated; no migration transaction is expected yet.']),
    claim('ASSET_FLOW_RECONCILED', proof.assetFlowReconciled ? 'VERIFIED' : !input.migrated ? 'UNVERIFIED' : proof.assetFlowEvaluated ? 'DISCREPANCY' : 'INSUFFICIENT_DATA', [proof.baseVaultDeltaRaw ?? '', proof.quoteVaultDeltaRaw ?? ''].filter(Boolean), [input.originPool, proof.destinationBaseVault, proof.destinationQuoteVault].filter((value): value is string => Boolean(value)), proof.assetFlowReconciled ? [] : [input.migrated ? 'Transaction metadata does not establish positive source outflow and destination inflow for both mints.' : 'No migration has occurred to reconcile asset flow.']),
  ];
}

const MAX_HISTORY_SIGNATURES = 200;
const PAGE_SIZE = 50;
const MAX_HISTORY_SCAN_MS = 15_000;
const RPC_CALL_TIMEOUT_MS = 5_000;

async function withRpcTimeout<T>(operation: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${RPC_CALL_TIMEOUT_MS}ms`)), RPC_CALL_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type RpcIx = { programIdIndex: number; accountKeyIndexes?: number[]; accounts?: number[]; data: Uint8Array | string };
export type RpcMessage = {
  staticAccountKeys?: PublicKey[];
  accountKeys?: PublicKey[];
  compiledInstructions?: RpcIx[];
  instructions?: RpcIx[];
};

export function resolveTransactionAccountKeys(message: RpcMessage, loaded?: { writable: PublicKey[]; readonly: PublicKey[] }): string[] {
  return [
    ...(message.staticAccountKeys ?? message.accountKeys ?? []).map((key) => key.toBase58()),
    ...(loaded?.writable ?? []).map((key) => key.toBase58()),
    ...(loaded?.readonly ?? []).map((key) => key.toBase58()),
  ];
}

function ixIndexes(ix: RpcIx): number[] {
  return ix.accountKeyIndexes ?? ix.accounts ?? [];
}

function ixBytes(data: Uint8Array | string): Uint8Array {
  if (typeof data !== 'string') return Buffer.from(data);
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let decoded = BigInt(0);
  for (const character of data) {
    const digit = alphabet.indexOf(character);
    if (digit < 0) throw new Error('Invalid base58 instruction data.');
    decoded = decoded * BigInt(58) + BigInt(digit);
  }
  const bytes: number[] = [];
  while (decoded > BigInt(0)) {
    bytes.unshift(Number(decoded % BigInt(256)));
    decoded /= BigInt(256);
  }
  const leadingZeroes = data.match(/^1*/)?.[0].length ?? 0;
  return Buffer.from([...Array(leadingZeroes).fill(0), ...bytes]);
}

function tokenAmount(
  balances: Array<{ accountIndex: number; mint: string; uiTokenAmount: { amount: string } }> | null | undefined,
  accountIndex: number,
  mint: string,
): bigint | null {
  const balance = balances?.find((entry) => entry.accountIndex === accountIndex && entry.mint === mint);
  return balance ? BigInt(balance.uiTokenAmount.amount) : null;
}

function accountMint(owner: string, data: Buffer): string | null {
  const tokenPrograms = [
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  ];
  return tokenPrograms.includes(owner) && data.length >= 165 ? new PublicKey(data.subarray(0, 32)).toBase58() : null;
}

export function isValidDammV2Account(owner: string, executable: boolean, sdkDecoded: boolean): boolean {
  return owner === METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID && !executable && sdkDecoded;
}

export function migrationInstructionMatchesOrigin(instructionSource: string | null, claimedPool: string): boolean {
  return instructionSource === claimedPool;
}

export function isDerivedDestinationAddress(observed: string, derived: string): boolean {
  return observed === derived;
}

export async function findDammV2MigrationProof(args: {
  connection: Connection;
  poolAddress: string;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseDecimals: number;
  quoteDecimals: number;
  baseVault: PublicKey;
  quoteVault: PublicKey;
  migrationFeeOption: number;
  migrated: boolean;
  maxSignatures?: number;
}): Promise<MigrationProof> {
  const limit = Math.max(1, Math.min(args.maxSignatures ?? MAX_HISTORY_SIGNATURES, MAX_HISTORY_SIGNATURES));
  const base: MigrationProof = {
    originPool: args.poolAddress,
    status: 'INCOMPLETE' as MigrationProofStatus,
    scannedSignatures: 0,
    historyExhausted: false,
    limit,
    failedMigrationSignatures: [] as string[],
    transactionSignature: null,
    transactionSlot: null,
    transactionTimestamp: null,
    transactionError: null,
    transactionConfirmed: false,
    instruction: null,
    destinationAddress: null,
    derivedDestinationAddress: null,
    dammConfigAddress: null,
    dammConfigOwner: null,
    dammConfigDecoded: false,
    destinationOwner: null,
    destinationDecoded: false,
    baseMint: args.baseMint.toBase58(),
    quoteMint: args.quoteMint.toBase58(),
    baseDecimals: args.baseDecimals,
    quoteDecimals: args.quoteDecimals,
    destinationBaseVault: null,
    destinationQuoteVault: null,
    baseVaultDeltaRaw: null,
    quoteVaultDeltaRaw: null,
    assetFlowEvaluated: false,
    assetFlowReconciled: false,
    reasons: [] as string[],
  };
  if (!args.migrated) return { ...base, status: 'NOT_MIGRATED', historyExhausted: true };

  const dbcProgram = createDbcProgram(args.connection).program;
  const instructionDef = DynamicBondingCurveIdl.instructions.find((ix) => ix.name === 'migration_damm_v2');
  if (!instructionDef) return { ...base, status: 'INCOMPLETE', reasons: ['Installed DBC SDK does not expose migration_damm_v2 IDL.'] };
  const keysByName = new Map(instructionDef.accounts.map((account, index) => [account.name, index]));
  const poolAccountIndex = keysByName.get('pool');
  const sourceAccountIndex = keysByName.get('virtual_pool');
  const ammProgramIndex = keysByName.get('amm_program');
  const baseMintIndex = keysByName.get('base_mint');
  const quoteMintIndex = keysByName.get('quote_mint');
  const baseVaultIndex = keysByName.get('base_vault');
  const quoteVaultIndex = keysByName.get('quote_vault');
  const tokenAVaultIndex = keysByName.get('token_a_vault');
  const tokenBVaultIndex = keysByName.get('token_b_vault');
  const namedIndexes = [poolAccountIndex, sourceAccountIndex, ammProgramIndex, baseMintIndex, quoteMintIndex,
    baseVaultIndex, quoteVaultIndex, tokenAVaultIndex, tokenBVaultIndex];
  if (namedIndexes.some((index) => index === undefined)) {
    return { ...base, status: 'INCOMPLETE', reasons: ['Installed DBC migration instruction account layout is unsupported.'] };
  }

  let before: string | undefined;
  let moreHistory = true;
  const cpAmm = new CpAmm(args.connection);
  const fixedDammConfig = DAMM_V2_MIGRATION_FEE_ADDRESS[args.migrationFeeOption];
  const scanStartedAt = Date.now();
  try {
   while (moreHistory && base.scannedSignatures < limit) {
    if (Date.now() - scanStartedAt >= MAX_HISTORY_SCAN_MS) {
      base.status = 'HISTORY_LIMIT_REACHED';
      base.reasons.push(`Migration history scan stopped at its ${MAX_HISTORY_SCAN_MS}ms time limit.`);
      return base;
    }
    const pageLimit = Math.min(PAGE_SIZE, limit - base.scannedSignatures);
    const page = await withRpcTimeout(args.connection.getSignaturesForAddress(new PublicKey(args.poolAddress), {
      limit: pageLimit,
      ...(before ? { before } : {}),
    }, 'confirmed'), 'getSignaturesForAddress');
    if (page.length === 0) {
      base.historyExhausted = true;
      break;
    }
    for (const signatureInfo of page) {
      base.scannedSignatures += 1;
      const tx = await withRpcTimeout(args.connection.getTransaction(signatureInfo.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      }), 'getTransaction');
      if (!tx) {
        base.reasons.push(`Transaction details unavailable for signature ${signatureInfo.signature}.`);
        continue;
      }
      const message = tx.transaction.message as unknown as RpcMessage;
      const keys = resolveTransactionAccountKeys(message, tx.meta?.loadedAddresses);
      const instructions = message.compiledInstructions ?? message.instructions ?? [];
      const inner = (tx.meta?.innerInstructions ?? []).flatMap((group) => group.instructions as unknown as RpcIx[]);
      let foundThisTx = false;
      for (const ix of [...instructions, ...inner]) {
        if (keys[ix.programIdIndex] !== METEORA_PROGRAMS.DBC_PROGRAM_ID) continue;
        let decoded: { name: string } | null;
        try {
          decoded = (dbcProgram.coder.instruction as unknown as { decode(data: Uint8Array): { name: string } | null }).decode(ixBytes(ix.data));
        } catch { continue; }
        if (decoded?.name !== 'migrationDammV2') continue;
        const indexes = ixIndexes(ix);
        const get = (index: number | undefined) => index === undefined || indexes[index] === undefined ? null : keys[indexes[index]] ?? null;
        const source = get(sourceAccountIndex!);
        const destination = get(poolAccountIndex!);
        if (!migrationInstructionMatchesOrigin(source, args.poolAddress) || !destination) continue;
        foundThisTx = true;
        base.transactionSignature = signatureInfo.signature;
        base.transactionSlot = tx.slot;
        base.transactionTimestamp = tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null;
        base.instruction = decoded.name;
        base.destinationAddress = destination;
        if (tx.meta?.err) {
          base.failedMigrationSignatures.push(signatureInfo.signature);
          base.transactionError = JSON.stringify(tx.meta.err);
          base.reasons.push(`Migration instruction failed in ${signatureInfo.signature}; it is not treated as migration proof.`);
          // Keep searching for a successful attempt.
          base.transactionSignature = null;
          base.destinationAddress = null;
          base.transactionSlot = null;
          base.transactionTimestamp = null;
          base.instruction = null;
          continue;
        }
        base.transactionError = null;
        base.transactionConfirmed = true;
        const ammProgram = get(ammProgramIndex!);
        const instructionBaseMint = get(baseMintIndex!);
        const instructionQuoteMint = get(quoteMintIndex!);
        if (ammProgram !== METEORA_PROGRAMS.DAMM_V2_PROGRAM_ID || instructionBaseMint !== args.baseMint.toBase58() || instructionQuoteMint !== args.quoteMint.toBase58()) {
          base.status = 'DISCREPANCY';
          base.reasons.push('Successful migration instruction program or mint accounts disagree with expected DBC/DAMM v2 state.');
          return base;
        }
        let dammConfig: PublicKey | undefined = fixedDammConfig;
        // Customizable migration fee option carries the DAMM config as a remaining account after the fixed IDL accounts.
        if (args.migrationFeeOption === 6) {
          const remainingConfig = indexes[instructionDef.accounts.length];
          dammConfig = remainingConfig === undefined ? undefined : new PublicKey(keys[remainingConfig]);
        }
        if (!dammConfig) {
          base.status = 'DISCREPANCY';
          base.reasons.push(`Unsupported DAMM v2 migration fee option ${args.migrationFeeOption}; no authoritative DAMM config mapping is available.`);
          return base;
        }
        base.dammConfigAddress = dammConfig.toBase58();
        const dammConfigInfo = await args.connection.getAccountInfo(dammConfig, 'confirmed');
        base.dammConfigOwner = dammConfigInfo?.owner.toBase58() ?? null;
        if (!dammConfigInfo || !isValidDammV2Account(base.dammConfigOwner ?? '', dammConfigInfo.executable, true)) {
          base.status = 'DISCREPANCY';
          base.reasons.push('DAMM v2 config account is missing, executable, or owned by a different program.');
          return base;
        }
        try {
          await cpAmm.fetchConfigState(dammConfig);
          base.dammConfigDecoded = true;
        } catch (error) {
          base.status = 'DISCREPANCY';
          base.reasons.push(`Installed DAMM v2 SDK failed to decode migration config: ${error instanceof Error ? error.message : String(error)}`);
          return base;
        }
        const derived = deriveDammV2PoolAddress(dammConfig, args.baseMint, args.quoteMint).toBase58();
        base.derivedDestinationAddress = derived;
        if (!isDerivedDestinationAddress(destination, derived)) {
          base.status = 'DISCREPANCY';
          base.reasons.push(`Instruction destination ${destination} does not match SDK-derived DAMM v2 PDA ${derived}.`);
          return base;
        }
        const destinationInfo = await args.connection.getAccountInfo(new PublicKey(destination), 'confirmed');
        base.destinationOwner = destinationInfo?.owner.toBase58() ?? null;
        if (!destinationInfo || !isValidDammV2Account(base.destinationOwner ?? '', destinationInfo.executable, true)) {
          base.status = 'DISCREPANCY';
          base.reasons.push('Destination account is missing, executable, or not owned by the DAMM v2 program.');
          return base;
        }
        let destinationState;
        try {
          destinationState = await cpAmm.fetchPoolState(new PublicKey(destination));
          base.destinationDecoded = true;
        } catch (error) {
          base.status = 'DISCREPANCY';
          base.reasons.push(`Installed DAMM v2 SDK failed to decode destination pool: ${error instanceof Error ? error.message : String(error)}`);
          return base;
        }
        if (!isValidDammV2Account(base.destinationOwner ?? '', destinationInfo.executable, base.destinationDecoded)) {
          base.status = 'DISCREPANCY';
          base.reasons.push('DAMM destination owner or SDK decoding does not match the claimed account type.');
          return base;
        }
        const tokenAMint = destinationState.tokenAMint.toBase58();
        const tokenBMint = destinationState.tokenBMint.toBase58();
        const mintPairValid = [tokenAMint, tokenBMint].includes(args.baseMint.toBase58()) && [tokenAMint, tokenBMint].includes(args.quoteMint.toBase58());
        const tokenAVault = destinationState.tokenAVault.toBase58();
        const tokenBVault = destinationState.tokenBVault.toBase58();
        base.destinationBaseVault = tokenAMint === args.baseMint.toBase58() ? tokenAVault : tokenBVault;
        base.destinationQuoteVault = tokenAMint === args.quoteMint.toBase58() ? tokenAVault : tokenBVault;
        if (!mintPairValid || get(tokenAVaultIndex!) !== tokenAVault || get(tokenBVaultIndex!) !== tokenBVault ||
            get(baseVaultIndex!) !== args.baseVault.toBase58() || get(quoteVaultIndex!) !== args.quoteVault.toBase58()) {
          base.status = 'DISCREPANCY';
          base.reasons.push('Destination SDK state mints/vaults do not match the successful DBC migration instruction accounts.');
          return base;
        }
        const destinationBaseVault = base.destinationBaseVault;
        const destinationQuoteVault = base.destinationQuoteVault;
        if (!destinationBaseVault || !destinationQuoteVault) {
          base.status = 'DISCREPANCY';
          base.reasons.push('Could not map DAMM destination vaults to the origin base and quote mints.');
          return base;
        }
        const destinationBaseInfo = await args.connection.getAccountInfo(new PublicKey(destinationBaseVault), 'confirmed');
        const destinationQuoteInfo = await args.connection.getAccountInfo(new PublicKey(destinationQuoteVault), 'confirmed');
        if (!destinationBaseInfo || !destinationQuoteInfo ||
            accountMint(destinationBaseInfo.owner.toBase58(), destinationBaseInfo.data) !== args.baseMint.toBase58() ||
            accountMint(destinationQuoteInfo.owner.toBase58(), destinationQuoteInfo.data) !== args.quoteMint.toBase58()) {
          base.status = 'DISCREPANCY';
          base.reasons.push('Destination vault accounts are missing or their token-account mint fields disagree with the DAMM pool.');
          return base;
        }
        const baseIndex = keys.indexOf(args.baseVault.toBase58());
        const quoteIndex = keys.indexOf(args.quoteVault.toBase58());
        const destBaseIndex = keys.indexOf(destinationBaseVault);
        const destQuoteIndex = keys.indexOf(destinationQuoteVault);
        const pre = tx.meta?.preTokenBalances ?? [];
        const post = tx.meta?.postTokenBalances ?? [];
        const basePre = baseIndex >= 0 ? tokenAmount(pre, baseIndex, args.baseMint.toBase58()) : null;
        const basePost = baseIndex >= 0 ? tokenAmount(post, baseIndex, args.baseMint.toBase58()) : null;
        const baseDestPre = destBaseIndex >= 0 ? tokenAmount(pre, destBaseIndex, args.baseMint.toBase58()) : null;
        const baseDestPost = destBaseIndex >= 0 ? tokenAmount(post, destBaseIndex, args.baseMint.toBase58()) : null;
        const quotePre = quoteIndex >= 0 ? tokenAmount(pre, quoteIndex, args.quoteMint.toBase58()) : null;
        const quotePost = quoteIndex >= 0 ? tokenAmount(post, quoteIndex, args.quoteMint.toBase58()) : null;
        const quoteDestPre = destQuoteIndex >= 0 ? tokenAmount(pre, destQuoteIndex, args.quoteMint.toBase58()) : null;
        const quoteDestPost = destQuoteIndex >= 0 ? tokenAmount(post, destQuoteIndex, args.quoteMint.toBase58()) : null;
        if (basePre === null || basePost === null || baseDestPost === null || quotePre === null || quotePost === null || quoteDestPost === null) {
          base.status = 'INCOMPLETE';
          base.reasons.push('Transaction token-balance metadata does not include all source and destination vault balances.');
          return base;
        }
        base.assetFlowEvaluated = true;
        const baseOutflow = basePre - basePost;
        const quoteOutflow = quotePre - quotePost;
        const baseInflow = baseDestPost - (baseDestPre ?? BigInt(0));
        const quoteInflow = quoteDestPost - (quoteDestPre ?? BigInt(0));
        base.baseVaultDeltaRaw = `${baseOutflow.toString()} out / ${baseInflow.toString()} in`;
        base.quoteVaultDeltaRaw = `${quoteOutflow.toString()} out / ${quoteInflow.toString()} in`;
        base.assetFlowReconciled = baseOutflow > BigInt(0) && quoteOutflow > BigInt(0) && baseInflow > BigInt(0) && quoteInflow > BigInt(0);
        if (!base.assetFlowReconciled) {
          base.status = 'DISCREPANCY';
          base.reasons.push('Successful migration transaction does not show positive source-vault outflow and destination-vault inflow for both mints.');
          return base;
        }
        base.status = 'VERIFIED';
        base.reasons = [];
        return base;
      }
      if (!foundThisTx && tx.meta?.err) continue;
    }
    before = page[page.length - 1]?.signature;
    moreHistory = page.length === pageLimit;
    if (!moreHistory) base.historyExhausted = true;
   }
  } catch (error) {
    base.status = 'INCOMPLETE';
    base.reasons.push(`RPC history or account validation failed before sufficient proof was available: ${error instanceof Error ? error.message : String(error)}`);
    return base;
  }
  if (base.status !== 'DISCREPANCY' && base.transactionSignature === null) {
    if (base.scannedSignatures >= limit && !base.historyExhausted) {
      base.status = 'HISTORY_LIMIT_REACHED';
      base.reasons.push(`No successful DBC migration found within the ${limit}-signature history scan limit.`);
    } else {
      base.status = 'INCOMPLETE';
      base.reasons.push('No successful migration_damm_v2 transaction was found in the available DBC pool history.');
    }
  }
  return base;
}
