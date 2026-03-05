'use client';

import { TradeTypeProvider } from '@/lib/trade-type';
import { ChatProvider } from '@/components/chat/ChatContext';
import { Chat } from '@/components/chat/Chat';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TradeTypeProvider>
      <ChatProvider>
        {children}
        <Chat />
      </ChatProvider>
    </TradeTypeProvider>
  );
}
