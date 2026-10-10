import React from 'react';
import { VerificationStatus } from '@/lib/meteora/constants';
import { CheckCircle2, AlertTriangle, Clock, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: StatusBadgeProps) {
  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  let Icon = HelpCircle;

  switch (status) {
    case VerificationStatus.VERIFIED:
      bg = 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 shadow-sm shadow-[#10B981]/10';
      Icon = CheckCircle2;
      break;
    case VerificationStatus.DISCREPANCY:
      bg = 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/40 shadow-sm shadow-[#F43F5E]/10';
      Icon = AlertTriangle;
      break;
    case VerificationStatus.UNVERIFIED:
      bg = 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40 shadow-sm shadow-[#F59E0B]/10';
      Icon = Clock;
      break;
    case VerificationStatus.INSUFFICIENT_DATA:
      bg = 'bg-[#64748B]/15 text-[#94A3B8] border-[#64748B]/40';
      Icon = HelpCircle;
      break;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border ${bg} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />}
      <span>{status}</span>
    </span>
  );
}
