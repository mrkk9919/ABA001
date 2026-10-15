import React from 'react';
import { BANK_MAP } from '@/lib/khqr';

/**
 * Bank brand logo chip: brand-colour tile with a short wordmark plus the
 * human-readable bank name. Unknown codes fall back to a neutral tile and the
 * raw code, so every real QR still gets a visible "bank" identity.
 */
const BankLogo = ({
  bankCode,
  bankName,
  size = 'md',
}: {
  bankCode?: string;
  bankName: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const info = bankCode
    ? (BANK_MAP[bankCode.toLowerCase()] ?? { color: '#374151', short: bankCode.slice(0, 6).toUpperCase() })
    : { color: '#374151', short: '?' };
  const tile =
    size === 'sm' ? 'w-6 h-6 rounded-md text-[9px]'
    : size === 'lg' ? 'w-10 h-10 rounded-xl text-[13px]'
    : 'w-7 h-7 rounded-lg text-[10px]';
  const wordmark = info.short === '?' ? '?' : info.short.slice(0, 4);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`${tile} flex items-center justify-center text-white font-black tracking-tight shrink-0`}
        style={{ backgroundColor: info.color }}
      >
        {wordmark}
      </span>
      <span className="text-[11px] font-bold text-gray-700 leading-none">{bankName}</span>
    </span>
  );
};

export default BankLogo;
