'use client';

import React from 'react';
import { DestinationPoolState } from '@/lib/verification/types';
import { ArrowRightLeft, Lock, ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react';

interface DestinationEvidenceCardProps {
  destination: DestinationPoolState | null;
  isMigrated: boolean | null;
  baseMint: string;
  quoteMint: string;
  snapshotTimestamp?: string;
  snapshotSlot?: number;
  cluster?: string;
  isSimulatedFixture?: boolean;
}

export function DestinationEvidenceCard({
  destination,
  isMigrated,
  baseMint,
  quoteMint,
  snapshotTimestamp,
  snapshotSlot,
  cluster = 'mainnet-beta',
  isSimulatedFixture = false,
}: DestinationEvidenceCardProps) {
  if (!isMigrated || !destination) {
    return (
      <div className="w-full bg-[#0F1420] border border-[#1E2738] rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#1E2738]">
          <ArrowRightLeft className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-400 tracking-wide uppercase font-mono">
            Destination AMM Reconciliation
          </h3>
        </div>
        <div className="py-8 text-center">
          <p className="text-xs text-slate-400">
            {isMigrated === true
              ? 'No transaction-linked destination is confirmed. A mint-matched pool alone is not treated as migration evidence.'
              : isMigrated === false
                ? 'Pool has not graduated or migrated. Destination pool reconciliation will become active post-migration.'
                : 'Migration state is unavailable until a supported DBC pool account is decoded.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0F1420] border border-[#1E2738] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-[#1E2738]">
        <div className="flex items-center gap-2.5">
          <ArrowRightLeft className="w-4 h-4 text-[#C5F36B]" />
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              Destination AMM Evidence ({destination.programLabel})
            </h3>
            <p className="text-xs text-slate-400">
              Current vault snapshot; historical migration flow is reported separately. Balances are not a liquidity guarantee.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono text-xs">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Account Decoded</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* Destination Pool Address */}
        <div className="p-3 rounded-lg bg-[#0A0D15] border border-[#1A2233]">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
            AMM Pool Address
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-200 truncate">
              {destination.poolAddress}
            </span>
            {!isSimulatedFixture && <a
              href={`https://solscan.io/account/${destination.poolAddress}${cluster === 'devnet' ? '?cluster=devnet' : ''}`}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded hover:bg-[#1E2738] text-slate-400 hover:text-white shrink-0"
              title="View on Solscan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>}
          </div>
        </div>

        {/* LP Lock Status */}
        <div className="p-3 rounded-lg bg-[#0A0D15] border border-[#1A2233]">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
            LP Position & Custody
          </span>
          <div className="flex items-center gap-2">
            {destination.lpLockedStatus === 'LOCKED' ? (
              <>
                <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-xs font-mono font-bold text-[#10B981]">
                  LOCKED / PERMANENT
                </span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="text-xs font-mono font-medium text-[#F59E0B]">
                  {destination.lpLockedStatus}
                </span>
              </>
            )}
            <span className="text-[11px] font-mono text-slate-500">
              (Supply: {destination.lpSupply})
            </span>
          </div>
        </div>

        {/* Token0 Vault Balance */}
        <div className="p-3 rounded-lg bg-[#0A0D15] border border-[#1A2233]">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
            Current Base Vault Balance
          </span>
          <span className="text-xs font-mono font-semibold text-slate-200">
            {destination.token0Mint === baseMint ? destination.token0Balance : destination.token1Balance} {(destination.token0Mint === baseMint ? destination.token0Decimals : destination.token1Decimals) !== undefined && <span className="text-slate-500">({destination.token0Mint === baseMint ? destination.token0Decimals : destination.token1Decimals} decimals · raw {destination.token0Mint === baseMint ? destination.token0BalanceRaw : destination.token1BalanceRaw})</span>}
          </span>
        </div>

        {/* Token1 Vault Balance */}
        <div className="p-3 rounded-lg bg-[#0A0D15] border border-[#1A2233]">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
            Current Quote Vault Balance
          </span>
          <span className="text-xs font-mono font-semibold text-slate-200">
            {destination.token0Mint === quoteMint ? destination.token0Balance : destination.token1Balance} {(destination.token0Mint === quoteMint ? destination.token0Decimals : destination.token1Decimals) !== undefined && <span className="text-slate-500">({destination.token0Mint === quoteMint ? destination.token0Decimals : destination.token1Decimals} decimals · raw {destination.token0Mint === quoteMint ? destination.token0BalanceRaw : destination.token1BalanceRaw})</span>}
          </span>
        </div>
      </div>
      <p className="mt-3 text-[10px] font-mono text-slate-500">Snapshot {snapshotTimestamp ?? 'timestamp unavailable'}{snapshotSlot !== undefined ? ` · origin context slot ${snapshotSlot}; dependent account reads may use adjacent slots.` : ''}</p>
    </div>
  );
}
