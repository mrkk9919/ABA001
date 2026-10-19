import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreHorizontal, Wallet, ChevronDown, Plus } from 'lucide-react';
import { useLocation } from 'wouter';
import { accounts } from '../data/accounts';
import { getBalance } from '../lib/balanceStore';
import type { Account } from '../data/accounts';

/* ─── Blue gradient circular ring ──────────────────────────────────────────── */
const RingChart = () => {
  const r = 54;
  const cx = 72;
  const cy = 72;
  const circumference = 2 * Math.PI * r;
  // Main arc ~88% filled
  const filled = circumference * 0.88;
  const gap = circumference - filled;

  return (
    <svg width="144" height="144" viewBox="0 0 144 144">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A1A6E" />
          <stop offset="40%" stopColor="#1060CC" />
          <stop offset="75%" stopColor="#00AAFF" />
          <stop offset="100%" stopColor="#00E0FF" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#CC44EE" />
          <stop offset="100%" stopColor="#8833FF" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="13"
      />

      {/* Main filled arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="13"
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />

      {/* Purple accent streaks at top */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="url(#accentGrad)"
        strokeWidth="13"
        strokeDasharray={`${circumference * 0.06} ${circumference * 0.94}`}
        strokeDashoffset={circumference * 0.22}
        strokeLinecap="round"
        filter="url(#glow)"
        opacity="0.9"
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#EE55FF"
        strokeWidth="5"
        strokeDasharray={`${circumference * 0.03} ${circumference * 0.97}`}
        strokeDashoffset={circumference * 0.20}
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Inner white circle */}
      <circle cx={cx} cy={cy} r="40" fill="#FFFFFF" />

      {/* Center icon: card with transfer arrows */}
      <g transform="translate(58, 52)">
        {/* Outer card shape */}
        <rect x="0" y="3" width="20" height="14" rx="2.5" fill="none" stroke="#374151" strokeWidth="1.6" />
        {/* Card stripe */}
        <rect x="0" y="7" width="20" height="3" fill="#9CA3AF" opacity="0.5" />
        {/* Inner dot */}
        <circle cx="10" cy="10" r="3.5" fill="none" stroke="#374151" strokeWidth="1.4" />
        {/* Upward arrow */}
        <path d="M6 2 L10 -2 L14 2" fill="none" stroke="#00CCFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="10" y1="-2" x2="10" y2="2" stroke="#00CCFF" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Center Khmer label */}
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#374151" fontSize="7.5" fontWeight="700" fontFamily="sans-serif" opacity="0.9">
        គណនីទាំងអស់
      </text>
    </svg>
  );
};


/* ─── Card logos ──────────────────────────────────────────────────────────── */
const USFlagIcon = () => (
  <div className="w-[38px] h-[24px] rounded-sm overflow-hidden border border-gray-200/60 flex flex-col">
    {[0,1,2,3,4,5,6].map(i => (
      <div key={i} className="flex-1" style={{ backgroundColor: i % 2 === 0 ? '#B22234' : '#FFFFFF' }} />
    ))}
    <div className="absolute inset-0" style={{ width: '40%', height: '55%', backgroundColor: '#3C3B6E' }} />
  </div>
);

const FlagIcon = () => (
  <div className="relative w-[38px] h-[24px] rounded-sm overflow-hidden border border-gray-200/60">
    {/* US flag simplified */}
    <div className="absolute inset-0 flex flex-col">
      {[0,1,2,3,4,5,6].map(i => (
        <div key={i} className="flex-1" style={{ backgroundColor: i % 2 === 0 ? '#BF0A30' : '#FFFFFF' }} />
      ))}
    </div>
    {/* Blue canton */}
    <div className="absolute top-0 left-0 w-[45%] h-[55%] bg-[#002868] flex flex-wrap items-center justify-center p-[1px] gap-[1px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="w-[3px] h-[3px] bg-white/80 rounded-full" />
      ))}
    </div>
  </div>
);

const VisaLogo = () => (
  <svg width="46" height="15" viewBox="0 0 54 16">
    <text x="0" y="13" fontFamily="Arial, sans-serif" fontStyle="italic" fontWeight="bold" fontSize="16" fill="#1A1F71">VISA</text>
  </svg>
);

