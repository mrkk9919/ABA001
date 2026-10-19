import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Landmark } from 'lucide-react';
import { BANK_MAP } from '@/lib/khqr';

/* All Cambodia banks — logo grid (brand colour tile + wordmark). */

const TemplePattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.05]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 420 420">
    <g fill="#2E6FD8">
      {[20, 230].map((x) => (
        <g key={x} transform={`translate(${x},40)`}>
          <rect x="36" y="90" width="40" height="60" />
          <rect x="16" y="110" width="80" height="40" />
          <rect x="0" y="130" width="112" height="20" />
          <path d="M56 0 L86 90 H26 Z" />
          <path d="M26 30 L46 90 H6 Z" />
          <path d="M86 30 L106 90 H66 Z" />
          <rect x="46" y="20" width="20" height="30" />
        </g>
      ))}
    </g>
  </svg>
);

export default function Banks() {
  const [, setLocation] = useLocation();

  // Deduplicate by short code, keep stable insertion order.
  const seen = new Set<string>();
  const banks = Object.entries(BANK_MAP).filter(([code, b]) => {
    if (seen.has(b.short)) return false;
    seen.add(b.short);
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-[#F5F5F7] font-sans flex flex-col overflow-y-auto">
      <TemplePattern />

      {/* Header */}
      <div className="relative px-4 pt-12 pb-3 flex items-center justify-between">
        <button onClick={() => setLocation('/transfer')} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-800">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-[17px] font-extrabold text-gray-900 tracking-tight">ធនាគារទាំងអស់</p>
          <p className="text-[11px] text-gray-500 font-medium">All Banks in Cambodia</p>
        </div>
        <div className="w-9" />
      </div>

      <div className="relative px-4 flex flex-col flex-1 pb-10">
        <div className="rounded-2xl bg-white shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#2E6FD8]/10 text-[#2E6FD8] flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" strokeWidth={2.1} />
          </span>
          <p className="text-[12px] text-gray-600 leading-relaxed">
            柬埔寨全部商业银行与电子钱包 ({banks.length}) · ABA · ACLEDA · Wing · Canadia · Sathapana · Vattanac · eMoney · TrueMoney 等
          </p>
        </div>

        {/* Logo grid */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {banks.map(([code, b]) => (
            <div key={code} className="rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-3 py-4 flex flex-col items-center gap-2 text-center">
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[10px] font-black tracking-tight shadow-sm"
                style={{ backgroundColor: b.color }}
              >
                {b.short.slice(0, 4)}
              </span>
              <span className="text-[10.5px] font-bold text-gray-800 leading-tight">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
