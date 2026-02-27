'use client';

import { Building2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <Building2 size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[16px] font-bold text-slate-800 tracking-tight">
            실거래가
          </span>
          <span className="text-[12px] text-slate-400 hidden sm:inline ml-0.5">
            국토교통부 공공데이터
          </span>
        </a>
      </div>
    </header>
  );
}
