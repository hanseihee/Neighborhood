'use client';

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { REGIONS } from '@/lib/constants';

const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`;

const selectStyle = {
  backgroundImage: chevronSvg,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 12px center',
};

interface RegionSelectorProps {
  selectedRegion: string;
  onRegionChange: (code: string) => void;
}

export default function RegionSelector({
  selectedRegion,
  onRegionChange,
}: RegionSelectorProps) {
  const [sidoCode, setSidoCode] = useState(() => {
    if (selectedRegion && selectedRegion.length >= 2) {
      return selectedRegion.slice(0, 2);
    }
    return '11';
  });

  useEffect(() => {
    if (selectedRegion && selectedRegion.length >= 2) {
      const newSido = selectedRegion.slice(0, 2);
      if (newSido !== sidoCode) {
        setSidoCode(newSido);
      }
    }
  }, [selectedRegion]);

  const currentSido = REGIONS.find((r) => r.code === sidoCode);

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <div className="flex items-center text-primary-500">
        <MapPin size={16} strokeWidth={2} />
      </div>

      <select
        value={sidoCode}
        onChange={(e) => {
          setSidoCode(e.target.value);
          onRegionChange('');
        }}
        className="h-10 px-3.5 pr-8 bg-white border border-slate-200 rounded-lg text-[14px] font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 transition-all cursor-pointer"
        style={selectStyle}
      >
        {REGIONS.map((r) => (
          <option key={r.code} value={r.code}>
            {r.name}
          </option>
        ))}
      </select>

      <select
        value={selectedRegion}
        onChange={(e) => onRegionChange(e.target.value)}
        className="h-10 px-3.5 pr-8 bg-white border border-slate-200 rounded-lg text-[14px] font-medium text-slate-700 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 transition-all cursor-pointer"
        style={selectStyle}
      >
        <option value="">시/군/구 선택</option>
        {currentSido?.districts.map((d) => (
          <option key={d.code} value={d.code}>
            {d.name}
          </option>
        ))}
      </select>

      {selectedRegion && currentSido && (
        <span className="text-[13px] text-slate-400 ml-0.5">
          {currentSido.name}{' '}
          {currentSido.districts.find((d) => d.code === selectedRegion)?.name}
        </span>
      )}
    </div>
  );
}
