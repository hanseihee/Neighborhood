'use client';

import { useState, useEffect, useRef } from 'react';

const EMOJI_CATEGORIES = {
  smileys: {
    label: '\u{1F600}',
    title: '감정',
    emojis: [
      '\u{1F600}', '\u{1F603}', '\u{1F604}', '\u{1F601}', '\u{1F60A}', '\u{1F970}', '\u{1F60D}', '\u{1F929}',
      '\u{1F602}', '\u{1F923}', '\u{1F605}', '\u{1F606}', '\u{1F609}', '\u{1F60B}', '\u{1F60E}', '\u{1F913}',
      '\u{1F979}', '\u{1F622}', '\u{1F62D}', '\u{1F624}', '\u{1F621}', '\u{1F92C}', '\u{1F631}', '\u{1F628}',
      '\u{1F914}', '\u{1F928}', '\u{1F9D0}', '\u{1F60F}', '\u{1F612}', '\u{1F644}', '\u{1F62C}', '\u{1F92F}',
    ],
  },
  gestures: {
    label: '\u{1F44D}',
    title: '제스처',
    emojis: [
      '\u{1F44D}', '\u{1F44E}', '\u{1F44F}', '\u{1F64C}', '\u{1F91D}', '\u{1F64F}', '\u{1F4AA}', '\u270C\uFE0F',
      '\u{1F91E}', '\u{1F91F}', '\u{1F918}', '\u{1F44C}', '\u{1F90C}', '\u{1F44B}', '\u270B', '\u{1F590}\uFE0F',
      '\u{1F440}', '\u{1F441}\uFE0F', '\u{1F443}', '\u{1F442}', '\u{1F9E0}', '\u{1F480}', '\u{1F47B}', '\u{1F916}',
    ],
  },
  realestate: {
    label: '\u{1F3E0}',
    title: '부동산',
    emojis: [
      '\u{1F3E0}', '\u{1F3E1}', '\u{1F3E2}', '\u{1F3D7}\uFE0F', '\u{1F3D8}\uFE0F', '\u{1F3D9}\uFE0F', '\u{1F3DA}\uFE0F', '\u{1F3DB}\uFE0F',
      '\u{1F4B0}', '\u{1F4B5}', '\u{1F4B8}', '\u{1F4C8}', '\u{1F4C9}', '\u{1F4CA}', '\u{1F4CB}', '\u{1F511}',
      '\u26A0\uFE0F', '\u2705', '\u274C', '\u2753', '\u2757', '\u{1F514}', '\u{1F6A8}', '\u{1F3AF}',
    ],
  },
  hearts: {
    label: '\u2764\uFE0F',
    title: '하트',
    emojis: [
      '\u2764\uFE0F', '\u{1F9E1}', '\u{1F49B}', '\u{1F49A}', '\u{1F499}', '\u{1F49C}', '\u{1F5A4}', '\u{1F90D}',
      '\u{1F495}', '\u{1F49E}', '\u{1F493}', '\u{1F497}', '\u{1F496}', '\u{1F498}', '\u{1F49D}', '\u{1F494}',
    ],
  },
  objects: {
    label: '\u{1F525}',
    title: '기타',
    emojis: [
      '\u{1F525}', '\u2B50', '\u2728', '\u{1F4AB}', '\u{1F31F}', '\u26A1', '\u{1F4A5}', '\u{1F389}',
      '\u{1F38A}', '\u{1F3C6}', '\u{1F947}', '\u{1F948}', '\u{1F949}', '\u{1F381}', '\u{1F388}', '\u{1FA99}',
      '\u2615', '\u{1F37A}', '\u{1F37B}', '\u{1F942}', '\u{1F37E}', '\u{1F377}', '\u{1F378}', '\u{1F9CA}',
    ],
  },
};

type CategoryKey = keyof typeof EMOJI_CATEGORIES;

const RECENT_EMOJIS_KEY = 'chat-recent-emojis';
const MAX_RECENT = 8;

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('smileys');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
    if (stored) {
      try { setRecentEmojis(JSON.parse(stored)); } catch { setRecentEmojis([]); }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('[data-emoji-trigger]')) return;
      if (pickerRef.current && !pickerRef.current.contains(target)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEmojiClick = (emoji: string) => {
    const newRecent = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, MAX_RECENT);
    setRecentEmojis(newRecent);
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(newRecent));
    onSelect(emoji);
  };

  const categoryKeys = Object.keys(EMOJI_CATEGORIES) as CategoryKey[];

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 w-[280px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20"
    >
      <div className="flex border-b border-slate-100">
        {categoryKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategory(key)}
            className={`flex-1 py-2 text-lg transition-colors ${
              activeCategory === key
                ? 'bg-slate-50 border-b-2 border-primary-500'
                : 'hover:bg-slate-50'
            }`}
            title={EMOJI_CATEGORIES[key].title}
          >
            {EMOJI_CATEGORIES[key].label}
          </button>
        ))}
      </div>

      {recentEmojis.length > 0 && (
        <div className="p-2 border-b border-slate-100">
          <p className="text-[10px] text-slate-400 mb-1.5 px-1">최근 사용</p>
          <div className="flex flex-wrap gap-1">
            {recentEmojis.map((emoji, i) => (
              <button
                key={`recent-${i}`}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-2 h-[180px] overflow-y-auto">
        <p className="text-[10px] text-slate-400 mb-1.5 px-1">
          {EMOJI_CATEGORIES[activeCategory].title}
        </p>
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
