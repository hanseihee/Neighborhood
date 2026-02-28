'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: '지역별' },
  { href: '/metro', label: '시도 비교' },
  { href: '/district', label: '시군구 비교' },
  { href: '/volume', label: '거래량' },
  { href: '/ranking', label: '티어' },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
      {/* 데스크톱 */}
      <div className="hidden md:flex max-w-[1400px] mx-auto px-5 sm:px-8 h-14 items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <Building2 size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[16px] font-bold text-slate-800 tracking-tight">
              실거래가
            </span>
            <span className="text-[12px] text-slate-400 ml-0.5">
              국토교통부 공공데이터
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
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

      {/* 모바일 */}
      <div className="md:hidden px-4 h-14 flex items-center relative" ref={menuRef}>
        {/* 왼쪽: 햄버거 */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="메뉴"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* 가운데: 사이트명 */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <Building2 size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[16px] font-bold text-slate-800 tracking-tight">
            실거래가
          </span>
        </Link>

        {/* 오른쪽: 균형용 빈 영역 */}
        <div className="w-9" />

        {/* 드롭다운 메뉴 */}
        {menuOpen && (
          <div className="absolute left-4 top-full mt-2 w-44 bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/50 py-1.5 z-50">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`block px-4 py-2.5 text-[14px] font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
