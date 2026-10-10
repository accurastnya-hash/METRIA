'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, Search, ArrowRight, Terminal, Activity, Layers,
  CheckCircle2, AlertTriangle, Clock, ArrowUpRight, ScanSearch,
} from 'lucide-react';
import {
  FIXTURE_GRADUATED_DAMM_V2,
  FIXTURE_THRESHOLD_REACHED_UNMIGRATED,
  FIXTURE_ACTIVE_CURVE,
  FIXTURE_DISCREPANCY_FAULTY_DESTINATION,
} from '@/lib/fixtures/pools';

const scenarios = [
  { title: 'Graduated & reconciled', token: 'NOVA', icon: CheckCircle2, color: 'text-emerald-300', address: FIXTURE_GRADUATED_DAMM_V2.inputAddress },
  { title: 'Threshold reached', token: 'SOLAR', icon: Clock, color: 'text-amber-300', address: FIXTURE_THRESHOLD_REACHED_UNMIGRATED.inputAddress },
  { title: 'Active curve', token: 'ORBIT', icon: Activity, color: 'text-[#c5f36b]', address: FIXTURE_ACTIVE_CURVE.inputAddress },
  { title: 'Destination mismatch', token: 'GHOST', icon: AlertTriangle, color: 'text-rose-300', address: FIXTURE_DISCREPANCY_FAULTY_DESTINATION.inputAddress },
];

export default function OverviewPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const verifyAddress = (address: string) => router.push(`/verify?address=${encodeURIComponent(address.trim())}`);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchInput.trim()) verifyAddress(searchInput);
  };

  return (
    <div className="w-full">
      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[580px] w-[580px] rounded-full bg-[#c5f36b]/[0.06] blur-[120px]" />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c5f36b]/20 bg-[#c5f36b]/[0.07] px-3.5 py-2 text-[11px] font-medium tracking-wide text-[#d7f8a0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c5f36b]" />
              METEORA DBC · LIFECYCLE EVIDENCE
            </div>
            <h1 className="max-w-[720px] text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1.04] tracking-[-0.055em] text-white">
              Every launch.<br />Every transition.<br /><span className="text-[#c5f36b]">Verified.</span>
            </h1>
            <p className="mt-6 max-w-[620px] text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
              Follow a Dynamic Bonding Curve from its first trade through graduation and destination pool reconciliation—with evidence at every step.
            </p>

            <form onSubmit={handleSearch} className="mt-8 max-w-[680px]">
              <label htmlFor="pool-search" className="mb-2 block text-xs font-medium text-white/55">Verify a pool or token mint</label>
              <div className="flex rounded-2xl border border-white/[0.12] bg-[#111411] p-1.5 shadow-[0_24px_80px_rgba(0,0,0,.32)] transition-colors focus-within:border-[#c5f36b]/60">
                <Search className="ml-3 my-auto h-5 w-5 shrink-0 text-white/35" aria-hidden="true" />
                <input
                  id="pool-search"
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Paste a Solana address"
                  aria-label="Solana pool or token mint address"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
                <button type="submit" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#c5f36b] px-4 py-3 text-sm font-bold text-[#171d10] transition-colors hover:bg-[#d6fa91] sm:px-5">
                  Verify <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
                <span>Try a demo scenario</span><span className="h-px w-8 bg-white/15" />
                <span className="normal-case tracking-normal text-white/35">Illustrative fixtures</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {scenarios.map(({ title, token, icon: Icon, color, address }) => (
                  <button key={token} onClick={() => verifyAddress(address)} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 py-2 text-left text-xs text-white/65 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white">
                    <Icon className={`h-3.5 w-3.5 ${color}`} aria-hidden="true" />
                    <span>{title} <span className="text-white/35">· {token}</span></span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[510px] lg:max-w-none">
            <div className="absolute inset-8 rounded-[32px] bg-gradient-to-br from-[#f97316]/10 via-[#d946ef]/10 to-[#c5f36b]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#080908] shadow-[0_32px_100px_rgba(0,0,0,.48)]">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">Protocol lifecycle</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-[#c5f36b]" /> Evidence-led</span>
              </div>
              <Image src="/brand/metria-logo.jpg" alt="Metria brand mark and wordmark" width={970} height={790} priority className="h-auto w-full" />
              <div className="grid grid-cols-3 border-t border-white/[0.08] bg-[#10120f]">
                {[
                  { label: 'Origin', value: 'Meteora DBC' },
                  { label: 'Transition', value: 'On-chain events' },
                  { label: 'Destination', value: 'Pool reconciliation' },
                ].map((item, index) => (
                  <div key={item.label} className={`px-3 py-4 sm:px-5 ${index ? 'border-l border-white/[0.07]' : ''}`}>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">{item.label}</p>
                    <p className="mt-1.5 text-xs font-medium leading-4 text-white/80 sm:text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/[0.07] py-16 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c5f36b]">Clear stages. Verifiable evidence.</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">A threshold is only the beginning.</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">Reaching a graduation threshold does not itself prove a migration happened. Metria keeps each lifecycle state distinct and checks the destination separately.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Layers, number: '01', title: 'Read the DBC state', text: 'Inspect pool configuration and curve state, then distinguish active trading from a threshold being reached.' },
              { icon: ArrowRight, number: '02', title: 'Trace the transition', text: 'Use migration evidence to connect the originating curve to the transaction and destination it claims.' },
              { icon: ShieldCheck, number: '03', title: 'Reconcile destination', text: 'Check destination pool identity and mints. A destination is not mislabeled as the originating DBC pool.' },
            ].map(({ icon: Icon, number, title, text }) => (
              <article key={number} className="group rounded-2xl border border-white/[0.09] bg-[#10120f] p-6 transition-colors hover:border-[#c5f36b]/30">
                <div className="mb-7 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c5f36b]/20 bg-[#c5f36b]/[0.08] text-[#c5f36b]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="font-mono text-xs text-white/30">{number}</span>
                </div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-10">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65"><Terminal className="h-3.5 w-3.5 text-[#c5f36b]" /> Developer interface</div>
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">Evidence your product can inspect.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">Explore the verification endpoints and receipt format for integrating lifecycle evidence into launchpads, wallets, bots, and monitoring tools.</p>
            <Link href="/api-docs" className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-[#c5f36b]/40 hover:bg-[#c5f36b]/[0.06]">
              Browse API documentation <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="rounded-2xl border border-white/[0.1] bg-[#0c0e0c] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80"><ScanSearch className="h-4 w-4 text-[#c5f36b]" /> Verification flow</div>
              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] text-white/45">LIFECYCLE</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              {[
                ['01', 'GET /api/v1/verification/:address'],
                ['02', 'Inspect DBC state and configuration'],
                ['03', 'Reconcile migration destination'],
                ['04', 'Export a reproducible receipt'],
              ].map(([number, label], index) => (
                <div key={number} className="flex items-center gap-3 rounded-lg bg-white/[0.025] px-3 py-3">
                  <span className={`text-[10px] ${index === 3 ? 'text-[#c5f36b]' : 'text-white/35'}`}>{number}</span>
                  <span className="text-white/65">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
