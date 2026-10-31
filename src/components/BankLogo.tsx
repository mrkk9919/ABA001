import React from 'react';
import { BANK_MAP } from '@/lib/khqr';

/* Real logo images (user-provided). Keys = lowercase bank code.
   If present, the real PNG is rendered instead of the SVG gradient tile. */
const REAL_LOGOS: Record<string, string> = {
  emny: 'bank-logos/emny.png',
};

/**
 * Bank brand logo chip — SVG gradient tile with the bank's wordmark.
 * Unknown codes fall back to a neutral tile and the raw code, so every
 * real Bakong QR still gets a visible bank identity. All Cambodia banks
 * (commercial + specialized + leading MFIs / e-wallets) are covered.
 */
const BankLogo = ({
  bankCode,
  bankName,
  size = 'md',
}: {
  bankCode?: string;
  bankName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const info = bankCode
    ? (BANK_MAP[bankCode.toLowerCase()] ?? { color: '#374151', short: bankCode.slice(0, 6).toUpperCase() })
    : { color: '#374151', short: '?' };

  const dim = size === 'sm' ? 24 : size === 'lg' ? 40 : size === 'xl' ? 72 : 28;
  const baseFont = size === 'sm' ? 8 : size === 'lg' ? 13 : size === 'xl' ? 20 : 10;
  const radius = size === 'sm' ? 6 : size === 'lg' ? 12 : size === 'xl' ? 18 : 8;
  // Use the full wordmark (capped at 6 chars) and shrink the font to fit,
  // so PIPAY / CANADIA / SATHAPANA never get mis-truncated to PIPA / CANA.
  const wordmark = info.short === '?' ? '?' : info.short.slice(0, 6);
  const fontSize = Math.min(baseFont, Math.max(6, Math.floor((dim * 0.82) / (wordmark.length * 0.62))));

  // Slightly darker shade for the gradient bottom.
  const darken = (hex: string, f = 0.72) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.round(((n >> 16) & 255) * f);
    const g = Math.round(((n >> 8) & 255) * f);
    const b = Math.round((n & 255) * f);
    return `rgb(${r},${g},${b})`;
  };
  const gid = `banklogo-${info.short}-${dim}`;

  // Real logo image (if available for this bank)
  const realLogo = bankCode ? REAL_LOGOS[bankCode.toLowerCase()] : undefined;
  if (realLogo) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <img
          src={`${import.meta.env.BASE_URL}${realLogo}`}
          alt={bankName}
          width={dim}
          height={dim}
          draggable={false}
          className="shrink-0 object-contain bg-white"
          style={{ borderRadius: radius, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))' }}
        />
        <span className="text-[11px] font-bold text-gray-700 leading-none">{bankName}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={info.color} />
            <stop offset="100%" stopColor={darken(info.color)} />
          </linearGradient>
        </defs>
        <rect width={dim} height={dim} rx={radius} fill={`url(#${gid})`} />
        <rect x="0.5" y="0.5" width={dim - 1} height={dim - 1} rx={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="white"
          fontSize={fontSize}
          fontWeight="900"
          letterSpacing="-0.3px"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {wordmark}
        </text>
      </svg>
      <span className="text-[11px] font-bold text-gray-700 leading-none">{bankName}</span>
    </span>
  );
};

export default BankLogo;
