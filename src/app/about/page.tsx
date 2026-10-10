import React from 'react';
import { Info, Users, Lock, Compass } from 'lucide-react';
import { INDEPENDENT_DISCLOSURE } from '@/lib/meteora/constants';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#C5F36B]/10 border border-[#C5F36B]/30 text-[#C5F36B] text-xs font-mono mb-3">
          <Info className="w-3.5 h-3.5" />
          <span>Product Overview</span>
        </div>
        <h1 className="text-3xl font-extrabold font-mono text-white tracking-tight">
          About METRIA
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Every launch. Every transition. Verified.
        </p>
      </div>

      <div className="space-y-10">
        {/* Mission Statement */}
        <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2 pb-3 border-b border-[#1E2738]">
            <Compass className="w-5 h-5 text-[#C5F36B]" />
            <span>Mission & Purpose</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
            METRIA was built to provide independent on-chain lifecycle verification and developer infrastructure
            for the Meteora ecosystem. As decentralized launchpads adopt Meteora&apos;s Dynamic Bonding Curve (DBC),
            communities and integrators need an objective, third-party evidence layer to verify what happened
            to pool liquidity, whether graduation actually occurred, and where funds were deposited post-migration.
          </p>
          <div className="mt-4 p-4 rounded-xl bg-[#080B11] border border-[#1A2233] text-xs font-mono text-slate-400">
            <strong>Target Track:</strong> Best Use of Meteora&apos;s Dynamic Bonding Curve (DBC).
          </div>
        </div>

        {/* Target Audiences */}
        <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2 pb-3 border-b border-[#1E2738]">
            <Users className="w-5 h-5 text-[#B6E95B]" />
            <span>Target Users & Value</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <h3 className="text-sm font-bold text-white font-mono mb-2">1. Launchpad Operators</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check whether launches have progressed through expected lifecycle stages, detect stalled
                migration cranks, and embed verification badges directly into user interfaces.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <h3 className="text-sm font-bold text-white font-mono mb-2">2. Token Communities & Traders</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Understand whether graduation actually occurred on-chain, inspect the destination AMM pool,
                and distinguish verified facts from marketing claims.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <h3 className="text-sm font-bold text-white font-mono mb-2">3. Researchers & Analysts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect raw DBC curve parameters, review reserve math, reproduce lifecycle checks, and export
                canonical cryptographic receipts for academic or security research.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B11] border border-[#1A2233]">
              <h3 className="text-sm font-bold text-white font-mono mb-2">4. Infrastructure Developers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Query a consistent REST API to automate pool status tracking, feed safety alerts into Telegram/Discord
                bots, or build aggregate dashboards without parsing complex on-chain accounts.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Strict Scope Limits */}
        <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2 pb-3 border-b border-[#1E2738]">
            <Lock className="w-5 h-5 text-[#9D7BFF]" />
            <span>Security & Scope Guarantees</span>
          </h2>

          <p className="text-xs text-slate-300 mt-4 leading-relaxed">
            METRIA is strictly a <strong>read-only verification layer</strong>. The system implements no transactions
            that handle user funds:
          </p>

          <ul className="mt-4 space-y-2 text-xs font-mono text-slate-400 list-disc list-inside">
            <li>Zero wallet connection required for verification queries</li>
            <li>No private keys, seed phrases, or credentials ever accepted or stored</li>
            <li>No automated swaps, pool creation, or token launching capabilities</li>
            <li>No custody, migration execution, or fee-claiming operations</li>
          </ul>
        </div>

        {/* Prominent Independent Builder Disclosure */}
        <div className="p-6 rounded-2xl bg-[#080B11] border border-[#1E2738] text-xs text-slate-400 shadow-md">
          <h3 className="text-sm font-bold font-mono text-white mb-2">Ecosystem Disclosure</h3>
          <p className="leading-relaxed">
            {INDEPENDENT_DISCLOSURE} METRIA independently verifies protocol data using public on-chain
            Solana accounts and official Meteora SDK definitions.
          </p>
        </div>
      </div>
    </div>
  );
}
