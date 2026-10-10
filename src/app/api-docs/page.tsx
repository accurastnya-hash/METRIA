'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

export default function ApiDocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin);
  const baseUrl = configuredBaseUrl.replace(/\/+$/, '');
  const dbcExample = 'FrvcJryeuBhPnB8NS854rdfzjbLrc6gGuMF4vpAkcxFC';
  const verificationCurl = `curl -X GET "${baseUrl}/api/v1/verification/${dbcExample}?cluster=mainnet-beta"`;
  const poolCurl = `curl -X GET "${baseUrl}/api/v1/pools/${dbcExample}?cluster=mainnet-beta"`;
  const receiptCurl = `curl -X GET "${baseUrl}/api/v1/receipts/rcpt_graduated_novadamm_8xwj21"`;

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#C5F36B]/10 border border-[#C5F36B]/30 text-[#C5F36B] text-xs font-mono mb-3">
          <Terminal className="w-3.5 h-3.5" />
          <span>METRIA Developer Infrastructure</span>
        </div>
        <h1 className="text-3xl font-extrabold font-mono text-white tracking-tight">
          Developer REST API (v1)
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Read-only endpoints for Meteora DBC verification and simulated fixture receipts. Set
          <code className="mx-1">NEXT_PUBLIC_APP_URL</code> to the deployed app URL; examples use this origin.
        </p>
      </div>

      <div className="space-y-10">
        {/* Endpoint 1: Verification */}
        <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1E2738]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-[#10B981]/20 text-[#10B981] font-mono font-bold text-xs border border-[#10B981]/40">
                GET
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-white">
                /api/v1/verification/:address
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Response: <code className="text-[#B6E95B]">VerificationResult</code>
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-4 leading-relaxed">
            Performs complete lifecycle verification for a Solana token mint or DBC pool address.
            Returns evaluated on-chain claims, state machine classification, and cryptographic receipt.
          </p>

          <div className="mt-4">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
              Query Parameters
            </h4>
            <div className="bg-[#080B11] border border-[#1A2233] rounded-lg p-3 text-xs font-mono space-y-2">
              <div>
                <span className="text-[#C5F36B]">cluster</span>{' '}
                <span className="text-slate-500">(optional)</span>: &apos;mainnet-beta&apos; | &apos;devnet&apos; | &apos;simulated-fixture&apos;
              </div>
              <div className="text-slate-400">Fixture scenarios are available only when <code>cluster=simulated-fixture</code>.</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400">Example Request (cURL)</span>
              <button
                onClick={() =>
                  copyCode(verificationCurl, 'curl-verify')
                }
                className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white"
              >
                {copiedId === 'curl-verify' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'curl-verify' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="bg-[#080B11] border border-[#1A2233] rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto">
{verificationCurl}
            </pre>
          </div>
        </div>

        {/* Endpoint 2: Pool Config */}
        <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1E2738]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-[#10B981]/20 text-[#10B981] font-mono font-bold text-xs border border-[#10B981]/40">
                GET
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-white">
                /api/v1/pools/:address
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Response: <code className="text-[#B6E95B]">DbcPoolConfig</code>
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-4 leading-relaxed">
            Returns raw decoded DBC curve configuration, reserve counters, quote token details, and graduation progress.
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400">Example Request (cURL)</span>
              <button
                onClick={() =>
                  copyCode(poolCurl, 'curl-pool')
                }
                className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white"
              >
                {copiedId === 'curl-pool' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'curl-pool' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="bg-[#080B11] border border-[#1A2233] rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto">
{poolCurl}
            </pre>
          </div>
        </div>

        {/* Endpoint 3: Receipts */}
        <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1E2738]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-[#10B981]/20 text-[#10B981] font-mono font-bold text-xs border border-[#10B981]/40">
                GET
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-white">
                /api/v1/receipts/:receiptId
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Response: <code className="text-[#B6E95B]">VerificationReceiptPayload</code>
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-4 leading-relaxed">
            Looks up a deterministic simulated fixture receipt only. Live RPC receipts are returned by the verification endpoint and are not persisted for later lookup.
          </p>

          <div className="mt-5">
            <pre className="bg-[#080B11] border border-[#1A2233] rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto">
{receiptCurl}
            </pre>
          </div>
        </div>

        {/* Endpoint 4: Health */}
        <div className="bg-[#0F1420] border border-[#1E2738] rounded-2xl p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1E2738]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-[#10B981]/20 text-[#10B981] font-mono font-bold text-xs border border-[#10B981]/40">
                GET
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-white">
                /api/v1/health
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Service Health & Methodology Version
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-4 leading-relaxed">
            Returns process liveness and methodology metadata. It does not probe the Solana RPC.
          </p>
        </div>
      </div>
    </div>
  );
}