/* ─── Account Card ──────────────────────────────────────────────────────────── */
const AccountCard = ({
  account,
  index,
  onPress,
}: {
  account: Account;
  index: number;
  onPress: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, ease: 'easeOut' }}
    whileTap={{ scale: 0.985 }}
    onClick={onPress}
    className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.07)] overflow-hidden border border-gray-100/80 cursor-pointer"
  >
    <div className="flex">
      {/* Left color accent bar */}
      <div className="w-[5px] rounded-l-2xl shrink-0" style={{ backgroundColor: account.borderColor }} />

      <div className="flex-1 px-4 pt-3.5 pb-3">
        {/* Top row: name + badge + menu */}
        <div className="flex items-start justify-between mb-0.5">
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-gray-900 leading-tight">{account.name}</p>
            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
              <p className="text-[11px] text-gray-400 font-medium">
                {account.number} | {account.type}
              </p>
              {account.badge && (
                <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold ${account.badge.color}`}>
                  {account.badge.label}
                </span>
              )}
            </div>
          </div>
          <button className="text-gray-300 hover:text-gray-500 transition-colors p-1 -mr-1 ml-2 shrink-0">
            <MoreHorizontal className="w-[17px] h-[17px]" strokeWidth={2} />
          </button>
        </div>

        {/* Card logo row */}
        <div className="mt-2.5 mb-2 h-[24px] flex items-center gap-2">
          {(account.cardType === 'visa' || account.cardType === 'flag-visa') && <VisaLogo />}
        </div>

        {/* Balance */}
        {account.balance !== null && (
          <div className="flex justify-end items-baseline gap-1">
            <span className="text-[15.5px] font-extrabold text-gray-900">{getBalance(account.id, account.balance)}</span>
            <span className="text-[11px] font-bold text-gray-400">{account.currency}</span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function Accounts() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] md:h-screen md:min-h-screen bg-gray-200 flex items-center justify-center md:p-4 font-sans select-none">
      <div className="w-full h-full md:max-w-[390px] md:h-[844px] bg-white md:rounded-[2.5rem] shadow-2xl relative overflow-hidden md:border-[8px] border-black flex flex-col">

        {/* Background: subtle light gradient */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-gray-100" />
        </div>

        {/* ── Header ── */}
        <div className="relative z-20 px-5 pt-12 pb-2 flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="text-gray-800 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">
            ABA<span className="text-gray-900 text-2xl font-black">'</span>{' '}
            <span className="font-semibold">គណនី</span>
          </h1>
        </div>

        {/* ── Ring + Balance row ── */}
        <div className="relative z-10 px-5 pt-2 pb-1 flex items-center justify-between">
          {/* Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
          >
            <RingChart />
          </motion.div>

          {/* Balance info */}
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="text-right flex-1 ml-4"
          >
            <p className="text-[11px] text-gray-500 font-medium mb-1 tracking-wide">ទឹកប្រាក់ដែលមាន</p>
            <p className="text-[33px] font-extrabold text-gray-900 leading-none tracking-tight">
              ${accounts.filter((a) => a.currency === 'USD').reduce((sum, a) => sum + (Number(getBalance(a.id, a.balance)) || 0), 0).toFixed(2)}
            </p>
            <div className="w-full h-[1px] bg-gray-200 my-2" />
            <p className="text-[27px] font-extrabold text-gray-900 leading-none">
              <span className="text-[16px] align-top mt-[3px] inline-block font-bold text-gray-500 mr-[1px]">៛</span>
              {accounts.filter((a) => a.currency === 'KHR').reduce((sum, a) => sum + (Number(getBalance(a.id, a.balance)) || 0), 0).toLocaleString()}
            </p>
          </motion.div>
        </div>

        {/* ── Analytics label + chevron (matches ABA official screenshot) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 flex flex-col items-center justify-center mb-1"
        >
          <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 transition-colors px-4 py-1">
            <span className="text-[13px] font-semibold">មុខងារវិភាគ</span>
          </button>
          <ChevronDown className="w-4 h-4 text-gray-400 -mt-0.5" strokeWidth={2} />
        </motion.div>

        {/* ── White slide-up sheet ── */}
        <motion.div
          initial={{ y: 28 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex-1 bg-[#F3F2F7] rounded-t-[26px] overflow-y-auto z-20 mt-1 pb-24"
        >
          {/* Section header */}
          <div className="px-5 pt-5 pb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center">
              <Wallet className="w-4 h-4 text-gray-500" strokeWidth={2} />
            </div>
            <span className="text-[12px] font-extrabold text-gray-500 tracking-widest uppercase">គណនី</span>
          </div>

          {/* Account cards */}
          <div className="px-4 space-y-3">
            {accounts.map((acc, i) => (
              <AccountCard
                key={acc.id}
                account={acc}
                index={i}
                onPress={() => setLocation(`/accounts/${acc.id}`)}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Floating "+ គណនី" button ── */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 280 }}
          whileTap={{ scale: 0.93 }}
          className="absolute bottom-7 right-5 z-30 flex items-center gap-2 px-4 py-3 rounded-full shadow-xl"
          style={{ background: 'linear-gradient(135deg, #E8002D 0%, #FF3355 100%)' }}
          onClick={() => {}}
        >
          <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
          <span className="text-[13px] font-extrabold text-white tracking-wide">គណនី</span>
        </motion.button>
      </div>
    </div>
  );
}
