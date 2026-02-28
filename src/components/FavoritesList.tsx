'use client';

import { X } from 'lucide-react';
import { Star } from 'lucide-react';
import type { FavoriteApt } from '@/lib/favorites';
import { formatPrice } from '@/lib/utils';

interface FavoritesListProps {
  favorites: FavoriteApt[];
  onSelect: (fav: FavoriteApt) => void;
  onRemove: (aptName: string, regionCode: string) => void;
}

export default function FavoritesList({
  favorites,
  onSelect,
  onRemove,
}: FavoritesListProps) {
  if (favorites.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="flex-shrink-0 text-primary-500">
        <Star size={14} fill="currentColor" />
      </span>
      {favorites.map((fav) => (
        <div
          key={`${fav.aptName}_${fav.regionCode}`}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[13px] flex-shrink-0 hover:border-primary-300 transition-colors cursor-pointer"
          onClick={() => onSelect(fav)}
        >
          <span className="font-medium text-slate-700">{fav.aptName}</span>
          <span className="text-slate-400">{fav.regionName}</span>
          {fav.latestPrice > 0 && (
            <span className="text-primary-600 font-semibold tabular-nums">
              {formatPrice(fav.latestPrice)}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(fav.aptName, fav.regionCode);
            }}
            className="w-4 h-4 flex items-center justify-center rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}
