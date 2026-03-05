'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/chat-types';
import { generateRandomNickname } from '@/lib/nickname-generator';

const STORAGE_KEY = 'chat-nickname';
const DEVICE_ID_KEY = 'chat-device-id';
const BLOCKED_USERS_KEY = 'chat-blocked-users';
const MESSAGES_LIMIT = 50;

interface OnlineUser {
  nickname: string;
  user_hash: string;
}

const getBlockedUsers = (): string[] => {
  if (typeof window === 'undefined') return [];
  const blocked = localStorage.getItem(BLOCKED_USERS_KEY);
  return blocked ? JSON.parse(blocked) : [];
};

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getDeviceId = (): string => {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSettingNickname, setIsSettingNickname] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [layoutKey, setLayoutKey] = useState(0);
  const [latestMessage, setLatestMessage] = useState<ChatMessage | null>(null);
  const [showMessageToast, setShowMessageToast] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const prevMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const hasTrackedRef = useRef(false);
  const myNicknameRef = useRef('');
  const prevIsVisibleRef = useRef(false);
  const prevIsVisibleForScrollRef = useRef(false);
  const isReconnectingRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setNickname(saved);
      myNicknameRef.current = saved;
    } else {
      const randomNickname = generateRandomNickname();
      setNickname(randomNickname);
      myNicknameRef.current = randomNickname;
      localStorage.setItem(STORAGE_KEY, randomNickname);
    }
    setBlockedUsers(getBlockedUsers());
    setIsMounted(true);
  }, []);

  const scrollToBottom = useCallback((immediate = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (immediate) {
          container.scrollTop = container.scrollHeight;
        } else {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      });
    });
  }, []);

  const supabase = getSupabase();

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    isInitialLoadRef.current = true;
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MESSAGES_LIMIT);

    if (!error && data) {
      const msgs = data.reverse();
      setMessages(msgs);
      prevMessageCountRef.current = msgs.length;
      setHasMore(data.length === MESSAGES_LIMIT);
    }
    setIsLoading(false);
  }, [supabase]);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;
    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setIsLoadingMore(true);
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .lt('created_at', oldestMessage.created_at)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_LIMIT);

    if (!error && data) {
      const olderMsgs = data.reverse();
      if (olderMsgs.length > 0) {
        setMessages((prev) => [...olderMsgs, ...prev]);
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      }
      setHasMore(data.length === MESSAGES_LIMIT);
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, messages, supabase]);

  // Realtime subscription
  useEffect(() => {
    fetchMessages();

    const messagesChannel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);

          if (!isVisible) {
            setUnreadCount((prev) => prev + 1);
            const myDeviceId = getDeviceId();
            if (newMsg.user_hash !== myDeviceId) {
              if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
              setLatestMessage(newMsg);
              setShowMessageToast(true);
              toastTimeoutRef.current = setTimeout(() => setShowMessageToast(false), 4000);
            }
          }
        }
      )
      .subscribe();

    messagesChannelRef.current = messagesChannel;

    // Presence
    const myDeviceId = getDeviceId();
    const presenceChannel = supabase.channel('chat_presence', {
      config: { presence: { key: myDeviceId } },
    });

    hasTrackedRef.current = false;

    const updateOnlineUsers = (state: Record<string, unknown[]>, includesSelf: boolean) => {
      const users: OnlineUser[] = [];
      let foundSelf = false;
      Object.entries(state).forEach(([key, presences]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          const presence = presences[0] as { nickname?: string; user_hash?: string };
          users.push({ nickname: presence.nickname || '익명', user_hash: presence.user_hash || key });
          if (key === myDeviceId || presence.user_hash === myDeviceId) foundSelf = true;
        }
      });
      if (!foundSelf && includesSelf && myNicknameRef.current) {
        users.push({ nickname: myNicknameRef.current, user_hash: myDeviceId });
      }
      setOnlineUsers(users);
      setOnlineCount(users.length);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        updateOnlineUsers(presenceChannel.presenceState(), hasTrackedRef.current);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          let currentNickname = localStorage.getItem(STORAGE_KEY);
          if (!currentNickname) {
            currentNickname = generateRandomNickname();
            localStorage.setItem(STORAGE_KEY, currentNickname);
          }
          myNicknameRef.current = currentNickname;
          await presenceChannel.track({
            nickname: currentNickname,
            user_hash: myDeviceId,
            online_at: new Date().toISOString(),
          });
          hasTrackedRef.current = true;
          updateOnlineUsers(presenceChannel.presenceState(), true);
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      hasTrackedRef.current = false;
      if (messagesChannelRef.current) supabase.removeChannel(messagesChannelRef.current);
      if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
    };
  }, [fetchMessages, supabase]);

  // Reconnect on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isReconnectingRef.current) {
        isReconnectingRef.current = true;
        const messagesChannel = messagesChannelRef.current;
        const presenceChannel = presenceChannelRef.current;

        if (messagesChannel) {
          const state = messagesChannel.state;
          if (state !== 'joined' && state !== 'joining') await messagesChannel.subscribe();
        }
        if (presenceChannel) {
          const state = presenceChannel.state;
          if (state !== 'joined' && state !== 'joining') {
            await presenceChannel.subscribe();
            const currentNickname = localStorage.getItem(STORAGE_KEY);
            if (currentNickname) {
              await presenceChannel.track({
                nickname: currentNickname,
                user_hash: getDeviceId(),
                online_at: new Date().toISOString(),
              });
            }
          }
        }
        await fetchMessages();
        isReconnectingRef.current = false;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchMessages]);

  // Scroll on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0 && isInitialLoadRef.current) {
      requestAnimationFrame(() => scrollToBottom(true));
      isInitialLoadRef.current = false;
    }
  }, [isLoading, messages.length, scrollToBottom]);

  // Scroll when chat becomes visible
  useEffect(() => {
    if (isVisible && !prevIsVisibleForScrollRef.current && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom(true);
        setIsAtBottom(true);
        setShowScrollButton(false);
      }, 50);
      prevIsVisibleForScrollRef.current = isVisible;
      return () => clearTimeout(timer);
    }
    prevIsVisibleForScrollRef.current = isVisible;
  }, [isVisible, scrollToBottom, messages.length]);

  // Scroll handler
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMore && !isLoadingMore) loadMoreMessages();
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setIsAtBottom(isNearBottom);
      setShowScrollButton(!isNearBottom);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, loadMoreMessages, isVisible, layoutKey]);

  // Auto-scroll on new message
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && isAtBottom) {
      scrollToBottom(true);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, scrollToBottom, isAtBottom]);

  // Clear unread on close
  useEffect(() => {
    if (prevIsVisibleRef.current && !isVisible) setUnreadCount(0);
    prevIsVisibleRef.current = isVisible;
  }, [isVisible]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !nickname.trim()) return;

    const { error } = await supabase.from('chat_messages').insert({
      nickname: nickname.trim(),
      message: newMessage.trim(),
      user_hash: getDeviceId(),
    });

    if (error) {
      if (error.message?.includes('Too many messages')) {
        alert('메시지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 시도해주세요.');
      }
    } else {
      setNewMessage('');
    }
  };

  const saveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) return;

    setNicknameError('');
    const myDeviceId = getDeviceId();

    const { data: existingUser } = await supabase
      .from('chat_users')
      .select('nickname')
      .eq('user_hash', myDeviceId)
      .single();

    const { data: nicknameOwner } = await supabase
      .from('chat_users')
      .select('user_hash')
      .eq('nickname', trimmedNickname)
      .single();

    if (nicknameOwner && nicknameOwner.user_hash !== myDeviceId) {
      setNicknameError('이미 사용 중인 닉네임입니다');
      return;
    }

    const { data: messageWithNickname } = await supabase
      .from('chat_messages')
      .select('user_hash')
      .eq('nickname', trimmedNickname)
      .neq('user_hash', myDeviceId)
      .limit(1)
      .single();

    if (messageWithNickname) {
      setNicknameError('이미 사용 중인 닉네임입니다');
      return;
    }

    if (existingUser) {
      const { error: updateError } = await supabase
        .from('chat_users')
        .update({ nickname: trimmedNickname, updated_at: new Date().toISOString() })
        .eq('user_hash', myDeviceId);
      if (updateError) {
        setNicknameError('닉네임 변경에 실패했습니다');
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('chat_users')
        .insert({ user_hash: myDeviceId, nickname: trimmedNickname });
      if (insertError) {
        setNicknameError('닉네임 저장에 실패했습니다');
        return;
      }
    }

    localStorage.setItem(STORAGE_KEY, trimmedNickname);
    myNicknameRef.current = trimmedNickname;
    setIsSettingNickname(false);

    // Update presence with new nickname
    if (presenceChannelRef.current) {
      await presenceChannelRef.current.track({
        nickname: trimmedNickname,
        user_hash: myDeviceId,
        online_at: new Date().toISOString(),
      });
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom(true);
    setIsAtBottom(true);
    setShowScrollButton(false);
  }, [scrollToBottom]);

  const notifyLayoutChange = useCallback(() => {
    setLayoutKey((prev) => prev + 1);
  }, []);

  const blockUser = useCallback((userHash: string) => {
    setBlockedUsers((prev) => {
      const updated = [...prev, userHash];
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unblockUser = useCallback((userHash: string) => {
    setBlockedUsers((prev) => {
      const updated = prev.filter((hash) => hash !== userHash);
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const filteredMessages = messages.filter((msg) => !blockedUsers.includes(msg.user_hash || ''));

  return {
    messages: filteredMessages,
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
    hasMore,
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
    loadMoreMessages,
    handleScrollToBottom,
    notifyLayoutChange,
    blockUser,
    unblockUser,
  };
}
