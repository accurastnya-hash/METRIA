'use client';

import React, { useState } from 'react';
import { VerificationResult } from '@/lib/verification/types';
import {
  buildVerificationReceipt,
  formatHumanReadableReport,
} from '@/lib/receipts/generator';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  Code,
  ShieldCheck,
} from 'lucide-react';

interface ReceiptModalProps {
  result: VerificationResult;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ result, isOpen, onClose }: ReceiptModalProps) {
  const [activeTab, setActiveTab] = useState<'json' | 'report'>('json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const receipt = buildVerificationReceipt(result);
  const jsonString = JSON.stringify(receipt, null, 2);
  const reportString = formatHumanReadableReport(result);

  const handleCopy = () => {
    const content = activeTab === 'json' ? jsonString : reportString;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeTab === 'json' ? jsonString : reportString], {
      type: activeTab === 'json' ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metria-receipt-${result.receiptId}.${activeTab === 'json' ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0B0F19] border border-[#1E2738] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#1E2738] flex items-center justify-between bg-[#080B11]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C5F36B]/10 border border-[#C5F36B]/30 flex items-center justify-center text-[#C5F36B]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                Verification Receipt #{result.receiptId}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                SHA-256: <span className="text-[#B6E95B]">{result.canonicalHash.slice(0, 16)}...</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1E2738] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Actions */}
        <div className="px-5 py-3 border-b border-[#1E2738] flex items-center justify-between bg-[#0F1420]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
                activeTab === 'json'
                  ? 'bg-[#1E2738] text-[#C5F36B] border border-[#C5F36B]/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Canonical JSON</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
                activeTab === 'report'
                  ? 'bg-[#1E2738] text-[#C5F36B] border border-[#C5F36B]/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Report</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-[#161D2B] text-slate-300 hover:bg-[#1F293D] border border-[#232F46] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-[#C5F36B] text-[#080B11] font-semibold hover:bg-[#B6E95B] transition-colors shadow-sm shadow-[#C5F36B]/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Content View */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#06080E] font-mono text-xs">
          <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {activeTab === 'json' ? jsonString : reportString}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1E2738] bg-[#080B11] text-[11px] text-slate-500 text-center font-mono">
          Methodology v{result.methodologyVersion} • Deterministic point-in-time proof
        </div>
      </div>
    </div>
  );
}
