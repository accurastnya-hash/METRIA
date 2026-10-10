'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  RefreshCw,
  Share2,
  FileCode,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { VerificationResult, VerificationCluster } from '@/lib/verification/types';
import { VerificationStatus } from '@/lib/meteora/constants';
import { StatusBadge } from '@/components/ui/Badge';
import { LifecycleTimeline } from '@/components/verification/LifecycleTimeline';
import { PoolConfigCard } from '@/components/verification/PoolConfigCard';
import { DestinationEvidenceCard } from '@/components/verification/DestinationEvidenceCard';
import { MigrationProofCard } from '@/components/verification/MigrationProofCard';
import { ClaimsTable } from '@/components/verification/ClaimsTable';
import { ReceiptModal } from '@/components/verification/ReceiptModal';
import {
  FIXTURE_GRADUATED_DAMM_V2,
  FIXTURE_THRESHOLD_REACHED_UNMIGRATED,
  FIXTURE_ACTIVE_CURVE,
  FIXTURE_DISCREPANCY_FAULTY_DESTINATION,
} from '@/lib/fixtures/pools';

function VerifyWorkspace() {
  const searchParams = useSearchParams();
  const initialAddress = searchParams.get('address') || '';

  const [addressInput, setAddressInput] = useState(initialAddress);
  const [cluster, setCluster] = useState<VerificationCluster>('mainnet-beta');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const performVerification = async (targetAddr: string, targetCluster: VerificationCluster) => {
    if (!targetAddr.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/v1/verification/${encodeURIComponent(targetAddr.trim())}?cluster=${targetCluster}`
      );
      const json = await res.json();

      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setErrorMessage(json.error?.message || 'Verification could not be processed.');
        setResult(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Network or RPC error: ${msg}`);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialAddress) {
      queueMicrotask(() => { void performVerification(initialAddress, cluster); });
    }
  }, [initialAddress, cluster]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(addressInput, cluster);
  };

  const handleSelectScenario = (addr: string) => {
    setAddressInput(addr);
    performVerification(addr, 'simulated-fixture');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
          Lifecycle Verification Workspace
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Enter a Solana token mint or Meteora Dynamic Bonding Curve pool address to independently
          verify curve parameters, graduation triggers, migration destination, and post-migration liquidity.
        </p>
      </div>

      {/* Search & Cluster Controls */}
      <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-5 mb-8 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter Token Mint or DBC Pool (e.g. NovA1111...)"
              className="w-full bg-[#080B11] border border-[#1E2738] focus:border-[#C5F36B] rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={cluster}
              onChange={(e) => setCluster(e.target.value as VerificationCluster)}
              className="bg-[#080B11] border border-[#1E2738] rounded-xl px-4 py-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#C5F36B]"
            >
              <option value="mainnet-beta">Solana Mainnet-Beta</option>
              <option value="devnet">Solana Devnet</option>
              <option value="simulated-fixture">Simulated / Demonstration Fixture</option>
            </select>

            <button
              type="submit"
              disabled={isLoading || !addressInput.trim()}
              className="px-6 py-3 rounded-xl bg-[#C5F36B] hover:bg-[#B6E95B] disabled:opacity-50 text-[#080B11] font-semibold text-xs sm:text-sm font-mono transition-all flex items-center gap-2 shadow-md shadow-[#C5F36B]/20 shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Verify</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Testbed Scenarios */}
        <div className="mt-4 pt-4 border-t border-[#1A2233] space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-[#C5F36B] font-semibold text-[11px] flex items-center gap-1">
              <span>●</span> Live Mainnet DBC Pools:
            </span>
            <button
              type="button"
              onClick={() => {
                setAddressInput('FrvcJryeuBhPnB8NS854rdfzjbLrc6gGuMF4vpAkcxFC');
                setCluster('mainnet-beta');
                performVerification('FrvcJryeuBhPnB8NS854rdfzjbLrc6gGuMF4vpAkcxFC', 'mainnet-beta');
              }}
              className="px-2.5 py-1 rounded bg-[#C5F36B]/10 text-[#C5F36B] hover:bg-[#C5F36B]/20 border border-[#C5F36B]/30 transition-all flex items-center gap-1.5"
            >
              <span>win big - USDC (Live Mainnet Pool)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAddressInput('6D8TbMnPY3yJUra8p4JhqYCHfP6JcKeu6sxF1eciaTtU');
                setCluster('mainnet-beta');
                performVerification('6D8TbMnPY3yJUra8p4JhqYCHfP6JcKeu6sxF1eciaTtU', 'mainnet-beta');
              }}
              className="px-2.5 py-1 rounded bg-[#B6E95B]/10 text-[#B6E95B] hover:bg-[#B6E95B]/20 border border-[#B6E95B]/30 transition-all flex items-center gap-1.5"
            >
              <span>CHFY - SOL (Live Mainnet Pool)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAddressInput('11A3VXuStYb6WmbZXZNK4smEQC4wuc6SuT1Yf6ETPRr');
                setCluster('mainnet-beta');
                performVerification('11A3VXuStYb6WmbZXZNK4smEQC4wuc6SuT1Yf6ETPRr', 'mainnet-beta');
              }}
              className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center gap-1.5"
            >
              <span>Verified DBC → DAMM v2 Migration (Live Mainnet)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-purple-400 font-semibold text-[11px] flex items-center gap-1">
              <span>●</span> Simulated Testbed Scenarios:
            </span>
            <button
              type="button"
              onClick={() => handleSelectScenario(FIXTURE_GRADUATED_DAMM_V2.inputAddress)}
              className="px-2.5 py-1 rounded bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 border border-[#10B981]/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Graduated DBC &rarr; DAMM v2 (NOVA)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectScenario(FIXTURE_THRESHOLD_REACHED_UNMIGRATED.inputAddress)}
              className="px-2.5 py-1 rounded bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 transition-all flex items-center gap-1.5"
            >
              <Clock className="w-3 h-3" />
              <span>Threshold Reached, Unmigrated (SOLAR)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectScenario(FIXTURE_ACTIVE_CURVE.inputAddress)}
              className="px-2.5 py-1 rounded bg-[#B6E95B]/10 text-[#B6E95B] hover:bg-[#B6E95B]/20 border border-[#B6E95B]/30 transition-all flex items-center gap-1.5"
            >
              <Layers className="w-3 h-3" />
              <span>Active Curve In Progress (ORBIT)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectScenario(FIXTURE_DISCREPANCY_FAULTY_DESTINATION.inputAddress)}
              className="px-2.5 py-1 rounded bg-[#F43F5E]/10 text-[#F43F5E] hover:bg-[#F43F5E]/20 border border-[#F43F5E]/30 transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Discrepancy / Faulty Migration (GHOST)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-[#0F1420] border border-[#1E2738] rounded-xl"></div>
          <div className="h-44 bg-[#0F1420] border border-[#1E2738] rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-[#0F1420] border border-[#1E2738] rounded-xl"></div>
            <div className="h-64 bg-[#0F1420] border border-[#1E2738] rounded-xl"></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-5 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-xs text-[#F43F5E] flex items-start gap-3 mb-8">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold font-mono uppercase text-sm">Verification Error</h4>
            <p className="mt-1 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Verification Result Display */}
      {result && !isLoading && (
        <div className="space-y-8 animate-fade-in">
          {/* Explicit Simulation or Live Banner */}
          {result.isSimulatedFixture || result.cluster === 'simulated-fixture' ? (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  <strong>SIMULATED DEMONSTRATION FIXTURE</strong>: This result is generated from controlled testbed fixture data and does not represent live on-chain mainnet verification.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] uppercase font-bold shrink-0">
                Fixture Mode
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#C5F36B]/10 border border-[#C5F36B]/40 text-[#C5F36B] text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C5F36B] shrink-0" />
                <span>
                  <strong>LIVE ON-CHAIN OBSERVATION</strong>: Current account state is read via Solana RPC and the installed official Meteora SDKs; migration claims are shown separately below.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#C5F36B]/20 text-[#C5F36B] font-mono text-[10px] uppercase font-bold shrink-0">
                Live Mainnet
              </span>
            </div>
          )}

          {/* Status Verdict Banner */}
          <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={result.status} size="lg" />
                  <span className="text-xs font-mono text-slate-400">
                    Cluster: <span className="text-slate-200">{result.cluster}</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Freshness: <span className="text-slate-200">{new Date(result.timestamp).toLocaleTimeString()}</span>
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-mono text-white mt-3 leading-snug">
                  {result.statusSummary}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-4xl leading-relaxed">
                  {result.stageExplanation}
                </p>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <button
                  onClick={() => setIsReceiptOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#C5F36B] hover:bg-[#B6E95B] text-[#080B11] font-mono text-xs font-bold transition-all shadow-md shadow-[#C5F36B]/20 flex items-center gap-2"
                >
                  <FileCode className="w-4 h-4" />
                  <span>Export Receipt</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `curl "${window.location.origin}/api/v1/verification/${result.inputAddress}"`
                    );
                    alert('Copied cURL command to clipboard!');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#161D2B] hover:bg-[#1E2738] border border-[#26334B] text-slate-300 font-mono text-[11px] transition-all flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy API cURL</span>
                </button>
              </div>
            </div>
          </div>

          {/* Observable Lifecycle Timeline */}
          <LifecycleTimeline currentStage={result.stage} status={result.status} />

          {/* DBC Configuration & Destination Pool Evidence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PoolConfigCard
              dbcState={result.dbcState}
              cluster={result.cluster}
              isSimulatedFixture={result.isSimulatedFixture}
              isAccountVerified={result.migrationClaims?.some((claim) => claim.id === 'DBC_POOL_CONFIRMED' && claim.status === 'VERIFIED')
                ?? result.claims.some((claim) => claim.id === 'CLAIM_POOL_OWNERSHIP' && claim.status === VerificationStatus.VERIFIED)}
            />
            <DestinationEvidenceCard
              destination={result.destinationState}
              isMigrated={result.dbcState.isMigrated}
              baseMint={result.dbcState.baseMint.address}
              quoteMint={result.dbcState.quoteMint.address}
              snapshotTimestamp={result.timestamp}
              snapshotSlot={result.observationSlot}
              cluster={result.cluster}
              isSimulatedFixture={result.isSimulatedFixture}
            />
          </div>

          <MigrationProofCard proof={result.migrationProof} claims={result.migrationClaims} cluster={result.cluster} timestamp={result.timestamp} observationSlot={result.observationSlot} />

          {/* Evaluated Claims Table */}
          <ClaimsTable claims={result.claims} />

          {/* Missing Evidence & Limitations Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0F1420] border border-[#1E2738] rounded-xl p-5">
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
                <span>Missing or Pending Protocol Evidence</span>
              </h4>
              {result.missingEvidence.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 font-mono">
                  {result.missingEvidence.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#10B981] font-mono">
                  &bull; Zero missing claims. All required on-chain evidence reconciled.
                </p>
              )}
            </div>

            <div className="bg-[#0F1420] border border-[#1E2738] rounded-xl p-5">
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span>Verification Scope & Invariants</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 font-mono">
                {result.limitations.map((l, idx) => (
                  <li key={idx}>{l}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no query executed */}
      {!result && !isLoading && !errorMessage && (
        <div className="py-20 text-center border border-dashed border-[#1E2738] rounded-2xl bg-[#080B11]/50">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-bold font-mono text-slate-300">
            No Address Queried Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            Enter a token mint or DBC pool address above, or select one of the demonstration scenarios
            to inspect reproducible on-chain verification in action.
          </p>
        </div>
      )}

      {/* Receipt Export Modal */}
      {result && (
        <ReceiptModal
          result={result}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500 font-mono text-xs">Loading Workspace...</div>}>
      <VerifyWorkspace />
    </Suspense>
  );
}
