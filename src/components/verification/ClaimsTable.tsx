import React from 'react';
import { ClaimEvaluation } from '@/lib/verification/types';
import { StatusBadge } from '../ui/Badge';
import { ShieldCheck, AlertCircle, FileCode } from 'lucide-react';

interface ClaimsTableProps {
  claims: ClaimEvaluation[];
}

export function ClaimsTable({ claims }: ClaimsTableProps) {
  return (
    <div className="w-full bg-[#0F1420] border border-[#1E2738] rounded-xl overflow-hidden shadow-lg">
      <div className="p-5 border-b border-[#1E2738] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#C5F36B]" />
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              Evaluated On-Chain Claims
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic protocol assertions checked against on-chain accounts
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-[#161D2B]">
          {claims.length} Claims Checked
        </span>
      </div>

      <div className="divide-y divide-[#1A2233]">
        {claims.map((claim) => {
          const isDiscrepancy = claim.status === 'DISCREPANCY';
          return (
            <div
              key={claim.id}
              className={`p-4 transition-colors ${
                isDiscrepancy ? 'bg-[#F43F5E]/5' : 'hover:bg-[#121824]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">{claim.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E2738] text-slate-400 border border-[#2B374E]">
                    {claim.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#161D2B] text-slate-400 border border-[#222C3E]">
                    Confidence: {claim.confidence}
                  </span>
                  <StatusBadge status={claim.status} size="sm" />
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{claim.explanation}</p>

              {claim.discrepancyNote && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/30 flex items-start gap-2 text-xs text-[#F43F5E]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold uppercase font-mono text-[11px] block">
                      Discrepancy Note
                    </span>
                    <span>{claim.discrepancyNote}</span>
                  </div>
                </div>
              )}

              {claim.value !== undefined && (
                <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>On-Chain Value:</span>
                  <span className="text-[#B6E95B] truncate max-w-md">{String(claim.value)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
