'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type TradeType = 'trade' | 'rent';

interface TradeTypeContextValue {
  tradeType: TradeType;
  setTradeType: (type: TradeType) => void;
}

const TradeTypeContext = createContext<TradeTypeContextValue | null>(null);

const STORAGE_KEY = 'neighborhood-trade-type';

export function TradeTypeProvider({ children }: { children: ReactNode }) {
  const [tradeType, setTradeType] = useState<TradeType>('trade');

  // localStorage에서 초기값 복원
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'rent') setTradeType('rent');
  }, []);

  const handleSetTradeType = (type: TradeType) => {
    setTradeType(type);
    localStorage.setItem(STORAGE_KEY, type);
  };

  return (
    <TradeTypeContext.Provider value={{ tradeType, setTradeType: handleSetTradeType }}>
      {children}
    </TradeTypeContext.Provider>
  );
}

export function useTradeType() {
  const ctx = useContext(TradeTypeContext);
  if (!ctx) throw new Error('useTradeType must be used within TradeTypeProvider');
  return ctx;
}

export function TradeTypeToggle() {
  const { tradeType, setTradeType } = useTradeType();

  return (
    <div className="flex gap-1 bg-slate-50 rounded-xl p-1 w-fit">
      <button
        onClick={() => setTradeType('trade')}
        className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-colors cursor-pointer ${
          tradeType === 'trade'
            ? 'text-primary-600 bg-white shadow-sm'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        매매
      </button>
      <button
        onClick={() => setTradeType('rent')}
        className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-colors cursor-pointer ${
          tradeType === 'rent'
            ? 'text-primary-600 bg-white shadow-sm'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        전월세
      </button>
    </div>
  );
}
