import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  Bell, Eye, EyeOff, CreditCard, QrCode, Star, MessageCircle,
  ArrowRightLeft, Wallet, LayoutGrid, Store, CalendarClock,
  ChevronLeft, ChevronRight, Home as HomeIcon, Clock, Link2
} from 'lucide-react';
import { defaultAccount } from '../data/accounts';
import { getBalance } from '../lib/balanceStore';
import abaLoanBanner from '../assets/aba-loan-banner.jpg';
import abaBalanceDots from '../assets/aba-balance-dots.png';

/* ─── Grey/white cartoon cat avatar (Tom style) ─────────────────────────────── */
const TomCatAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <rect width="100" height="100" fill="#F2E8D8" />
    <polygon points="26,40 18,12 48,32" fill="#8CA6BC" />
    <polygon points="74,40 82,12 52,32" fill="#8CA6BC" />
    <polygon points="28,37 23,17 44,31" fill="#E8A0B0" />
    <polygon points="72,37 77,17 56,31" fill="#E8A0B0" />
    <ellipse cx="50" cy="58" rx="33" ry="31" fill="#8CA6BC" />
    <ellipse cx="50" cy="70" rx="24" ry="18" fill="#F5F1E8" />
    <path d="M20,52 Q50,38 80,52 L80,44 Q50,30 20,44 Z" fill="#7A94AC" opacity="0.6" />
    <ellipse cx="41" cy="52" rx="7.5" ry="10" fill="#FFFDF2" />
    <ellipse cx="59" cy="52" rx="7.5" ry="10" fill="#FFFDF2" />
    <circle cx="42.5" cy="55" r="3.6" fill="#1A1A1A" />
    <circle cx="57.5" cy="55" r="3.6" fill="#1A1A1A" />
    <circle cx="43.5" cy="53.5" r="1.2" fill="white" />
    <circle cx="58.5" cy="53.5" r="1.2" fill="white" />
    <ellipse cx="50" cy="65" rx="4" ry="3" fill="#C84A4A" />
    <path d="M44 71 Q50 76 56 71" fill="none" stroke="#8A6A5A" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="38" cy="70" r="0.9" fill="#8A6A5A" />
    <circle cx="34" cy="73" r="0.9" fill="#8A6A5A" />
    <circle cx="62" cy="70" r="0.9" fill="#8A6A5A" />
    <circle cx="66" cy="73" r="0.9" fill="#8A6A5A" />
    <line x1="14" y1="64" x2="32" y2="68" stroke="#6A5A4A" strokeWidth="1.1" opacity="0.7" />
    <line x1="14" y1="72" x2="32" y2="72" stroke="#6A5A4A" strokeWidth="1.1" opacity="0.7" />
    <line x1="68" y1="68" x2="86" y2="64" stroke="#6A5A4A" strokeWidth="1.1" opacity="0.7" />
    <line x1="68" y1="72" x2="86" y2="72" stroke="#6A5A4A" strokeWidth="1.1" opacity="0.7" />
    <path d="M20,62 L14,60 M20,68 L13,68" stroke="#8CA6BC" strokeWidth="3" strokeLinecap="round" />
    <path d="M80,62 L86,60 M80,68 L87,68" stroke="#8CA6BC" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ─── Greeting ──────────────────────────────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'ទិវាសួស្តី!';
  if (h < 17) return 'សួស្តី!';
  return 'រាត្រីសួស្តី!';
};

/* ─── Top Header (light theme) ──────────────────────────────────────────────── */
const TopHeader = () => {
  const [, setLocation] = useLocation();
  return (
    <div className="px-4 pt-12 pb-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation('/settings')}
          className="w-[46px] h-[46px] rounded-full overflow-hidden border-[2px] border-white shadow-md shrink-0 active:scale-95 transition-transform"
          aria-label="Settings"
        >
          <TomCatAvatar />
        </button>
        <div>
          <p className="text-[13px] text-gray-500 font-bold leading-none mb-1">{getGreeting()}</p>
          <p className="text-[20px] font-extrabold text-gray-900 leading-none tracking-tight">Yukheang</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setLocation('/chat')}
          className="text-gray-700 hover:opacity-70 transition-opacity"
          aria-label="Messages"
        >
          <MessageCircle className="w-[24px] h-[24px]" strokeWidth={2} />
        </button>
        <button
          onClick={() => setLocation('/notifications')}
          className="relative text-gray-700 hover:opacity-70 transition-opacity"
          aria-label="Notifications"
        >
          <Bell className="w-[24px] h-[24px]" strokeWidth={2} />
          <span className="absolute -top-0.5 -right-0.5 w-[9px] h-[9px] bg-[#E8002D] rounded-full border-2 border-[#F3F2F7]" />
        </button>
        <button className="text-gray-700 hover:opacity-70 transition-opacity" aria-label="Cards">
          <CreditCard className="w-[24px] h-[24px]" strokeWidth={2} />
        </button>
        <button
          onClick={() => setLocation('/receive')}
          className="w-[36px] h-[36px] rounded-[10px] bg-[#E8002D] flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
          aria-label="ABA Pay QR"
        >
          <QrCode className="w-[20px] h-[20px] text-white" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
};

