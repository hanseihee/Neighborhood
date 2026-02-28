'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: '지역별' },
  { href: '/metro', label: '시도 비교' },
  { href: '/district', label: '시군구 비교' },
  { href: '/volume', label: '거래량' },
  { href: '/ranking', label: '티어' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <Building2 size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[16px] font-bold text-slate-800 tracking-tight">
              실거래가
            </span>
            <span className="text-[12px] text-slate-400 hidden sm:inline ml-0.5">
              국토교통부 공공데이터
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
