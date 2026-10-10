'use client';

import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Link2, SearchCheck } from 'lucide-react';
import type { MigrationProof, MigrationProofClaim } from '@/lib/verification/migration-proof';
import { formatTokenAmountFlow } from '@/lib/verification/amount-format';
import { METEORA_PROGRAMS } from '@/lib/meteora/constants';

export function MigrationProofCard({ proof, claims, cluster = 'mainnet-beta', timestamp, observationSlot }: { proof?: MigrationProof; claims?: MigrationProofClaim[]; cluster?: string; timestamp?: string; observationSlot?: number }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!proof) return null;
  const explorer = (kind: 'tx' | 'account', address: string) => `https://solscan.io/${kind}/${address}${cluster === 'devnet' ? '?cluster=devnet' : ''}`;
  const copy = async (address: string) => {
    try { await navigator.clipboard.writeText(address); setCopied(address); window.setTimeout(() => setCopied(null), 1500); } catch { setCopied(null); }
  };
  const address = (label: string, value: string | null | undefined) => <div><span className="text-slate-500">{label}</span><p className="mt-1 flex items-start gap-1 text-slate-200 break-all">{value ? <a href={explorer('account', value)} target="_blank" rel="noreferrer" className="hover:text-cyan-300">{value}</a> : 'Unavailable'}{value && <button type="button" onClick={() => void copy(value)} className="shrink-0 text-cyan-300" aria-label={`Copy ${label}`} title={copied === value ? 'Copied' : 'Copy address'}>{copied === value ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</button>}</p></div>;
  const badge = proof.status === 'VERIFIED' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
    : proof.status === 'DISCREPANCY' ? 'text-rose-300 bg-rose-500/10 border-rose-500/30'
    : 'text-amber-300 bg-amber-500/10 border-amber-500/30';

  return (
    <section className="w-full bg-[#0F1420] border border-[#1E2738] rounded-xl p-5 shadow-lg">
      <div className="flex items-start justify-between gap-3 border-b border-[#1E2738] pb-3">
        <div className="flex gap-2.5">
          <SearchCheck className="w-4 h-4 text-[#C5F36B] mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide font-mono">Migration Transaction Proof</h3>
            <p className="text-xs text-slate-400 mt-1">Origin linkage, destination PDA, current account state, and historical asset flow are checked separately.</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded border text-[10px] font-mono font-bold ${badge}`}>{proof.status}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs font-mono">
        <div><span className="text-slate-500">Search scope</span><p className="text-slate-200 mt-1">{proof.scannedSignatures} / {proof.limit} signatures · {proof.historyExhausted ? 'RPC history exhausted' : 'bounded scan'}</p></div>
        <div><span className="text-slate-500">Decoded instruction</span><p className="text-slate-200 mt-1">{proof.instruction ?? 'Not found'}</p></div>
        {address('Origin DBC pool', proof.originPool)}
        {address('Origin program owner', METEORA_PROGRAMS.DBC_PROGRAM_ID)}
        {address('Expected destination', proof.derivedDestinationAddress)}
        {address('Instruction destination', proof.destinationAddress)}
        {address('Destination program owner', proof.destinationOwner)}
        {address('DAMM config', proof.dammConfigAddress)}
        <div><span className="text-slate-500">DAMM config validation</span><p className="text-slate-200 mt-1">Owner {proof.dammConfigOwner ?? 'unavailable'} · SDK decode {proof.dammConfigDecoded ? 'passed' : 'not confirmed'}</p></div>
        <div><span className="text-slate-500">Current snapshot observation</span><p className="text-slate-200 mt-1">{timestamp ?? 'Timestamp unavailable'} · origin slot {observationSlot ?? 'unknown'}</p></div>
      </div>

      {proof.transactionSignature && <div className="mt-4 rounded-lg bg-[#0A0D15] border border-[#1A2233] p-3">
        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 text-[10px] uppercase">Historical transaction · slot {proof.transactionSlot ?? 'unknown'} · {proof.transactionTimestamp ?? 'timestamp unavailable'}</span>
          <a className="text-cyan-300 hover:text-white" href={explorer('tx', proof.transactionSignature)} target="_blank" rel="noreferrer" aria-label="Open migration transaction in Solscan"><ExternalLink className="w-3.5 h-3.5" /></a>
        </div>
        <a className="text-slate-200 break-all hover:text-cyan-300 mt-1 inline-flex gap-1" href={explorer('tx', proof.transactionSignature)} target="_blank" rel="noreferrer"><Link2 className="w-3 h-3 shrink-0 mt-0.5" />{proof.transactionSignature}</a>
      </div>}

      <div className="mt-4">
        <h4 className="text-[10px] text-slate-500 uppercase font-mono mb-2">Independent proof claims</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(claims ?? []).map((claim) => <div key={claim.id} className="flex justify-between gap-2 p-2 rounded bg-[#0A0D15] border border-[#1A2233]">
            <span className="text-[10px] text-slate-300">{claim.id.replaceAll('_', ' ')}</span>
            <span className={`text-[9px] font-mono ${claim.status === 'VERIFIED' ? 'text-emerald-300' : claim.status === 'DISCREPANCY' ? 'text-rose-300' : 'text-amber-300'}`}>{claim.status}</span>
          </div>)}
        </div>
      </div>

      <div className="mt-4 rounded bg-[#0A0D15] p-3">
        <span className="text-[10px] uppercase text-slate-500 font-mono">Asset flow</span>
        <p className="text-xs text-slate-200 mt-1">Base mint {proof.baseMint} · {formatTokenAmountFlow(proof.baseVaultDeltaRaw, proof.baseDecimals)}</p>
        <p className="text-xs text-slate-200 mt-1">Quote mint {proof.quoteMint} · {formatTokenAmountFlow(proof.quoteVaultDeltaRaw, proof.quoteDecimals)}</p>
      </div>
      {(proof.failedMigrationSignatures.length > 0 || proof.reasons.length > 0) && <div className="mt-3 text-[11px] text-amber-200">
        {proof.failedMigrationSignatures.length > 0 && <p>Failed attempts (not counted as proof): {proof.failedMigrationSignatures.join(', ')}</p>}
        {proof.reasons.map((reason) => <p key={reason}>{reason}</p>)}
      </div>}
    </section>
  );
}
