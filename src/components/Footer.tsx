import Link from 'next/link';
import { Building2 } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: '시세' },
  { href: '/metro', label: '시도 비교' },
  { href: '/district', label: '시군구 비교' },
  { href: '/volume', label: '거래량' },
  { href: '/ranking', label: '티어' },
  { href: '/find', label: '아파트 찾기' },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          {/* 브랜드 */}
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <Building2 size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[16px] font-bold text-slate-800 tracking-tight">
                얼마집
              </span>
            </Link>
            <p className="text-[13px] text-slate-400 leading-relaxed max-w-xs">
              국토교통부 공공데이터 기반<br />
              아파트 실거래가 · 전월세 조회 서비스
            </p>
          </div>

          {/* 네비게이션 */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 하단 */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[12px] text-slate-300">
            &copy; {new Date().getFullYear()} 얼마집. 본 서비스는 국토교통부 공공데이터를 활용하며, 정보의 정확성을 보장하지 않습니다.
          </p>
          <a
            href="https://www.data.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-slate-300 hover:text-slate-400 transition-colors"
          >
            공공데이터포털
          </a>
        </div>
      </div>
    </footer>
  );
}
