/**
 * METRIA — Canonical Verification Receipt & Hashing Engine
 * Produces deterministic, reproducible cryptographic receipts
 */

import { createHash } from 'crypto';
import {
  VerificationResult,
  VerificationReceiptPayload,
} from '../verification/types';

/**
 * Creates a deterministic canonical representation of the claims and core verification outcome
 */
export function generateCanonicalHash(payload: {
  cluster: string;
  inputAddress: string;
  resolvedPoolAddress: string;
  status: string;
  stage: string;
  claims: Array<{ id: string; status: string; value: unknown }>;
  migrationProof?: VerificationReceiptPayload['migrationProof'];
  migrationClaims?: VerificationReceiptPayload['migrationClaims'];
  observationSlot?: number;
  destinationPool?: VerificationReceiptPayload['destinationPool'] | null;
  dbcPool?: VerificationReceiptPayload['dbcPool'];
}): string {
  // Sort claims deterministically by id
  const sortedClaims = [...payload.claims]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => `${c.id}:${c.status}:${String(c.value)}`);

  const canonicalObj = {
    c: payload.cluster,
    i: payload.inputAddress,
    p: payload.resolvedPoolAddress,
    s: payload.status,
    st: payload.stage,
    cl: sortedClaims,
    ...(payload.migrationProof ? { mp: payload.migrationProof } : {}),
    ...(payload.migrationClaims ? { mc: payload.migrationClaims } : {}),
    ...(payload.observationSlot !== undefined ? { os: payload.observationSlot } : {}),
    ...(payload.migrationProof ? { dp: payload.destinationPool ?? null } : {}),
    ...(payload.migrationProof ? { db: payload.dbcPool ?? null } : {}),
  };

  const serialized = JSON.stringify(canonicalObj);
  return createHash('sha256').update(serialized).digest('hex');
}

/**
 * Formats a VerificationResult into an exportable, portable VerificationReceiptPayload
 */
export function buildVerificationReceipt(
  result: VerificationResult
): VerificationReceiptPayload {
  const evidenceSigs: string[] = [];
  if (result.dbcState.migratedTxSignature) {
    evidenceSigs.push(result.dbcState.migratedTxSignature);
  }
  if (result.migrationProof?.transactionSignature && !evidenceSigs.includes(result.migrationProof.transactionSignature)) {
    evidenceSigs.push(result.migrationProof.transactionSignature);
  }
  result.evidence.forEach((e) => {
    if (e.signature && !evidenceSigs.includes(e.signature)) {
      evidenceSigs.push(e.signature);
    }
  });

  return {
    receiptId: result.receiptId,
    canonicalHash: result.canonicalHash,
    methodologyVersion: result.methodologyVersion,
    verificationTimestamp: result.timestamp,
    ...(result.observationSlot !== undefined ? { observationSlot: result.observationSlot } : {}),
    cluster: result.cluster,
    isSimulatedFixture: result.isSimulatedFixture,
    inputAddress: result.inputAddress,
    resolvedPoolAddress: result.resolvedPoolAddress,
    status: result.status,
    stage: result.stage,
    claimsSummary: result.claims.map((c) => ({
      claimId: c.id,
      status: c.status,
      value: c.value,
    })),
    dbcPool: {
      address: result.dbcState.poolAddress,
      programId: result.dbcState.programId,
      configAddress: result.dbcState.configAddress,
      baseMint: result.dbcState.baseMint.address,
      quoteMint: result.dbcState.quoteMint.address,
      baseDecimals: result.dbcState.baseMint.decimals,
      quoteDecimals: result.dbcState.quoteMint.decimals,
      migrationOption: result.dbcState.migrationOptionLabel,
      ...(result.dbcState.migrationFeeOption !== undefined ? { migrationFeeOption: result.dbcState.migrationFeeOption } : {}),
      migrationThreshold: result.dbcState.migrationThresholdFormatted,
      isMigrated: result.dbcState.isMigrated,
    },
    destinationPool: {
      address: result.destinationState?.poolAddress ?? null,
      programId: result.destinationState?.programId ?? null,
      lpSupply: result.destinationState?.lpSupply ?? null,
      isLocked: result.destinationState?.lpLockedStatus ?? null,
      token0Mint: result.destinationState?.token0Mint ?? null,
      token1Mint: result.destinationState?.token1Mint ?? null,
      token0Vault: result.destinationState?.token0Vault ?? null,
      token1Vault: result.destinationState?.token1Vault ?? null,
      token0CurrentBalance: result.destinationState?.token0Balance ?? null,
      token1CurrentBalance: result.destinationState?.token1Balance ?? null,
      token0CurrentBalanceRaw: result.destinationState?.token0BalanceRaw ?? null,
      token1CurrentBalanceRaw: result.destinationState?.token1BalanceRaw ?? null,
      token0Decimals: result.destinationState?.token0Decimals ?? null,
      token1Decimals: result.destinationState?.token1Decimals ?? null,
    },
    evidenceSignatures: evidenceSigs,
    missingEvidenceCount: result.missingEvidence.length,
    ...(result.migrationProof ? { migrationProof: result.migrationProof } : {}),
    ...(result.migrationClaims ? { migrationClaims: result.migrationClaims } : {}),
  };
}

