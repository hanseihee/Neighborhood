'use client';

import type { ChatMessage } from '@/lib/chat-types';

const AVATAR_COLORS = [
  'from-rose-500/40 to-pink-500/40',
  'from-orange-500/40 to-amber-500/40',
  'from-emerald-500/40 to-teal-500/40',
  'from-cyan-500/40 to-sky-500/40',
  'from-blue-500/40 to-indigo-500/40',
  'from-violet-500/40 to-purple-500/40',
  'from-fuchsia-500/40 to-pink-500/40',
  'from-lime-500/40 to-green-500/40',
];

const TEXT_COLORS = [
  'text-rose-700',
  'text-orange-700',
  'text-emerald-700',
  'text-cyan-700',
  'text-blue-700',
  'text-violet-700',
  'text-fuchsia-700',
  'text-lime-700',
];

function getColorIndex(nickname: string): number {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  nickname: string;
  formatTime: (dateStr: string) => string;
  isLoading: boolean;
}

export function ChatMessages({ messages, nickname, formatTime, isLoading }: ChatMessagesProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-[14px]">
        첫 메시지를 보내보세요!
      </div>
    );
  }

  const groupedMessages: { messages: ChatMessage[]; nickname: string; isMe: boolean }[] = [];
  messages.forEach((msg) => {
    const isMe = msg.nickname === nickname;
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.nickname === msg.nickname) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ messages: [msg], nickname: msg.nickname, isMe });
    }
  });

  return (
    <>
      {groupedMessages.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className={`flex gap-2 ${group.isMe ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {!group.isMe && (() => {
            const colorIndex = getColorIndex(group.nickname);
            return (
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[colorIndex]} border border-slate-200 flex items-center justify-center ${TEXT_COLORS[colorIndex]} text-[11px] font-bold shrink-0`}>
                {group.nickname.charAt(0).toUpperCase()}
              </div>
            );
          })()}

          <div className={`flex flex-col ${group.isMe ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
            {!group.isMe && (
              <span className="text-[12px] text-slate-400 mb-1 ml-1">
                {group.nickname.length > 15 ? group.nickname.slice(0, 15) + '\u2026' : group.nickname}
              </span>
            )}

            {group.messages.map((msg, msgIndex) => {
              const isLast = msgIndex === group.messages.length - 1;
              return (
                <div key={msg.id} className="max-w-[85%] mb-1">
                  <div
                    className={`px-3 py-2 rounded-2xl ${
                      group.isMe
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <p className="text-[14px] break-words leading-relaxed">{msg.message}</p>
                  </div>
                  {isLast && (
                    <p className={`text-[11px] mt-0.5 ${
                      group.isMe ? 'text-right text-slate-300' : 'text-left text-slate-300'
                    }`}>
                      {formatTime(msg.created_at)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
