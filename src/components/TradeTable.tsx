'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { AptTrade } from '@/lib/types';
import { formatPrice, formatArea, formatDate } from '@/lib/utils';

interface TradeTableProps {
  trades: AptTrade[];
  initialRows?: number;
}

type SortKey = 'dealAmount' | 'area' | 'floor' | 'date';
type SortDir = 'asc' | 'desc';

export default function TradeTable({ trades, initialRows = 20 }: TradeTableProps) {
  const [showAll, setShowAll] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedTrade, setSelectedTrade] = useState<AptTrade | null>(null);

  const maxPrice = trades.length > 0 ? Math.max(...trades.map(t => t.거래금액)) : 0;

  const sorted = [...trades].sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1;
    switch (sortKey) {
      case 'dealAmount':
        return (a.거래금액 - b.거래금액) * dir;
      case 'area':
        return (a.전용면적 - b.전용면적) * dir;
      case 'floor':
        return (a.층 - b.층) * dir;
      case 'date': {
        const da = a.년 * 10000 + a.월 * 100 + a.일;
        const db = b.년 * 10000 + b.월 * 100 + b.일;
        return (da - db) * dir;
      }
    }
  });

  const displayed = showAll ? sorted : sorted.slice(0, initialRows);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) =>
    active ? (
      dir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
    ) : null;

  const thClass =
    'text-right py-3 px-3 text-[13px] font-medium text-slate-400 cursor-pointer select-none hover:text-slate-600 transition-colors';

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 px-4 text-[13px] font-medium text-slate-400">
                아파트
              </th>
              <th className="text-left py-3 px-3 text-[13px] font-medium text-slate-400 hidden md:table-cell">
                법정동
              </th>
              <th className={thClass} onClick={() => handleSort('dealAmount')}>
                <span className="inline-flex items-center gap-1">
                  거래금액
                  <SortIcon active={sortKey === 'dealAmount'} dir={sortDir} />
                </span>
              </th>
              <th
                className={`${thClass} hidden sm:table-cell`}
                onClick={() => handleSort('area')}
              >
                <span className="inline-flex items-center gap-1">
                  전용면적
                  <SortIcon active={sortKey === 'area'} dir={sortDir} />
                </span>
              </th>
              <th
                className={`${thClass} hidden sm:table-cell`}
                onClick={() => handleSort('floor')}
              >
                <span className="inline-flex items-center gap-1">
                  층
                  <SortIcon active={sortKey === 'floor'} dir={sortDir} />
                </span>
              </th>
              <th className={thClass} onClick={() => handleSort('date')}>
                <span className="inline-flex items-center gap-1">
                  거래일
                  <SortIcon active={sortKey === 'date'} dir={sortDir} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((trade, i) => (
              <tr
                key={i}
                className="border-b border-slate-50/80 hover:bg-primary-50/30 transition-colors cursor-pointer"
                onClick={() => setSelectedTrade(trade)}
              >
                <td className="py-3 px-4">
                  <p className="text-[14px] font-medium text-slate-800">
                    {trade.아파트}
                  </p>
                  <p className="text-[12px] text-slate-400 sm:hidden mt-0.5">
                    {trade.전용면적}㎡ · {trade.층}층
                  </p>
                </td>
                <td className="py-3 px-3 text-[13px] text-slate-500 hidden md:table-cell">
                  {trade.법정동}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    {trade.거래금액 === maxPrice && trades.length > 1 && (
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-500">
                        최고가
                      </span>
                    )}
                    <span className={`text-[15px] font-bold tabular-nums ${
                      trade.거래금액 === maxPrice && trades.length > 1 ? 'text-red-500' : 'text-slate-900'
                    }`}>
                      {formatPrice(trade.거래금액)}
                    </span>
                  </span>
                </td>
                <td className="py-3 px-3 text-right text-[13px] text-slate-500 tabular-nums hidden sm:table-cell">
                  {formatArea(trade.전용면적)}
                </td>
                <td className="py-3 px-3 text-right text-[13px] text-slate-500 tabular-nums hidden sm:table-cell">
                  {trade.층}층
                </td>
                <td className="py-3 px-3 text-right text-[13px] text-slate-400 tabular-nums">
                  {formatDate(trade.년, trade.월, trade.일)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {trades.length > initialRows && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-3 py-2.5 text-[14px] font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50/50 rounded-xl transition-colors cursor-pointer"
        >
          전체 {trades.length}건 보기
        </button>
      )}

      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      )}
    </div>
  );
}

function TradeDetailModal({
  trade,
  onClose,
}: {
  trade: AptTrade;
  onClose: () => void;
}) {
  const rows: { label: string; value: string; highlight?: boolean }[] = [
    { label: '단지명', value: trade.아파트, highlight: true },
    { label: '거래금액', value: formatPrice(trade.거래금액), highlight: true },
    { label: '계약일', value: formatDate(trade.년, trade.월, trade.일) },
    { label: '전용면적', value: formatArea(trade.전용면적) },
    { label: '층', value: `${trade.층}층` },
    { label: '건축년도', value: trade.건축년도 ? `${trade.건축년도}년` : '-' },
    { label: '법정동', value: trade.법정동 || '-' },
    { label: '도로명', value: trade.도로명 || '-' },
    { label: '지번', value: trade.지번 || '-' },
    { label: '거래유형', value: trade.거래유형 || '-' },
    { label: '매도자', value: trade.매도자 || '-' },
    { label: '매수자', value: trade.매수자 || '-' },
    { label: '중개사소재지', value: trade.중개사소재지 || '-' },
    { label: '등기일자', value: trade.등기일자 || '-' },
    { label: '아파트동', value: trade.아파트동 || '-' },
    { label: '단지일련번호', value: trade.단지일련번호 || '-' },
    {
      label: '토지임대부',
      value:
        trade.토지임대부 === 'Y'
          ? '예'
          : trade.토지임대부 === 'N'
            ? '아니오'
            : '-',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/25 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-[17px] font-semibold text-slate-900">
            거래 상세 정보
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-2">
          <div className="divide-y divide-slate-50">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2.5">
                <span className="text-[13px] text-slate-400">{row.label}</span>
                <span
                  className={`text-[14px] tabular-nums text-right ${
                    row.highlight
                      ? 'font-bold text-slate-900'
                      : 'font-medium text-slate-600'
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[14px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