/**
 * Recomputes and verifies the cryptographic integrity of a VerificationReceiptPayload
 */
export function verifyReceiptIntegrity(payload: VerificationReceiptPayload): {
  isValid: boolean;
  recomputedHash: string;
} {
  const claims = payload.claimsSummary.map((c) => ({
    id: c.claimId,
    status: c.status,
    value: c.value,
  }));

  const recomputedHash = generateCanonicalHash({
    cluster: payload.cluster,
    inputAddress: payload.inputAddress,
    resolvedPoolAddress: payload.resolvedPoolAddress,
    status: payload.status,
    stage: payload.stage,
    claims,
    migrationProof: payload.migrationProof,
    migrationClaims: payload.migrationClaims,
    observationSlot: payload.observationSlot,
    ...(payload.migrationProof ? { destinationPool: payload.destinationPool } : {}),
    ...(payload.migrationProof ? { dbcPool: payload.dbcPool } : {}),
  });

  return {
    isValid: recomputedHash === payload.canonicalHash,
    recomputedHash,
  };
}

/**
 * Generates an audit-ready, human-readable markdown / text report
 */
export function formatHumanReadableReport(result: VerificationResult): string {
  const divider = '================================================================================';
  const claimsText = result.claims
    .map(
      (c) =>
        `[${c.status.padEnd(12)}] ${c.title}\n  - Verdict: ${c.explanation}\n  - Value: ${c.value} (Confidence: ${c.confidence})`
    )
    .join('\n\n');

  const missingText =
    result.missingEvidence.length > 0
      ? result.missingEvidence.map((m) => `  * ${m}`).join('\n')
      : '  None (all required protocol evidence reconciled)';

  return `METRIA VERIFICATION RECEIPT
${divider}
Receipt ID:            ${result.receiptId}
Canonical SHA-256:     ${result.canonicalHash}
Timestamp (UTC):       ${result.timestamp}
RPC Observation Slot:  ${result.observationSlot ?? 'unavailable'}
Cluster:               ${result.cluster}
Methodology:           v${result.methodologyVersion}

VERIFICATION RESULT
${divider}
Overall Status:        ${result.status}
Lifecycle Stage:       ${result.stage}
Summary:               ${result.statusSummary}

DBC POOL DETAILS
${divider}
Pool Address:          ${result.dbcState.poolAddress}
DBC Program ID:        ${result.dbcState.programId}
DBC Configuration:     ${result.dbcState.configAddress}
Base Token Mint:       ${result.dbcState.baseMint.address} (${result.dbcState.baseMint.symbol ?? 'Unknown'})
Quote Token Mint:      ${result.dbcState.quoteMint.address} (${result.dbcState.quoteMint.symbol})
Configured Migration:  ${result.dbcState.migrationOptionLabel}
Migration Threshold:   ${result.dbcState.migrationThresholdFormatted}
Graduation Progress:   ${result.dbcState.progressPercentage === null ? 'Unavailable' : `${result.dbcState.progressPercentage.toFixed(2)}%`}
Migration Confirmed:   ${result.dbcState.isMigrated === null ? 'UNKNOWN' : result.dbcState.isMigrated ? 'YES' : 'NO'}

MIGRATION PROOF
${divider}
Proof status:          ${result.migrationProof?.status ?? 'NOT AVAILABLE'}
History scanned:       ${result.migrationProof?.scannedSignatures ?? 0} / ${result.migrationProof?.limit ?? 0} signatures
Search exhausted:      ${result.migrationProof?.historyExhausted ?? false}
Derived destination:   ${result.migrationProof?.derivedDestinationAddress ?? 'N/A'}
Observed destination:  ${result.migrationProof?.destinationAddress ?? 'N/A'}
Migration transaction: ${result.migrationProof?.transactionSignature ?? 'N/A'}
Decoded instruction:   ${result.migrationProof?.instruction ?? 'N/A'}
Asset flow reconciled: ${result.migrationProof?.assetFlowReconciled ?? false}

DESTINATION POOL RECONCILIATION
${divider}
Destination Pool:      ${result.destinationState?.poolAddress ?? 'N/A (Not Migrated / Unresolved)'}
Target Program:        ${result.destinationState?.programLabel ?? 'N/A'}
LP Lock / Custody:     ${result.destinationState?.lpLockedStatus ?? 'N/A'}

EVALUATED ON-CHAIN CLAIMS
${divider}
${claimsText}

MISSING OR UNVERIFIABLE EVIDENCE
${divider}
${missingText}

DISCLOSURE
${divider}
METRIA is an independent builder project for the Meteora ecosystem. It is not an official Meteora product.
Point-in-time observation does not guarantee future solvency or protect against market risk.
${divider}`;
}