/* ─── Dotted Action Icon (from ABA official design) ─────────────────────────── */
const DottedActionIcon = ({ kind }: { kind: 'receive' | 'send' | 'chart' }) => {
  const dots = [];
  for (let row = 0; row < 11; row += 1) {
    for (let col = 0; col < 11; col += 1) {
      const x = 18 + (col - 5) * 2.65;
      const y = 18 + (row - 5) * 2.65;
      if ((x - 18) ** 2 + (y - 18) ** 2 <= 17 ** 2) {
        dots.push(<circle key={`${col}-${row}`} cx={x} cy={y} r="1.05" />);
      }
    }
  }
  return (
    <svg className="w-[30px] h-[30px]" viewBox="0 0 36 36" aria-hidden="true">
      <g fill="white">{dots}</g>
      {kind === 'receive' && (
        <path d="M11 23.5 22.7 11l2.8 2.6-11.8 12.2H11zM12.4 25.8l1.2-3.1 2.2 2.1z" fill="white" />
      )}
      {kind === 'send' && (
        <path d="m11 24 13.5-12.5m-6.4.4 6.6-.6-.7 6.5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {kind === 'chart' && (
        <g fill="white">
          <rect x="10.5" y="19" width="3" height="7" rx=".5" />
          <rect x="16.5" y="14" width="3" height="12" rx=".5" />
          <rect x="22.5" y="10" width="3" height="16" rx=".5" />
        </g>
      )}
    </svg>
  );
};

/* ─── Dot Matrix Amount (5x7 pixel font) ────────────────────────────────────── */
const amountGlyphs: Record<string, string[]> = {
  '$': ['00100', '01110', '10100', '01110', '00101', '11110', '00100'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00100', '00100'],
  ',': ['00000', '00000', '00000', '00000', '00000', '00100', '01000'],
};

const DotMatrixAmount = ({ amount }: { amount: string }) => {
  const dotSpacing = 4.2;
  const characterGap = 4;
  let cursor = 0;
  const dots: Array<{ x: number; y: number }> = [];

  for (const character of amount) {
    const rows = amountGlyphs[character];
    if (!rows) continue;
    rows.forEach((row, rowIndex) => {
      [...row].forEach((pixel, columnIndex) => {
        if (pixel === '1') {
          dots.push({
            x: cursor + columnIndex * dotSpacing + dotSpacing / 2,
            y: 5 + rowIndex * dotSpacing + dotSpacing / 2,
          });
        }
      });
    });
    cursor += rows[0].length * dotSpacing + characterGap;
  }

  const width = cursor - characterGap;
  return (
    <svg
      className="h-[32px] w-auto max-w-full"
      viewBox={`0 0 ${width} 40`}
      role="img"
      aria-label={amount}
      preserveAspectRatio="xMinYMid meet"
    >
      <g fill="white">
        {dots.map((dot, index) => (
          <circle key={index} cx={dot.x} cy={dot.y} r="1.6" />
        ))}
      </g>
    </svg>
  );
};

/* ─── Wordmark Dot Pattern (shown when balance is hidden) ───────────────────── */
const logoRows = [
  '111001111001111001111',
  '100101001001001001001',
  '111001111001111001111',
  '001001001001001001001',
  '111001111001111001111',
  '100001001001001001001',
  '111001111001111001111',
];

const WordmarkDots = () => {
  const dotSpacing = 3.2;
  const dots: Array<{ x: number; y: number }> = [];
  logoRows.forEach((row, rowIndex) => {
    [...row].forEach((pixel, colIndex) => {
      if (pixel === '1') {
        dots.push({
          x: colIndex * dotSpacing + dotSpacing / 2,
          y: rowIndex * dotSpacing + dotSpacing / 2,
        });
      }
    });
  });
  const width = logoRows[0].length * dotSpacing;
  const height = logoRows.length * dotSpacing;
  return (
    <svg className="h-[28px] w-auto" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <g fill="white">
        {dots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r="1.3" />
        ))}
      </g>
    </svg>
  );
};

