'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useChatContext } from './ChatContext';
import { ChatMessages } from './ChatMessages';
import { EmojiPicker } from './EmojiPicker';

export function Chat() {
  const {
    messages,
    newMessage,
    setNewMessage,
    nickname,
    setNickname,
    isSettingNickname,
    setIsSettingNickname,
    nicknameError,
    setNicknameError,
    unreadCount,
    isLoading,
    isLoadingMore,
    isVisible,
    setIsVisible,
    isMounted,
    onlineCount,
    onlineUsers,
    blockedUsers,
    showParticipants,
    setShowParticipants,
    showScrollButton,
    latestMessage,
    showMessageToast,
    messagesContainerRef,
    inputRef,
    sendMessage,
    saveNickname,
    formatTime,
    handleScrollToBottom,
    notifyLayoutChange,
    blockUser,
    unblockUser,
  } = useChatContext();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const myDeviceId = typeof window !== 'undefined' ? localStorage.getItem('chat-device-id') || '' : '';

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleTyping = useCallback(() => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 500);
  }, []);

  useEffect(() => {
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, []);

  // Lock body scroll on mobile
  useEffect(() => {
    if (!isDesktop && isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDesktop, isVisible]);

  // Re-layout on resize
  useEffect(() => {
    if (isVisible) {
      notifyLayoutChange();
      const timer = setTimeout(() => handleScrollToBottom(), 100);
      return () => clearTimeout(timer);
    }
  }, [isDesktop]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(e);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Floating button
  const renderFloatingButton = () => (
    <div className={`fixed z-50 flex items-center gap-3 ${isDesktop ? 'bottom-8 right-8' : 'bottom-6 right-6'}`}>
      {showMessageToast && latestMessage && (
        <div
          className="max-w-[200px] sm:max-w-[280px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl rounded-br-sm px-3 py-2 shadow-lg animate-in fade-in cursor-pointer"
          onClick={() => setIsVisible(true)}
        >
          <p className="text-xs text-slate-500 truncate font-medium">{latestMessage.nickname}</p>
          <p className="text-sm text-slate-800 truncate">{latestMessage.message}</p>
        </div>
      )}
      <button
        onClick={() => setIsVisible(true)}
        className="w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center relative shrink-0 cursor-pointer"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );

  // Header
  const renderHeader = () => (
    <div className={`px-4 py-3 bg-white border-b border-slate-200 shrink-0 ${!isDesktop ? 'pt-[calc(12px+env(safe-area-inset-top,0px))]' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVisible(false)}
            className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 className="text-slate-800 font-semibold text-sm">오픈 채팅</h3>
          {onlineCount > 0 && (
            <button
              onClick={() => setShowParticipants(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 px-2 py-1 rounded-full transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>{onlineCount}명</span>
            </button>
          )}
        </div>
        <button
          onClick={() => setIsSettingNickname(true)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors truncate max-w-[120px] underline underline-offset-2 cursor-pointer"
        >
          {nickname || '닉네임 설정'}
        </button>
      </div>
    </div>
  );

  // Nickname modal
  const renderNicknameModal = () => (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex items-center justify-center z-10 p-4 rounded-2xl">
      <form onSubmit={saveNickname} className="w-full max-w-[280px] space-y-4">
        <h4 className="text-slate-800 font-semibold text-center">닉네임 설정</h4>
        <div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setNicknameError(''); }}
            placeholder="닉네임을 입력하세요"
            maxLength={15}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-base placeholder-slate-300 focus:outline-none ${
              nicknameError ? 'border-red-400' : 'border-slate-200 focus:border-primary-400'
            }`}
            autoFocus
          />
          {nicknameError && <p className="text-red-500 text-sm mt-1.5">{nicknameError}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsSettingNickname(false)}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!nickname.trim()}
            className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </form>
    </div>
  );

  // Participants modal
  const renderParticipantsModal = () => (
    <div className="absolute inset-0 bg-white flex flex-col z-10 p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-slate-800 font-semibold">참가자 ({onlineCount}명)</h4>
        <button
          onClick={() => setShowParticipants(false)}
          className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {onlineUsers.map((user) => {
          const isMe = user.user_hash === myDeviceId;
          const isBlocked = blockedUsers.includes(user.user_hash);
          return (
            <div key={user.user_hash} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/30 to-sky-500/30 border border-slate-200 flex items-center justify-center text-primary-700 text-sm font-bold shrink-0">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <span className={`text-sm truncate ${isMe ? 'text-primary-600 font-medium' : 'text-slate-600'}`}>
                  {user.nickname.length > 15 ? user.nickname.slice(0, 15) + '\u2026' : user.nickname}
                  {isMe && ' (나)'}
                </span>
              </div>
              {!isMe && (
                <button
                  onClick={() => isBlocked ? unblockUser(user.user_hash) : blockUser(user.user_hash)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isBlocked
                      ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      : 'bg-red-50 text-red-500 hover:bg-red-100'
                  }`}
                >
                  {isBlocked ? '차단해제' : '차단'}
                </button>
              )}
            </div>
          );
        })}
        {onlineUsers.length === 0 && (
          <p className="text-slate-300 text-center py-8">참가자가 없습니다</p>
        )}
      </div>
      {blockedUsers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-slate-400 text-sm">차단된 사용자: {blockedUsers.length}명</p>
        </div>
      )}
    </div>
  );

  // Messages area
  const renderMessages = () => (
    <div className="relative flex-1 min-h-0">
      <div
        ref={messagesContainerRef}
        className="absolute inset-0 overflow-y-auto overscroll-contain p-4 space-y-3 bg-slate-50/50"
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <ChatMessages
          messages={messages}
          nickname={nickname}
          formatTime={formatTime}
          isLoading={isLoading}
        />
      </div>

      {showScrollButton && (
        <button
          onClick={handleScrollToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-medium shadow-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          최신 메시지
        </button>
      )}
    </div>
  );

  // Input area
  const renderInput = () => (
    <form
      onSubmit={handleSendMessage}
      className={`p-3 border-t border-slate-200 bg-white shrink-0 ${!isDesktop ? 'pb-[calc(12px+env(safe-area-inset-bottom,0px))]' : ''}`}
    >
      <div className="relative flex gap-2 items-center">
        {showEmojiPicker && (
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
        )}
        <button
          type="button"
          data-emoji-trigger
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
        >
          <span className="text-xl">{'\u{1F600}'}</span>
        </button>
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
          onFocus={() => {
            setShowEmojiPicker(false);
            if (!isDesktop) setTimeout(() => handleScrollToBottom(), 300);
          }}
          placeholder="메시지를 입력하세요..."
          maxLength={500}
          className={`flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-800 text-base placeholder-slate-300 focus:outline-none focus:border-primary-400 transition-colors ${isTyping ? 'ring-2 ring-primary-200' : ''}`}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors shrink-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </form>
  );

  // Chat panel
  const renderChatPanel = () => {
    if (isDesktop) {
      return (
        <aside className="fixed right-8 top-24 bottom-8 w-[352px] z-50" aria-label="실시간 채팅">
          <div className="h-full flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-2xl relative">
            {renderHeader()}
            {isSettingNickname && renderNicknameModal()}
            {showParticipants && renderParticipantsModal()}
            {renderMessages()}
            {renderInput()}
          </div>
        </aside>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white">
        {renderHeader()}
        {isSettingNickname && renderNicknameModal()}
        {showParticipants && renderParticipantsModal()}
        {renderMessages()}
        {renderInput()}
      </div>
    );
  };

  if (!isMounted) return null;

  return (
    <>
      {!isVisible && renderFloatingButton()}
      {isVisible && renderChatPanel()}
    </>
  );
}
