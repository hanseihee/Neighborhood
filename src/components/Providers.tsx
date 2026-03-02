'use client';

import { TradeTypeProvider } from '@/lib/trade-type';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <TradeTypeProvider>{children}</TradeTypeProvider>;
}