/* ─── Eye Icons (ABA official style) ────────────────────────────────────────── */
const EyeIconABA = () => (
  <svg viewBox="0 0 28 24" className="w-[28px] h-[22px]" aria-hidden="true">
    <path d="M2.2 12s4.2-7.4 11.8-7.4S25.8 12 25.8 12s-4.2 7.4-11.8 7.4S2.2 12 2.2 12Z" fill="none" stroke="white" strokeWidth="2.8" strokeLinejoin="round" />
    <circle cx="14" cy="12" r="3.2" fill="none" stroke="white" strokeWidth="2.6" />
  </svg>
);

const EyeOffIconABA = () => (
  <svg viewBox="0 0 28 24" className="w-[28px] h-[22px]" aria-hidden="true">
    <path d="M2.2 12s4.2-7.4 11.8-7.4S25.8 12 25.8 12s-4.2 7.4-11.8 7.4S2.2 12 2.2 12Z" fill="none" stroke="white" strokeWidth="2.8" strokeLinejoin="round" />
    <circle cx="14" cy="12" r="3.2" fill="none" stroke="white" strokeWidth="2.6" />
    <path d="m4 2 20 20" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ─── Red main-account card (គណនីគោល) ─────────────────────────────────────── */
const AccountCard = ({ show, setShow, onReceiveClick, onSendClick }: { show: boolean; setShow: (v: boolean) => void; onReceiveClick: () => void; onSendClick: () => void }) => {
  const [, setLocation] = useLocation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative"
    >
      <div className="rounded-[22px] overflow-hidden relative bg-[#E8002D] shadow-[0_6px_20px_rgba(232,0,45,0.25)]">
        {/* Balance + eye row */}
        <div className="px-5 pt-5 pb-1 relative flex items-center gap-3">
          {show ? (
            <DotMatrixAmount amount={`$${getBalance(defaultAccount.id, defaultAccount.balance)}`} />
          ) : (
            <WordmarkDots />
          )}
          <button
            onClick={() => setShow(!show)}
            className="w-[44px] h-[40px] rounded-[14px] bg-white/17 flex items-center justify-center hover:bg-white/25 transition-colors active:scale-95"
            aria-label={show ? 'លាក់ចំនួនទឹកប្រាក់' : 'បង្ហាញចំនួនទឹកប្រាក់'}
          >
            {show ? <EyeOffIconABA /> : <EyeIconABA />}
          </button>
        </div>

        {/* Account label */}
        <div className="px-5 pb-3 relative flex items-center gap-2">
          <span className="text-[11px] font-bold bg-white text-gray-900 px-2 py-0.5 rounded">គណនីគោល</span>
          <span className="text-[14px] font-bold text-white">{defaultAccount.name}</span>
        </div>

        {/* Actions row */}
        <div className="flex items-center relative border-t border-white/20">
          {[
            { label: 'ទទួលលុយ', action: onReceiveClick, kind: 'receive' as const },
            { label: 'ផ្ញើលុយ', action: onSendClick, kind: 'send' as const },
            { label: 'វិភាគ', action: null, kind: 'chart' as const },
          ].map((btn, i) => (
            <React.Fragment key={btn.label}>
              <button
                onClick={() => btn.action && btn.action()}
                className="flex-1 py-3.5 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-95"
              >
                <DottedActionIcon kind={btn.kind} />
                <span className="text-[12.5px] font-bold text-white">{btn.label}</span>
              </button>
              {i === 1 && <div className="w-[1px] h-6 bg-white/25" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Feature icons (line style, matches ABA official) ──────────────────────── */
const IconFolder = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#374151" strokeWidth="1.8">
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="8" r="2" fill="#E8002D" stroke="none" />
  </svg>
);

const IconCard = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#374151" strokeWidth="1.8">
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="7" y1="15" x2="11" y2="15" strokeLinecap="round" />
  </svg>
);

const IconDollar = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#374151" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.8 2.5 2 2.5.8 2.5 2-1 2-2.5 2-2-.5-2.5-1.5M12 6v2M12 16v2" strokeLinecap="round" />
  </svg>
);

const IconScan = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#374151" strokeWidth="1.8">
    <path d="M4 7V5a1 1 0 011-1h2M17 4h2a1 1 0 011 1v2M20 17v2a1 1 0 01-1 1h-2M7 20H5a1 1 0 01-1-1v-2" strokeLinecap="round" />
    <line x1="4" y1="12" x2="20" y2="12" stroke="#E8002D" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconStar = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#374151" strokeWidth="1.8">
    <path d="M12 3l2.5 5.5 6 .5-4.5 4 1.5 6L12 16l-5.5 3 1.5-6-4.5-4 6-.5L12 3z" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2.5" fill="#E8002D" stroke="none" />
  </svg>
);

const IconTransfer = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#374151" strokeWidth="1.8">
    <path d="M7 7h13M7 7l4-4M7 7l4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 17H4M17 17l-4-4M17 17l-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─── 3×2 Feature Grid (light theme, line icons) ────────────────────────────── */
const FeatureGrid = () => {
  const [, setLocation] = useLocation();
  const items = [
    { label: 'គណនី', icon: <IconFolder />, route: '/accounts' },
    { label: 'កាត', icon: <IconCard />, route: '/cards' },
    { label: 'ទូទាត់', icon: <IconDollar />, route: '/payments' },
    { label: 'ABA ស្កែន', icon: <IconScan />, route: '/scan' },
    { label: 'គំរូទូទាត់ប្រចាំ', icon: <IconStar />, route: null },
    { label: 'ផ្ទេរប្រាក់', icon: <IconTransfer />, route: '/international' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item, i) => (
        <motion.button
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + i * 0.03 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => item.route && setLocation(item.route)}
          className="bg-white rounded-[18px] py-4 px-2 flex flex-col items-center justify-center gap-2 shadow-[0_1px_6px_rgba(0,0,0,0.05)] active:bg-gray-50"
        >
          {item.icon}
          <span className="text-[11px] font-bold text-gray-700 leading-tight text-center">{item.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

/* ─── Horizontal scroll pills (មីនីអេប / អាជីវករ ABA / ការទូទាត់ស្វ័យ) ─────── */
const ScrollPills = () => {
  const [, setLocation] = useLocation();
  const pills = [
    { label: 'មីនីអេប', icon: <LayoutGrid className="w-5 h-5 text-gray-600" strokeWidth={1.8} />, route: null },
    { label: 'អាជីវករ ABA', icon: <Store className="w-5 h-5 text-gray-600" strokeWidth={1.8} />, route: null },
    { label: 'ការទូទាត់ស្វ័យប្រវត្តិ', icon: <CalendarClock className="w-5 h-5 text-gray-600" strokeWidth={1.8} />, route: null },
  ];
  return (
    <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-1 -mx-1 px-1">
      {pills.map((p) => (
        <motion.button
          key={p.label}
          whileTap={{ scale: 0.96 }}
          onClick={() => p.route && setLocation(p.route)}
          className="shrink-0 flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]"
        >
          {p.icon}
          <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap">{p.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

/* ─── News & Promotion Banner (real ABA loan image) ─────────────────────────── */
const NewsBanner = () => (
  <div className="relative h-[140px] rounded-2xl overflow-hidden shadow-md">
    <img
      src={abaLoanBanner}
      alt="ABA Loan Promotion 6.5%"
      className="w-full h-full object-cover"
    />
    {/* Dots indicator */}
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
      {[0, 1, 2].map(i => (
        <span key={i} className={`h-1 rounded-full ${i === 0 ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
      ))}
    </div>
  </div>
);

/* ─── Mini App custom SVG icons ─────────────────────────────────────────────── */
const MetfoneIcon = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="14" fill="#E8002D" />
    <text x="28" y="28" textAnchor="middle" fill="white" fontSize="11" fontWeight="800" fontFamily="Arial">metfone</text>
    <text x="28" y="38" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="500" fontFamily="Arial" opacity="0.85">infinity closer</text>
  </svg>
);

const MovieIcon = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <defs>
      <linearGradient id="movieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7B2FF0" />
        <stop offset="50%" stopColor="#E040A0" />
        <stop offset="100%" stopColor="#F5A623" />
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#movieGrad)" />
    {/* clapperboard */}
    <rect x="14" y="16" width="28" height="8" rx="1.5" fill="#2A2A2A" />
    <rect x="14" y="22" width="28" height="14" rx="1.5" fill="#3A3A3A" />
    <polygon points="14,16 18,12 22,16" fill="#2A2A2A" />
    <polygon points="22,16 26,12 30,16" fill="#2A2A2A" />
    <polygon points="30,16 34,12 38,16" fill="#2A2A2A" />
    <polygon points="38,16 42,12 42,16" fill="#2A2A2A" />
    {/* play button */}
    <circle cx="28" cy="36" r="8" fill="#FF6B35" />
    <polygon points="25,31 25,41 34,36" fill="white" />
  </svg>
);

const Smart5GIcon = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="14" fill="#00A651" />
    {/* Smart logo triangle */}
    <polygon points="13,14 17,10 21,14 17,18" fill="#ED1C24" />
    <polygon points="17,10 21,14 17,18" fill="#FAA61A" />
    <polygon points="17,10 21,14 17,14" fill="#00A651" />
    <text x="30" y="18" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial">Smart</text>
    <text x="28" y="42" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="Arial">5G</text>
  </svg>
);

const VETIcon = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="14" fill="#F28C28" />
    {/* temple/building */}
    <rect x="12" y="38" width="32" height="4" rx="1" fill="white" />
    <rect x="14" y="34" width="28" height="4" fill="white" />
    {/* pillars */}
    <rect x="17" y="22" width="4" height="12" fill="white" />
    <rect x="24" y="22" width="4" height="12" fill="white" />
    <rect x="31" y="22" width="4" height="12" fill="white" />
    {/* roof */}
    <polygon points="13,22 28,13 43,22" fill="white" />
    {/* VET text */}
    <text x="28" y="31" textAnchor="middle" fill="#F28C28" fontSize="7" fontWeight="900" fontFamily="Arial">VET</text>
  </svg>
);

const Cambo21Icon = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="14" fill="white" stroke="#E0E0E0" strokeWidth="1" />
    {/* bottom waves */}
    <path d="M0,44 Q14,38 28,44 T56,44 L56,56 L0,56 Z" fill="#2E75B6" />
    <path d="M0,46 Q14,42 28,46 T56,46 L56,56 L0,56 Z" fill="#4CAF50" opacity="0.8" />
    {/* truck */}
    <rect x="18" y="22" width="16" height="10" rx="1" fill="#2E75B6" />
    <rect x="34" y="25" width="6" height="7" rx="1" fill="#2E75B6" />
    <circle cx="23" cy="34" r="2.5" fill="#333" />
    <circle cx="37" cy="34" r="2.5" fill="#333" />
    {/* text */}
    <text x="28" y="18" textAnchor="middle" fill="#2E75B6" fontSize="7" fontWeight="900" fontFamily="Arial">CAMBO 21</text>
    <text x="28" y="40" textAnchor="middle" fill="#333" fontSize="4.5" fontWeight="600" fontFamily="Arial">EXPRESS CO., LTD</text>
  </svg>
);

const BusIcon = () => (
  <svg viewBox="0 0 56 56" className="w-full h-full">
    <rect width="56" height="56" rx="14" fill="white" stroke="#E0E0E0" strokeWidth="1" />
    {/* map pin with colors */}
    <path d="M28,12 C20,12 15,18 15,25 C15,33 28,44 28,44 C28,44 41,33 41,25 C41,18 36,12 28,12 Z" fill="#E8002D" />
    <path d="M28,16 C22,16 18,20 18,25 C18,30 28,38 28,38 C28,38 38,30 38,25 C38,20 34,16 28,16 Z" fill="white" />
    {/* bus icon inside pin */}
    <rect x="23" y="22" width="10" height="8" rx="1.5" fill="#E8002D" />
    <rect x="24.5" y="23.5" width="3" height="2.5" rx="0.5" fill="#87CEEB" />
    <rect x="28.5" y="23.5" width="3" height="2.5" rx="0.5" fill="#87CEEB" />
    <circle cx="25.5" cy="31" r="1.2" fill="#333" />
    <circle cx="30.5" cy="31" r="1.2" fill="#333" />
    {/* map blocks */}
    <rect x="10" y="40" width="10" height="8" rx="1" fill="#4CAF50" opacity="0.7" />
    <rect x="22" y="42" width="8" height="6" rx="1" fill="#FFC107" opacity="0.7" />
    <rect x="32" y="40" width="12" height="8" rx="1" fill="#2196F3" opacity="0.6" />
  </svg>
);

/* ─── Mini Apps (មីនីអេប) ──────────────────────────────────────────────────── */
const miniApps = [
  { name: 'សេវាកម្មមិត្តហ្វូន', icon: <MetfoneIcon /> },
  { name: 'សំបុត្រកុន', icon: <MovieIcon /> },
  { name: 'ស្មាត អាស្យាកា', icon: <Smart5GIcon /> },
  { name: 'វីអ៊ីធី អេ ចប្រេស', icon: <VETIcon /> },
  { name: 'ខេមបូ-លីង 21 អិចប្រេស', icon: <Cambo21Icon /> },
  { name: 'ប៊ុកមីបាស', icon: <BusIcon /> },
];

const MiniAppsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-2.5">
      <h3 className="text-[15px] font-extrabold text-gray-900">មីនីអេប</h3>
      <div className="relative bg-white rounded-2xl px-3 py-4 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
        <div ref={scrollRef} className="flex overflow-x-auto hide-scrollbar gap-5 px-2">
          {miniApps.map(app => (
            <div key={app.name} className="flex flex-col items-center gap-1.5 shrink-0">
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="w-[56px] h-[56px] rounded-2xl overflow-hidden shadow-sm cursor-pointer"
              >
                {app.icon}
              </motion.div>
              <span className="text-[10px] font-bold text-gray-600 text-center leading-tight max-w-[64px]">
                {app.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Receive Options Bottom Sheet ──────────────────────────────────────────── */
const ReceiveOptionsSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [, setLocation] = useLocation();

  const options = [
    {
      title: 'ពីគណនី ABA របស់ខ្ញុំ',
      subtitle: 'ផ្ទេរប្រាក់ពីគណនីផ្ទាល់ខ្លួនរបស់អ្នក',
      icon: <Wallet className="w-5 h-5 text-gray-600" strokeWidth={1.8} />,
      action: () => { sessionStorage.setItem('aba.tf.mode', 'internal'); setLocation('/transfer'); onClose(); },
    },
    {
      title: 'ពីគណនីរបស់ខ្ញុំនៅក្នុងធនាគារផ្សេងទៀត',
      subtitle: 'ទទួលប្រាក់ពីគណនីរបស់ខ្ញុំនៅក្នុងធនាគារផ្សេងទៀត',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#4B5563" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.8 2.5 2 2.5.8 2.5 2-1 2-2.5 2-2-.5-2.5-1.5M12 6v2M12 16v2" strokeLinecap="round" />
        </svg>
      ),
      action: () => { sessionStorage.setItem('aba.tf.mode', 'cross'); setLocation('/transfer'); onClose(); },
    },
    {
      title: 'តាម ABA QR',
      subtitle: 'ទទួលលុយភ្លាមៗដោយបង្ហាញ ABA QR របស់អ្នក',
      icon: <QrCode className="w-5 h-5 text-gray-600" strokeWidth={1.8} />,
      action: () => { setLocation('/receive'); onClose(); },
    },
    {
      title: 'តាមរយៈការផ្ញើ ABA QR',
      subtitle: 'ស្នើសុំការទូទាត់ពីអ្នកដទៃ ដោយចែករំលែក ABA QR ឬតំណបង់ប្រាក់',
      icon: <Link2 className="w-5 h-5 text-gray-600" strokeWidth={1.8} />,
      action: () => { setLocation('/receive'); onClose(); },
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-50 pb-8 shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Title */}
            <div className="px-5 pb-2">
              <h3 className="text-[18px] font-extrabold text-gray-900">ទទួលលុយ:</h3>
            </div>

            {/* Options */}
            <div className="px-3">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={opt.action}
                  className="w-full flex items-start gap-3.5 px-3 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    {opt.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-gray-900 leading-tight">{opt.title}</p>
                    <p className="text-[12px] text-gray-500 leading-snug mt-0.5">{opt.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ─── Send Options Bottom Sheet ─────────────────────────────────────────────── */
const SendOptionsSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [, setLocation] = useLocation();

  const options = [
    {
      title: 'ទៅគំរូទូទាត់ប្រចាំ',
      subtitle: 'ផ្ញើលុយទៅមិត្តភក្តិគំរូទូទាត់ប្រចាំ',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#4B5563" strokeWidth="1.8">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      action: () => { sessionStorage.setItem('aba.tf.mode', 'internal'); setLocation('/transfer'); onClose(); },
    },
    {
      title: 'ទៅគណនី ABA ណាមួយ',
      subtitle: 'ផ្ញើលុយទៅកាន់គណនី ABA របស់អ្នកដទៃ',
      icon: <ArrowRightLeft className="w-5 h-5 text-gray-600" strokeWidth={1.8} />,
      action: () => { sessionStorage.setItem('aba.tf.mode', 'internal'); setLocation('/transfer'); onClose(); },
    },
    {
      title: 'ជាកាដូ',
      subtitle: 'ផ្តល់ភាពរំភើបរីករាយ ដល់មនុស្សពិសេស គ្រួសារ មិត្តភក្តិ ជាមួយម៉ូតរចនាកាតដែលពួកគេស្រឡាញ់ពេញចិត្ត',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#4B5563" strokeWidth="1.8">
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      action: () => { sessionStorage.setItem('aba.tf.gift', '1'); sessionStorage.setItem('aba.tf.mode', 'internal'); setLocation('/transfer'); onClose(); },
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-50 pb-8 shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Title */}
            <div className="px-5 pb-2">
              <h3 className="text-[18px] font-extrabold text-gray-900">ផ្ញើលុយចេញ:</h3>
            </div>

            {/* Options */}
            <div className="px-3">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={opt.action}
                  className="w-full flex items-start gap-3.5 px-3 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    {opt.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-gray-900 leading-tight">{opt.title}</p>
                    <p className="text-[12px] text-gray-500 leading-snug mt-0.5">{opt.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ─── Discover Section (ការស្វែងរកថ្មីៗ) ───────────────────────────────────── */
const DiscoverSection = () => {
  const cards = [
    {
      title: 'កំណត់ផ្សេងៗ\nកាន់តែស្រួល',
      gradient: 'linear-gradient(135deg, #4A148C 0%, #7B1FA2 50%, #9C27B0 100%)',
      icon: (
        <svg viewBox="0 0 80 80" className="w-16 h-16">
          <circle cx="40" cy="40" r="28" fill="#E0E0E0" />
          <circle cx="40" cy="40" r="20" fill="#BDBDBD" />
          <circle cx="40" cy="40" r="10" fill="#4FC3F7" />
          <circle cx="40" cy="40" r="5" fill="#0288D1" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 40 + Math.cos(rad) * 24;
            const y1 = 40 + Math.sin(rad) * 24;
            const x2 = 40 + Math.cos(rad) * 32;
            const y2 = 40 + Math.sin(rad) * 32;
            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E0E0E0" strokeWidth="6" strokeLinecap="round" />;
          })}
        </svg>
      ),
    },
    {
      title: 'ផ្ទៃដង/ផ្ទៃភ្លឺ',
      gradient: 'linear-gradient(135deg, #0D1B2A 0%, #1B263B 50%, #415A77 100%)',
      icon: (
        <svg viewBox="0 0 80 80" className="w-16 h-16">
          <rect x="18" y="10" width="44" height="60" rx="6" fill="#E3F2FD" />
          <rect x="22" y="14" width="36" height="40" rx="2" fill="#1565C0" />
          <rect x="26" y="18" width="12" height="4" rx="1" fill="#90CAF9" />
          <rect x="26" y="26" width="28" height="3" rx="1" fill="#64B5F6" />
          <rect x="26" y="32" width="20" height="3" rx="1" fill="#64B5F6" />
          <rect x="26" y="42" width="10" height="8" rx="2" fill="#E8002D" />
          <rect x="40" y="42" width="10" height="8" rx="2" fill="#43A047" />
          <circle cx="40" cy="62" r="4" fill="#90A4AE" />
        </svg>
      ),
    },
    {
      title: 'ទំហំអក្សរអាច\nផ្លាស់ប្តូរបាន',
      gradient: 'linear-gradient(135deg, #4A148C 0%, #6A1B9A 50%, #8E24AA 100%)',
      icon: (
        <svg viewBox="0 0 80 80" className="w-16 h-16">
          <text x="40" y="55" textAnchor="middle" fontSize="42" fontWeight="900" fill="#E1BEE7" fontFamily="sans-serif">កក</text>
          <text x="55" y="30" textAnchor="middle" fontSize="20" fontWeight="700" fill="#CE93D8" fontFamily="sans-serif">A</text>
        </svg>
      ),
    },
    {
      title: 'រៀបចំ តាមលំដាប់\nដែលអ្នកត្រូវការ',
      gradient: 'linear-gradient(135deg, #01579B 0%, #0277BD 50%, #039BE5 100%)',
      icon: (
        <svg viewBox="0 0 80 80" className="w-16 h-16">
          <rect x="10" y="15" width="60" height="50" rx="8" fill="#E3F2FD" />
          <rect x="14" y="19" width="52" height="12" rx="3" fill="#BBDEFB" />
          <rect x="18" y="36" width="18" height="18" rx="4" fill="#E8002D" />
          <rect x="40" y="36" width="18" height="18" rx="4" fill="#43A047" />
          <circle cx="27" cy="45" r="5" fill="white" />
          <circle cx="49" cy="45" r="5" fill="white" />
          <path d="M55 25 Q65 35 55 45" stroke="#E8002D" strokeWidth="2.5" fill="none" strokeDasharray="3,2" />
          <path d="M25 55 Q15 45 25 35" stroke="#43A047" strokeWidth="2.5" fill="none" strokeDasharray="3,2" />
        </svg>
      ),
    },
    {
      title: 'អូសផ្ទាំងវិចិត្រ\nចុះឡើងតាមចិត្ត',
      gradient: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)',
      icon: (
        <svg viewBox="0 0 80 80" className="w-16 h-16">
          <rect x="20" y="8" width="40" height="64" rx="6" fill="#BBDEFB" />
          <rect x="24" y="12" width="32" height="30" rx="3" fill="#1565C0" />
          <rect x="28" y="46" width="12" height="10" rx="2" fill="#E8002D" />
          <rect x="44" y="46" width="8" height="10" rx="2" fill="#43A047" />
          <path d="M15 35 Q5 40 15 45" stroke="#E8002D" strokeWidth="2.5" fill="none" />
          <path d="M65 45 Q75 40 65 35" stroke="#43A047" strokeWidth="2.5" fill="none" />
          <polygon points="12,40 17,37 17,43" fill="#E8002D" />
          <polygon points="68,40 63,37 63,43" fill="#43A047" />
        </svg>
      ),
    },
    {
      title: 'ដាក់ ឬដកផ្ទាំង\nវិចិត្រ',
      gradient: 'linear-gradient(135deg, #01579B 0%, #0288D1 50%, #03A9F4 100%)',
      icon: (
        <svg viewBox="0 0 80 80" className="w-16 h-16">
          <rect x="18" y="12" width="44" height="56" rx="6" fill="#E3F2FD" />
          <rect x="22" y="16" width="36" height="28" rx="3" fill="#1565C0" />
          <circle cx="40" cy="52" r="10" fill="#4CAF50" />
          <line x1="40" y1="47" x2="40" y2="57" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <line x1="35" y1="52" x2="45" y2="52" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <rect x="26" y="66" width="28" height="4" rx="2" fill="#90CAF9" />
        </svg>
      ),
    },
    {
      title: 'ជម្រើសផ្ទៃ\nអេក្រង់',
      gradient: 'linear-gradient(135deg, #0D1B2A 0%, #1B263B 50%, #3D5A80 100%)',
      icon: (
        <svg viewBox="0 0 80 80" className="w-16 h-16">
          <rect x="8" y="18" width="24" height="44" rx="4" fill="#FF6B6B" opacity="0.8" />
          <rect x="22" y="14" width="24" height="52" rx="4" fill="#4ECDC4" opacity="0.9" />
          <rect x="36" y="10" width="24" height="60" rx="4" fill="#FFE66D" opacity="0.85" />
          <rect x="50" y="16" width="22" height="48" rx="4" fill="#95E1D3" opacity="0.8" />
          <rect x="62" y="20" width="12" height="40" rx="3" fill="#A8E6CF" opacity="0.7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-[18px] font-extrabold text-gray-900">ការស្វែងរកថ្មីៗ</h3>
      <div className="flex overflow-x-auto hide-scrollbar gap-3 -mx-4 px-4 pb-2">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            whileTap={{ scale: 0.96 }}
            className="shrink-0 w-[145px] h-[190px] rounded-[20px] overflow-hidden relative border-[2.5px] border-white/80 shadow-lg"
            style={{ background: card.gradient }}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center pt-3">
                {card.icon}
              </div>
              <div className="px-3 pb-4 pt-1">
                <p className="text-white text-[13px] font-bold leading-tight whitespace-pre-line">{card.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-center pt-1">
        <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-7 py-3 rounded-full text-[14px] font-bold shadow-lg transition-colors active:scale-95">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M12 20h9" strokeLinecap="round" />
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          កែអេក្រង់ដើម
        </button>
      </div>
    </div>
  );
};

/* ─── Page (light theme) ────────────────────────────────────────────────────── */
export default function Home() {
  const [showBalance, setShowBalance] = useState(true);
  const [showReceiveSheet, setShowReceiveSheet] = useState(false);
  const [showSendSheet, setShowSendSheet] = useState(false);

  return (
    <div className="min-h-[100dvh] md:h-screen md:min-h-screen bg-gray-300 flex items-center justify-center md:p-4 font-sans select-none">
      <div className="w-full h-full md:max-w-[390px] md:h-[844px] bg-[#F3F2F7] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden md:border-[8px] border-black flex flex-col">

        <div className="relative flex-1 overflow-y-auto hide-scrollbar z-10 pb-28">
          <TopHeader />

          <div className="px-4 space-y-4 pb-6 pt-1">
            <AccountCard
              show={showBalance}
              setShow={setShowBalance}
              onReceiveClick={() => setShowReceiveSheet(true)}
              onSendClick={() => setShowSendSheet(true)}
            />
            <FeatureGrid />
            <ScrollPills />

            {/* News & Promotion */}
            <div className="space-y-2.5">
              <h3 className="text-[15px] font-extrabold text-gray-900">ដំណឹង & ប្រូម៉ូសិន</h3>
              <NewsBanner />
            </div>

            <MiniAppsSection />
            <DiscoverSection />
          </div>
        </div>

        <ReceiveOptionsSheet open={showReceiveSheet} onClose={() => setShowReceiveSheet(false)} />
        <SendOptionsSheet open={showSendSheet} onClose={() => setShowSendSheet(false)} />
      </div>
    </div>
  );
}
