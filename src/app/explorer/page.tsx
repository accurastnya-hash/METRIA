'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/Badge';
import {
  FIXTURE_GRADUATED_DAMM_V2,
  FIXTURE_THRESHOLD_REACHED_UNMIGRATED,
  FIXTURE_ACTIVE_CURVE,
  FIXTURE_DISCREPANCY_FAULTY_DESTINATION,
} from '@/lib/fixtures/pools';
import { Search, ShieldCheck, ArrowUpRight, Filter } from 'lucide-react';

const CATALOG = [
  FIXTURE_GRADUATED_DAMM_V2,
  FIXTURE_THRESHOLD_REACHED_UNMIGRATED,
  FIXTURE_ACTIVE_CURVE,
  FIXTURE_DISCREPANCY_FAULTY_DESTINATION,
];

export default function ExplorerPage() {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = CATALOG.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const symbolMatch = item.dbcState.baseMint.symbol?.toLowerCase().includes(term);
      const addrMatch = item.dbcState.poolAddress.toLowerCase().includes(term);
      const mintMatch = item.inputAddress.toLowerCase().includes(term);
      return symbolMatch || addrMatch || mintMatch;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
            Meteora DBC Explorer & Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit catalog of evaluated Dynamic Bonding Curve pools and lifecycle proofs
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#C5F36B]" />
          <span>{CATALOG.length} Audited Launches Cataloged</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0F1420] border border-[#1E2738] rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between shadow-md">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search symbol, mint, or pool..."
            className="w-full bg-[#080B11] border border-[#1E2738] focus:border-[#C5F36B] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-mono text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {['ALL', 'VERIFIED', 'UNVERIFIED', 'DISCREPANCY'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                filterStatus === s
                  ? 'bg-[#1E2738] text-[#C5F36B] border border-[#C5F36B]/40 font-bold'
                  : 'bg-[#080B11] text-slate-400 hover:text-white border border-[#1E2738]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0F1420] border border-[#1E2738] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0A0D15] border-b border-[#1E2738] text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase text-[10px]">Token</th>
                <th className="py-3 px-4 font-semibold uppercase text-[10px]">Pool Address</th>
                <th className="py-3 px-4 font-semibold uppercase text-[10px]">Quote & Threshold</th>
                <th className="py-3 px-4 font-semibold uppercase text-[10px]">Lifecycle Stage</th>
                <th className="py-3 px-4 font-semibold uppercase text-[10px]">Destination</th>
                <th className="py-3 px-4 font-semibold uppercase text-[10px]">Verdict</th>
                <th className="py-3 px-4 font-semibold uppercase text-[10px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2233]">
              {filtered.map((item) => (
                <tr key={item.dbcState.poolAddress} className="hover:bg-[#121824] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#161D2B] border border-[#232F46] flex items-center justify-center font-bold text-white text-[11px]">
                        {item.dbcState.baseMint.symbol?.[0] ?? '?'}
                      </div>
                      <div>
                        <span className="font-bold text-white block">
                          {item.dbcState.baseMint.symbol ?? 'Unknown'}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block max-w-[100px]">
                          {item.inputAddress}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="truncate block max-w-[120px]">
                      {item.dbcState.poolAddress}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    <span>{item.dbcState.migrationThresholdFormatted}</span>
                    <span className="text-[10px] text-slate-500 block">
                      ({item.dbcState.progressPercentage === null ? 'Unavailable' : `${item.dbcState.progressPercentage.toFixed(1)}% reached`})
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-[#161D2B] text-slate-300 border border-[#222E42] text-[10px]">
                      {item.stage}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    {item.destinationState?.programLabel ?? item.dbcState.migrationOptionLabel}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.status} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/verify?address=${encodeURIComponent(item.inputAddress)}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#C5F36B]/10 hover:bg-[#C5F36B]/20 border border-[#C5F36B]/30 text-[#C5F36B] transition-colors font-medium text-[11px]"
                    >
                      <span>Audit Proof</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
