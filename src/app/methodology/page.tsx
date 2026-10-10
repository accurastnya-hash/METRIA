import React from 'react';
import { BookOpen, ShieldCheck, Layers, Cpu } from 'lucide-react';
import { METHODOLOGY_VERSION, INDEPENDENT_DISCLOSURE } from '@/lib/meteora/constants';

export default function MethodologyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#C5F36B]/10 border border-[#C5F36B]/30 text-[#C5F36B] text-xs font-mono mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Verification Methodology v{METHODOLOGY_VERSION}</span>
        </div>
        <h1 className="text-3xl font-extrabold font-mono text-white tracking-tight">
          Lifecycle Verification Methodology
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
          The deterministic mathematical rules, state machine transitions, and on-chain evidence
          requirements that govern METRIA verification results.
        </p>
      </div>

      <div className="space-y-10">
        {/* Section 1: Core Axioms */}
        <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2 pb-3 border-b border-[#1E2738]">
            <ShieldCheck className="w-5 h-5 text-[#C5F36B]" />
            <span>1. Foundational Protocol Invariants</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <span className="text-xs font-mono text-[#B6E95B] font-bold block mb-2">
                Axiom 1: Non-Equivalence
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Reaching a graduation threshold does <strong>not</strong> equal a confirmed migration.
                If trading halts at 85 SOL but the migration transaction has not confirmed, METRIA
                assigns <code className="text-[#F59E0B]">THRESHOLD_REACHED</code>, never Migrated.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <span className="text-xs font-mono text-[#B6E95B] font-bold block mb-2">
                Axiom 2: Cryptographic Linking
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                A matching token mint on an AMM does <strong>not</strong> prove that it originated
                from a DBC launch. The destination pool must match the DBC config, migration instruction
                logs, and canonical Meteora PDAs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <span className="text-xs font-mono text-[#B6E95B] font-bold block mb-2">
                Axiom 3: Complete Custody Reconciliation
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                If a DBC vault is drained but destination AMM vaults contain 0 tokens, METRIA triggers
                an immediate <code className="text-[#F43F5E]">DISCREPANCY</code> verdict. Uncertainty
                is never collapsed into false confidence.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Six Lifecycle Stages */}
        <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2 pb-3 border-b border-[#1E2738]">
            <Layers className="w-5 h-5 text-[#B6E95B]" />
            <span>2. The Six Observable Lifecycle Stages</span>
          </h2>

          <div className="space-y-4 mt-6 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <span className="text-sm font-bold text-white block">1. ACTIVE_TRADING</span>
              <p className="text-slate-400 mt-1">
                Real quote token accumulation is strictly below the pool&apos;s migration threshold. Swaps are active along the bonding curve.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <span className="text-sm font-bold text-white block">2. THRESHOLD_REACHED</span>
              <p className="text-slate-400 mt-1">
                Quote reserves meet or exceed graduation threshold. The curve is ripe for migration, but no migration crank has completed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <span className="text-sm font-bold text-white block">3. MIGRATION_INITIATED</span>
              <p className="text-slate-400 mt-1">
                Migration instruction is detected or is_migrated bitmask set, but destination pool state is not yet discovered or finalized.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <span className="text-sm font-bold text-white block">4. MIGRATION_CONFIRMED</span>
              <p className="text-slate-400 mt-1">
                Migration transaction confirmed on-chain. DBC vaults are verified empty/drained of real token reserves.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <span className="text-sm font-bold text-white block">5. DESTINATION_VERIFIED</span>
              <p className="text-slate-400 mt-1">
                Destination AMM pool (Meteora DAMM v2 CP-AMM or legacy DAMM v1) exists on-chain with matching token pair and canonical authority PDA.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <span className="text-sm font-bold text-white block">6. RECONCILED</span>
              <p className="text-slate-400 mt-1">
                Destination vaults hold verified token reserves corresponding to curve output, LP tokens are minted, and LP custody/lock is audited.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Status Codes */}
        <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2 pb-3 border-b border-[#1E2738]">
            <Cpu className="w-5 h-5 text-[#9D7BFF]" />
            <span>3. Authoritative Verification Verdicts</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-slate-200">
              <span className="font-bold text-[#10B981] text-sm block mb-1">VERIFIED</span>
              All required on-chain assertions have positive, verifiable cryptographic proof. Complete liquidity reconciliation achieved.
            </div>

            <div className="p-4 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-slate-200">
              <span className="font-bold text-[#F43F5E] text-sm block mb-1">DISCREPANCY</span>
              On-chain evidence directly contradicts expected protocol state (e.g. drained curve without AMM capitalization, mint mismatch).
            </div>

            <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-slate-200">
              <span className="font-bold text-[#F59E0B] text-sm block mb-1">UNVERIFIED</span>
              The pool lifecycle stage is legitimate but incomplete (e.g. curve still in active trading phase or pending migration crank).
            </div>

            <div className="p-4 rounded-xl bg-[#64748B]/10 border border-[#64748B]/30 text-slate-200">
              <span className="font-bold text-slate-400 text-sm block mb-1">INSUFFICIENT_DATA</span>
              Address does not exist on cluster, account data is truncated, or RPC rate-limiting prevented definitive verification.
            </div>
          </div>
        </div>

        {/* Section 4: Independent Disclosure */}
        <div className="p-5 rounded-xl bg-[#080B11] border border-[#1E2738] text-xs text-slate-400">
          <p className="leading-relaxed">
            <strong className="text-slate-300">Independent Builder Disclosure:</strong> {INDEPENDENT_DISCLOSURE}
          </p>
        </div>
      </div>
    </div>
  );
}
