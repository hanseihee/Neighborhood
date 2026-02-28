'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { searchApartments } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { SearchResult } from '@/lib/types';

interface ApartmentSearchProps {
  onSelect: (result: SearchResult) => void;
}

export default function ApartmentSearch({ onSelect }: ApartmentSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchApartments(q, 10);
      setResults(data);
      setIsOpen(data.length > 0);
      setActiveIndex(-1);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value.trim()), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleSelect(results[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="아파트 이름 검색"
          className="h-10 w-full sm:w-56 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 transition-all"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1.5 w-full sm:w-80 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {results.map((r, i) => (
            <li key={`${r.apartmentName}-${r.districtCode}`}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full text-left px-3.5 py-2.5 transition-colors cursor-pointer ${
                  i === activeIndex ? 'bg-primary-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-slate-800 truncate">
                    {r.apartmentName}
                  </span>
                  <span className="text-[13px] font-semibold text-primary-600 whitespace-nowrap">
                    {formatPrice(r.recentPrice)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[12px] text-slate-400 truncate">
                    {r.districtName} {r.dongName}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    {r.tradeCount}건
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
