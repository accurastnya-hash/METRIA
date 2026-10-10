'use client';

import React, { useState } from 'react';
import { DbcPoolState } from '@/lib/verification/types';
import { Copy, Check, ExternalLink, Database, Activity } from 'lucide-react';
import { isValidSolanaAddress } from '@/lib/solana/client';

interface PoolConfigCardProps {
  dbcState: DbcPoolState;
  cluster?: string;
  isSimulatedFixture?: boolean;
  isAccountVerified?: boolean;
}

export function PoolConfigCard({ dbcState, cluster = 'mainnet-beta', isSimulatedFixture = false, isAccountVerified = false }: PoolConfigCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const hasPoolData = isAccountVerified || isSimulatedFixture;
  const validPool = hasPoolData && isValidSolanaAddress(dbcState.poolAddress);
  const validBaseMint = hasPoolData && isValidSolanaAddress(dbcState.baseMint.address);
  const explorerSuffix = cluster === 'devnet' ? '?cluster=devnet' : '';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full bg-[#0F1420] border border-[#1E2738] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-[#1E2738]">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-[#C5F36B]" />
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              DBC Configuration & Reserves
            </h3>
            <p className="text-xs text-slate-400">
              {isAccountVerified ? 'DBC VirtualPool and configuration decoded on-chain' : isSimulatedFixture ? 'Simulated fixture data; not Mainnet evidence' : 'No on-chain DBC pool/configuration verified'}
            </p>
          </div>
        </div>
        {hasPoolData && <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Progression:</span>
          <span className="text-xs font-mono font-bold text-[#C5F36B]">
            {dbcState.progressPercentage === null ? 'Unavailable' : `${dbcState.progressPercentage.toFixed(2)}%`}
          </span>
        </div>}
      </div>

      {!hasPoolData ? (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3 text-xs text-slate-300">
          Pool reserves, mints, and migration configuration are unavailable until the submitted address resolves to an owned and decoded DBC account.
          <span className="mt-2 block break-all font-mono text-slate-400">Submitted address: {dbcState.baseMint.address}</span>
        </div>
      ) : <>
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-[#161D2B] h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C5F36B] to-[#B6E95B] transition-all duration-500"
            style={{ width: `${dbcState.progressPercentage === null ? 0 : Math.min(100, Math.max(0, dbcState.progressPercentage))}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1.5">
          <span>Accumulated: {dbcState.realQuoteReserves} Lamports</span>
          <span>Target Threshold: {dbcState.migrationThresholdFormatted}</span>
        </div>
      </div>
      </>}

      {/* Grid of parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* Pool Address */}
        <div className="p-3 rounded-lg bg-[#0A0D15] border border-[#1A2233]">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
            DBC Pool Address
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-200 truncate">
              {dbcState.poolAddress}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {validPool && <button
                onClick={() => copyToClipboard(dbcState.poolAddress, 'pool')}
                className="p-1 rounded hover:bg-[#1E2738] text-slate-400 hover:text-white"
                title="Copy Address"
              >
                {copiedKey === 'pool' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>}
              {validPool && !isSimulatedFixture && <a
                href={`https://solscan.io/account/${dbcState.poolAddress}${explorerSuffix}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded hover:bg-[#1E2738] text-slate-400 hover:text-white"
                title="View on Solscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>}
            </div>
          </div>
        </div>

        {/* Base Token Mint */}
        <div className="p-3 rounded-lg bg-[#0A0D15] border border-[#1A2233]">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
            Base Token Mint ({dbcState.baseMint.symbol ?? 'Unknown'})
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-200 truncate">
              {dbcState.baseMint.address}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {validBaseMint && <button
                onClick={() => copyToClipboard(dbcState.baseMint.address, 'baseMint')}
                className="p-1 rounded hover:bg-[#1E2738] text-slate-400 hover:text-white"
                title="Copy Address"
              >
                {copiedKey === 'baseMint' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>}
              {validBaseMint && !isSimulatedFixture && <a
                href={`https://solscan.io/token/${dbcState.baseMint.address}${explorerSuffix}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded hover:bg-[#1E2738] text-slate-400 hover:text-white"
                title="View on Solscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>}
            </div>
          </div>
        </div>

        {/* Quote Token Mint */}
        <div className="p-3 rounded-lg bg-[#0A0D15] border border-[#1A2233]">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
            Quote Token ({dbcState.quoteMint.symbol})
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-200 truncate">
              {dbcState.quoteMint.address}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => copyToClipboard(dbcState.quoteMint.address, 'quoteMint')}
                className="p-1 rounded hover:bg-[#1E2738] text-slate-400 hover:text-white"
                title="Copy Address"
              >
                {copiedKey === 'quoteMint' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Configured Migration Destination */}
        <div className="p-3 rounded-lg bg-[#0A0D15] border border-[#1A2233]">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
            Configured Migration Destination
          </span>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#C5F36B]" />
            <span className="text-xs font-mono font-medium text-white">
              {dbcState.migrationOptionLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
