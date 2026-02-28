import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  change?: number | null;
  sub?: string;
  icon?: ReactNode;
}

export default function StatCard({ label, value, change, sub, icon }: StatCardProps) {
  const isUp = change !== undefined && change !== null && change > 0;
  const isDown = change !== undefined && change !== null && change < 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 p-5 hover:border-slate-200 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] text-slate-400 font-medium">{label}</span>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <p className="text-[28px] font-bold text-slate-900 tabular-nums tracking-tight leading-none">
        {value}
      </p>
      {change !== undefined && change !== null && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center text-[13px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
              isUp
                ? 'text-up bg-up-bg'
                : isDown
                  ? 'text-down bg-down-bg'
                  : 'text-slate-400 bg-slate-50'
            }`}
          >
            {isUp ? '+' : ''}{change}%
          </span>
          <span className="text-[13px] text-slate-400">전월대비</span>
        </div>
      )}
      {sub && (
        <p className={`${change ? 'mt-1' : 'mt-3'} text-[13px] text-slate-400`}>{sub}</p>
      )}
    </div>
  );
}
