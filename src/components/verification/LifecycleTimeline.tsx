import React from 'react';
import { PoolLifecycleStage, VerificationStatus } from '@/lib/meteora/constants';
import { Check, Clock, AlertTriangle } from 'lucide-react';

interface LifecycleTimelineProps {
  currentStage: PoolLifecycleStage;
  status: VerificationStatus;
}

const STAGES = [
  {
    key: PoolLifecycleStage.ACTIVE_TRADING,
    title: '1. Active Trading',
    subtitle: 'Curve Accumulation',
  },
  {
    key: PoolLifecycleStage.THRESHOLD_REACHED,
    title: '2. Threshold Reached',
    subtitle: 'Graduation Trigger',
  },
  {
    key: PoolLifecycleStage.MIGRATION_INITIATED,
    title: '3. Migration Initiated',
    subtitle: 'Instruction Crank',
  },
  {
    key: PoolLifecycleStage.MIGRATION_CONFIRMED,
    title: '4. Migration Confirmed',
    subtitle: 'DBC Vaults Drained',
  },
  {
    key: PoolLifecycleStage.DESTINATION_VERIFIED,
    title: '5. Destination Verified',
    subtitle: 'AMM Pool Established',
  },
  {
    key: PoolLifecycleStage.RECONCILED,
    title: '6. Reconciled',
    subtitle: 'Reserves & LP Custody',
  },
];

const STAGE_ORDER: Record<PoolLifecycleStage, number> = {
  [PoolLifecycleStage.ACTIVE_TRADING]: 0,
  [PoolLifecycleStage.THRESHOLD_REACHED]: 1,
  [PoolLifecycleStage.MIGRATION_INITIATED]: 2,
  [PoolLifecycleStage.MIGRATION_CONFIRMED]: 3,
  [PoolLifecycleStage.DESTINATION_VERIFIED]: 4,
  [PoolLifecycleStage.RECONCILED]: 5,
};

export function LifecycleTimeline({ currentStage, status }: LifecycleTimelineProps) {
  const currentIndex = STAGE_ORDER[currentStage] ?? 0;
  const isDiscrepancy = status === VerificationStatus.DISCREPANCY;

  return (
    <div className="w-full bg-[#0F1420] border border-[#1E2738] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            Observable Lifecycle State Machine
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Independent multi-stage verification transitions
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Stage <span className="text-[#C5F36B] font-semibold">{currentIndex + 1}</span> of {STAGES.length}
        </div>
      </div>

      {/* Responsive timeline grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-2">
        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          let cardBorder = 'border-[#1E2738] bg-[#0A0D15]/60 text-slate-500';
          let circleBg = 'bg-[#161D2B] text-slate-500 border border-[#263248]';

          if (isPassed) {
            cardBorder = 'border-[#10B981]/40 bg-[#10B981]/5 text-slate-300';
            circleBg = 'bg-[#10B981] text-[#080B11]';
          } else if (isCurrent) {
            if (isDiscrepancy) {
              cardBorder = 'border-[#F43F5E] bg-[#F43F5E]/10 text-white shadow-lg shadow-[#F43F5E]/10';
              circleBg = 'bg-[#F43F5E] text-white animate-pulse';
            } else if (status === VerificationStatus.VERIFIED) {
              cardBorder = 'border-[#10B981] bg-[#10B981]/15 text-white shadow-lg shadow-[#10B981]/10';
              circleBg = 'bg-[#10B981] text-[#080B11]';
            } else {
              cardBorder = 'border-[#C5F36B] bg-[#C5F36B]/10 text-white shadow-lg shadow-[#C5F36B]/10';
              circleBg = 'bg-[#C5F36B] text-[#080B11]';
            }
          }

          return (
            <div
              key={stage.key}
              className={`flex flex-col p-3 rounded-lg border transition-all ${cardBorder}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${circleBg}`}
                >
                  {isPassed ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isCurrent && isDiscrepancy ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                {isCurrent && (
                  <span
                    className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                      isDiscrepancy
                        ? 'bg-[#F43F5E]/20 text-[#F43F5E]'
                        : 'bg-[#C5F36B]/20 text-[#C5F36B]'
                    }`}
                  >
                    Current
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold leading-tight">{stage.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1">{stage.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
