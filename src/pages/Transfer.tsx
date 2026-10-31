import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Check, Cloud, ChevronDown, Lock, Delete, Share2, RotateCcw, FileDown, History, MessageCircle, Star } from 'lucide-react';
import { useLocation } from 'wouter';
import { getPendingTransfer, clearPendingTransfer } from '@/lib/transferState';
import { parseKHQR, DEMO_KHQR, type KHQRData } from '@/lib/khqr';
import { addTxn } from '@/lib/txnStore';
import { deductBalance, getBalance } from '@/lib/balanceStore';
import { getTtsLang, speakTransferConfirm, speakTransferSuccessSmart } from '@/lib/tts';
import BankLogo from '@/components/BankLogo';
import { accounts, defaultAccount, type Account } from '../data/accounts';
import { checkBakongAccount, initiateBakongPayment, pollBakongPayment, type BakongPaymentResult } from '@/lib/bakongClient';
import {
  getPaywayStatus,
  initiatePaywayPayment,
  checkPaywayStatus,
  submitPayWayForm,
  type PayWayInitiateResult,
} from '@/lib/paywayClient';

/* Mock payment PIN for the demo (real flow verifies server-side). */
const MOCK_PAYMENT_PIN = '1234';

/* ── Demo payment mode ────────────────────────────────────────────────────────
   false  = settle transfers locally (full journey testable in the demo; the
            typed-account Bakong holder verification stays real).
   true   = submit through ABA PayWay / Bakong for real (needs a valid PayWay
            key — the current sandbox key expired 2026-04-04 — or the Bakong
            app-confirmation flow). */
const USE_REAL_PAYMENT = false;

/* ─── Built-in ABA account book: when the user types a recipient ABA account
   number, we resolve the recipient name (and currency) shown under the input.
   This mirrors the official form, where typing 017 429 221 reveals
   "PA SOKVEN | USD" below the account field. ───────────────────────────────── */
const ABA_ACCOUNTS: Record<string, { name: string; currency: 'USD' | 'KHR' }> = {
  '017429221':  { name: 'PA SOKVEN', currency: 'USD' },
  '0168886168': { name: 'SOEU YUKHEANG', currency: 'USD' },
  '088555222':  { name: 'ឡុង ស្រីពេជ្រ', currency: 'USD' },
  '088710222':  { name: 'YUKHEANG SOEU', currency: 'USD' },
  '600980842':  { name: 'qiang', currency: 'KHR' },
  '150614168':  { name: 'qiang', currency: 'USD' },
};

/* ─── Number pad ─────────────────────────────────────────────────────────────── */
const KEYS = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

const NumPad = ({ onKey }: { onKey: (k: string) => void }) => (
  <div className="grid grid-cols-3 gap-0">
    {KEYS.map(k => (
      <motion.button
        key={k}
        whileTap={{ scale: 0.88, backgroundColor: '#F0F0F0' }}
        onClick={() => onKey(k)}
        className="h-14 flex items-center justify-center text-[20px] font-semibold text-gray-900 rounded-xl transition-colors active:bg-gray-100"
      >
        {k === '⌫' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
            <line x1="18" y1="9" x2="13" y2="14"/><line x1="13" y1="9" x2="18" y2="14"/>
          </svg>
        ) : k}
      </motion.button>
    ))}
  </div>
);

/* ─── Payment PIN keypad (4 digits) ──────────────────────────────────────────── */
const PIN_KEYS = ['1','2','3','4','5','6','7','8','9'];

/* ─── Payment PIN keypad — ABA official style: white outlined circles ──────── */
const FaceIdIcon = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M6 12V8a2 2 0 0 1 2-2h4M26 12V8a2 2 0 0 0-2-2h-4M6 20v4a2 2 0 0 0 2 2h4M26 20v4a2 2 0 0 1-2 2h-4" />
    <circle cx="12.5" cy="15" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19.5" cy="15" r="1.4" fill="currentColor" stroke="none" />
    <path d="M13 20c1.2 1.2 2.6 1.8 3.5 1.8s2.3-.6 3.5-1.8" />
  </svg>
);

const PinKeypad = ({ onKey }: { onKey: (k: string) => void }) => {
  const KeyCircle = ({ label, onClick, ariaLabel }: { label: React.ReactNode; onClick: () => void; ariaLabel: string }) => (
    <motion.button
      whileTap={{ scale: 0.9, backgroundColor: 'rgba(255,255,255,0.18)' }}
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-[72px] h-[72px] rounded-full border-2 border-white/85 flex items-center justify-center text-white text-[30px] font-semibold transition-colors"
    >
      {label}
    </motion.button>
  );
  return (
    <div className="flex flex-col items-center gap-4 pb-12 px-6">
      <div className="grid grid-cols-3 gap-x-10 gap-y-4">
        {PIN_KEYS.map(d => (
          <KeyCircle key={d} label={d} onClick={() => onKey(d)} ariaLabel={`digit ${d}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-x-10 gap-y-4 items-center">
        <button onClick={() => onKey('face')} aria-label="Face ID" className="w-[72px] h-[72px] flex items-center justify-center text-white/80 justify-self-center">
          <FaceIdIcon />
        </button>
        <KeyCircle label="0" onClick={() => onKey('0')} ariaLabel="digit 0" />
        <button onClick={() => onKey('⌫')} aria-label="delete digit" className="w-[72px] h-[72px] flex items-center justify-center justify-self-center">
          <span className="bg-[#7DD3FC] rounded-2xl px-3.5 py-2.5 flex items-center justify-center">
            <Delete className="w-6 h-6 text-[#0C4A6E]" strokeWidth={2.4} />
          </span>
        </button>
      </div>
    </div>
  );
};

/* ─── Payment PIN verification overlay ───────────────────────────────────────── */
const PinScreen = ({ amount, currency, onPin, onCancel, status, error, shake }: {
  amount: string; currency: 'USD' | 'KHR';
  onPin: (pin: string) => void;
  onCancel: () => void;
  status: 'idle' | 'error' | 'success';
  error: string;
  shake: boolean;
}) => {
  const [pin, setPin] = useState('');
  useEffect(() => {
    // On a wrong PIN, clear the dots shortly after the error appears.
    if (status !== 'error') return;
    const t = setTimeout(() => setPin(''), 600);
    return () => clearTimeout(t);
  }, [status]);
  const handle = (k: string) => {
    if (status === 'error' || status === 'success') return;
    if (k === 'face') return; // Face ID placeholder — no-op
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) onPin(next);
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 flex flex-col bg-gradient-to-b from-[#0E2A3E] via-[#143A52] to-[#0A1E2C]"
    >
      {/* Header — cancel (បោះបង់) */}
      <div className="px-5 pt-12 pb-2 shrink-0">
        <button onClick={onCancel} className="text-white/90 text-[15px] font-semibold active:opacity-60" aria-label="បោះបង់">
          បោះបង់
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-8">
        {/* Lock icon in translucent circle + 4 dots */}
        <div className="w-[96px] h-[96px] rounded-full bg-white/10 backdrop-blur-sm border border-white/15 flex flex-col items-center justify-center mb-5 mt-3">
          <Lock className="w-7 h-7 text-white/90" strokeWidth={2} />
          <div className="flex gap-1 mt-1.5">
            {[0, 1, 2, 3].map(i => <span key={i} className="w-1 h-1 rounded-full bg-white/70" />)}
          </div>
        </div>

        <h2 className="text-white text-[17px] font-bold tracking-wide text-center leading-snug">
          បញ្ចូលលេខសម្ងាត់ ដើម្បីបើកចូល
        </h2>
        <p className="text-white/60 text-[13px] font-medium mt-1.5">
          {currency === 'KHR' ? Number(amount).toLocaleString() + ' ៛' : '$' + Number(amount).toFixed(2)}
        </p>

        {/* PIN dots — 4 large white circles (empty = bright, filled = dimmed) */}
        <div className={`flex items-center gap-5 mt-8 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={`w-[26px] h-[26px] rounded-full transition-all duration-150
                ${i < pin.length ? 'bg-white/35' : 'bg-white'}
                ${status === 'error' ? 'bg-[#FF6B6B]' : ''}
                ${status === 'success' ? 'bg-[#4ADE80]' : ''}`}
            />
          ))}
        </div>

        <p className="h-5 mt-3 text-[12px] font-semibold text-center" aria-live="polite">
          {status === 'error'
            ? <span className="text-[#FF8A8A]">{error}</span>
            : status === 'success'
              ? <span className="text-[#4ADE80]">ជោគជ័យ</span>
              : ''}
        </p>
      </div>

      <PinKeypad onKey={handle} />
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
    </motion.div>
  );
};

/* ─── Success screen (ABA in-app transfer receipt, mirrors ABA app) ─────────── */
const AngkorPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 300">
    <g fill="#5B35C8">
      {[0, 160, 320].map((x) => (
        <g key={x} transform={`translate(${x},60)`}>
          <rect x="36" y="90" width="40" height="60" />
          <rect x="16" y="110" width="80" height="40" />
          <rect x="0" y="130" width="112" height="20" />
          <path d="M56 0 L86 90 H26 Z" />
          <path d="M26 30 L46 90 H6 Z" />
          <path d="M86 30 L106 90 H66 Z" />
          <rect x="46" y="20" width="20" height="30" />
          <rect x="20" y="12" width="16" height="24" />
          <rect x="76" y="12" width="16" height="24" />
        </g>
      ))}
    </g>
  </svg>
);

/* ─── Bakong receipt background: temple + dragon boat (soft watermark) ─────── */
const BakongPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 420 420">
    <g fill="#2E6FD8">
      {/* temple towers */}
      {[20, 210].map((x) => (
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
    <g fill="#E8632A" opacity="0.9">
      {/* dragon boat */}
      <g transform="translate(60,300)">
        <path d="M10 18 Q150 2 290 18 L300 30 Q150 44 0 30 Z" />
        <path d="M300 20 L330 14 L320 24 Z" />
        <path d="M0 22 L-24 16 L-12 26 Z" />
        {[40, 80, 120, 160, 200, 240].map((x, i) => (
          <g key={x}>
            <line x1={x} y1="26" x2={x + (i % 2 ? -8 : 8)} y2="2" stroke="#2E6FD8" strokeWidth="3" strokeLinecap="round" />
            <circle cx={x + (i % 2 ? -10 : 10)} cy="2" r="5" />
          </g>
        ))}
      </g>
    </g>
  </svg>
);

const SuccessScreen = ({ data, amount, currency, payeeAmount, payeeCurrency, onDone, onRepeat, onViewHistory, isBakong, fromAccount }: {
  data: KHQRData; amount: string; currency: string;
  payeeAmount?: string; payeeCurrency?: 'USD' | 'KHR';
  onDone: () => void; onRepeat: () => void; onViewHistory: () => void;
  isBakong: boolean; fromAccount?: Account;
}) => {
  const [shared, setShared] = useState(false);
  const acct = fromAccount ?? defaultAccount;
  const amt = currency === 'KHR'
    ? Number(amount).toLocaleString() + ' ៛'
    : '$' + Number(amount).toFixed(2);
  const now = new Date();
  const txCode = String(Math.floor(10000000000 + Math.random() * 89999999999));
  const ref = '100FT' + String(Date.now()).slice(-11);
  const toAccount = (data.accountNumber || data.bakongId.split('@')[0] || '').replace(/(\d{3})(?=\d)/g, '$1 ');
  const dateStr = now.toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const share = async () => {
    const text = `ABA Transfer\n${amt} to ${data.merchantName}\nReference #: ${ref}\nDate: ${dateStr}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'ABA Transfer', text }); return; }
      throw new Error('no-share');
    } catch {
      try { await navigator.clipboard.writeText(text); setShared(true); setTimeout(() => setShared(false), 2500); } catch { /* ignore */ }
    }
  };

  const details: [string, string][] = [
    ['លេខកូដប្រតិបត្តិការ:', txCode],
    ['Original amount:', payeeAmount && payeeCurrency && payeeCurrency !== currency
      ? `${payeeCurrency === 'KHR' ? Number(payeeAmount).toLocaleString() + ' ៛' : '$' + Number(payeeAmount).toFixed(2)}`
      : amt],
    ['Reference #:', ref],
    ['To account:', `${data.merchantName} (${toAccount})`],
    ['Transaction date:', dateStr],
  ];

  const actions = [
    { icon: <Share2 className="w-6 h-6 text-[#7B4FE8]" strokeWidth={2.1} />, title: 'ចែករំលែកជារូបភាព', sub: 'ចែករំលែកព័ត៌មានលម្អិតប្រតិបត្តិការទាំងនេះជារូបភាព', onClick: share },
    { icon: <RotateCcw className="w-6 h-6 text-[#7B4FE8]" strokeWidth={2.1} />, title: 'ធ្វើប្រតិបត្តិការត្រលប់', sub: 'ធ្វើប្រតិបត្តិការថ្មីដោយត្រលប់ប្រាក់ទៅវិញ', onClick: onRepeat },
    { icon: <MessageCircle className="w-6 h-6 text-[#7B4FE8]" strokeWidth={2.1} />, title: 'ឆាត', sub: 'សូមចាប់ផ្តើមសារឆ្លើយឆ្លង ជាមួយដៃគូម្នាក់នេះ។', onClick: () => {} },
    { icon: <FileDown className="w-6 h-6 text-[#7B4FE8]" strokeWidth={2.1} />, title: 'ទាញយកជា PDF', sub: 'រក្សាទុក ព័ត៌មានប្រតិបត្តិការទាំងនេះជា PDF', onClick: () => window.print() },
    { icon: <Star className="w-6 h-6 text-[#7B4FE8]" strokeWidth={2.1} />, title: 'រក្សាទុកគំរូ', sub: 'រក្សាទុក អ្នកទទួលនេះ ក្នុងគំរូរហ័ស', onClick: () => {} },
    { icon: <History className="w-6 h-6 text-[#7B4FE8]" strokeWidth={2.1} />, title: 'មើលប្រវត្តិប្រតិបត្តិការ', sub: 'មើលប្រវត្តិប្រតិបត្តិការទាំងអស់របស់អ្នកទទួលនេះ', onClick: onViewHistory },
  ];

  /* ── eMoney receipt: Sent / Processed / Delivered + Bank: EMNY ──────────── */
  if (isBakong && data.bankCode === 'emoney') {
    const hash = Math.random().toString(16).slice(2, 10);
    const stepTime = `${String(now.getDate()).padStart(2, '0')} ${now.toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()} | ${now.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    const emDetails: [string, string][] = [
      ['Trx. ID:', txCode],
      ['Bakong hash #:', hash],
      ['Bank:', 'EMNY'],
      ['Original amount:', payeeAmount && payeeCurrency && payeeCurrency !== currency
        ? `${payeeCurrency === 'KHR' ? Number(payeeAmount).toLocaleString() + ' ៛' : '$' + Number(payeeAmount).toFixed(2)}`
        : `${Number(amount).toFixed(2)} USD`],
      ['Transaction date:', dateStr],
    ];
    const emSteps = [
      { badge: <span className="w-9 h-9 rounded-xl bg-[#E8002D] text-white text-[10px] font-extrabold flex items-center justify-center">ABA</span>, label: 'Sent' },
      { badge: <span className="w-9 h-9 rounded-xl bg-[#E5EAF2] text-[#5B7A9D] text-[17px] flex items-center justify-center">☁</span>, label: 'Processed' },
      { badge: <span className="w-9 h-9 rounded-xl bg-[#F97316] text-white text-[9px] font-extrabold flex items-center justify-center">EMNY</span>, label: 'Delivered' },
    ];
    const initials = data.merchantName.split(' ').map((n) => n[0]).join('').slice(0, 3).toUpperCase() || 'EM';

    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 z-50 bg-[#F7F7F9] flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="relative px-4 pt-12 pb-3 flex items-center justify-between">
          <button onClick={onDone} className="w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-800">
            <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
          </button>
          <p className="text-[16px] font-bold text-gray-900 tracking-tight">ABA Mobile Banking</p>
          <div className="w-9" />
        </div>

        <div className="relative px-4 flex flex-col flex-1 pb-10">
          {/* Account card */}
          <div className="rounded-3xl bg-white shadow-[0_8px_24px_rgba(232,0,45,0.08)] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8002D] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">ABA</div>
            <div>
              <p className="text-[15px] font-extrabold text-gray-900">ABA·Accounts</p>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">{acct.name} | {acct.number}</p>
            </div>
          </div>

          {/* Amount + recipient */}
          <div className="mt-5 flex items-center gap-3.5">
            <span className="w-12 h-12 rounded-full bg-[#F97316]/15 text-[#F97316] text-[14px] font-extrabold flex items-center justify-center shrink-0">{initials}</span>
            <div>
              <p className="text-[30px] font-extrabold text-[#E8002D] leading-none tracking-tight">-{Number(amount).toFixed(2)} USD</p>
              <p className="mt-1.5 text-[14px] font-bold text-gray-800">{data.merchantName}</p>
            </div>
          </div>

          {/* 3-step journey */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {emSteps.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white shadow-[0_6px_16px_rgba(0,0,0,0.05)] px-2.5 py-3 flex flex-col items-center text-center">
                {s.badge}
                <p className="mt-2 text-[12px] font-extrabold text-gray-800">{s.label}</p>
                <p className="mt-1 text-[9px] text-gray-400">{stepTime}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="mt-3 rounded-3xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] px-5 py-2 divide-y divide-gray-100">
            {emDetails.map(([label, value]) => (
              <div key={label} className="py-2.5 flex items-start justify-between gap-3">
                <span className="text-[12px] text-gray-500 font-medium shrink-0">{label}</span>
                <span className="text-[12px] font-bold text-gray-900 text-right break-all">{value}</span>
              </div>
            ))}
          </div>

          {/* Share / PDF */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={share} className="py-3.5 rounded-2xl bg-white border border-[#7B4FE8]/25 text-[#7B4FE8] font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
              <Share2 className="w-4 h-4" strokeWidth={2.4} /> Share as image
            </button>
            <button onClick={() => window.print()} className="py-3.5 rounded-2xl bg-white border border-[#7B4FE8]/25 text-[#7B4FE8] font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
              <FileDown className="w-4 h-4" strokeWidth={2.4} /> Download as PDF
            </button>
          </div>
          {shared && <p className="mt-2 text-center text-[12px] font-semibold text-[#7B4FE8]">Copied transaction details to clipboard</p>}

          {/* Home */}
          <button
            onClick={onDone}
            className="mt-4 w-full py-4 rounded-2xl bg-[#E8002D] text-white font-bold text-[15px] shadow-[0_4px_16px_rgba(232,0,45,0.3)] active:scale-[0.98]"
          >
            ទំព័រដើម
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── Bakong (inter-bank) receipt — receipt-sheet style, mirrors the official
     ABA Bakong success UI (dimmed account screen + floating white receipt) ── */
  if (isBakong) {
    const KM_MONTHS = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
    const hash = Math.random().toString(16).slice(2, 10);
    const kmTime = `${now.getDate()} ${KM_MONTHS[now.getMonth()]} | ${now.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

    const bkDetails: [string, string][] = [
      ['លេខកូដប្រតិបត្តិការ:', txCode],
      ['Bakong hash #:', hash],
      ['Bank:', data.bankName],
      ['Original amount:', payeeAmount && payeeCurrency && payeeCurrency !== currency
        ? `${payeeCurrency === 'KHR' ? Number(payeeAmount).toLocaleString() + ' ៛' : '$' + Number(payeeAmount).toFixed(2)}`
        : `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`],
      ['Transaction date:', dateStr],
    ];

    const steps = [
      { icon: <span className="w-[29px] h-[29px] grid place-items-center rounded-full bg-[#E8002D] text-white text-[9px] font-extrabold border-2 border-[#f3f3f3]">ABA</span>, kh: 'បានផ្ញើចេញ', en: 'SENT' },
      { icon: <span className="w-[29px] h-[29px] grid place-items-center rounded-full bg-[#f3f3f3] text-[#20a7b5] border-2 border-[#f3f3f3]"><Cloud size={15} strokeWidth={2.4} /></span>, kh: 'បានផ្ញើបន្ត', en: 'BAKONG' },
      { icon: <span className="w-[29px] h-[29px] grid place-items-center rounded-full overflow-hidden border-2 border-[#f3f3f3]"><BankLogo bankCode={data.bankCode} bankName={data.bankName} /></span>, kh: 'បានផ្ញើដល់អ្នកទទួល', en: 'RECEIVED' },
    ];

    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 z-50 bg-[#d9d9d9] flex flex-col overflow-hidden"
      >
        {/* Dimmed account screen (the bank page the receipt floats on) */}
        <div className="relative h-[168px] shrink-0 px-5 pt-12 bg-[#d9d9d9]">
          <div className="flex items-center justify-between">
            <button onClick={onDone} className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center text-gray-800" aria-label="返回">
              <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <p className="text-[16px] font-extrabold text-gray-800 tracking-tight">ABA គណនី</p>
            <div className="w-9" />
          </div>
          <p className="mt-5 text-center text-[13px] font-semibold text-gray-700">
            {acct.type} <span className="text-gray-400 font-normal mx-1">|</span>{' '}
            <span className="text-gray-500 font-medium">{acct.number}</span>
          </p>
        </div>

        {/* White receipt sheet */}
        <div className="flex-1 bg-white rounded-t-[23px] -mt-1 relative flex flex-col overflow-y-auto shadow-[0_-2px_12px_rgba(0,0,0,0.05)] px-5 pt-2.5 pb-6">
          <div className="w-[42px] h-[5px] rounded-full bg-[#d5d5d5] mx-auto mb-4" />

          {/* Amount + recipient */}
          <div className="flex items-center gap-3 px-0.5 pb-3">
            <span className="flex-[0_0_47px] w-[47px] h-[47px] rounded-full bg-[#E8002D] text-white border-2 border-white/90 shadow-[0_1px_3px_rgba(50,50,50,0.15)] flex items-center justify-center text-[11px] font-extrabold">{currency}</span>
            <div className="min-w-0">
              <p className="text-[25px] font-extrabold text-[#101820] leading-none tracking-tight">
                -{Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-[14px] font-bold text-[#1f2830]">{currency}</span>
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[#555a60] truncate">{data.merchantName}</p>
            </div>
          </div>

          {/* 3-step journey (route progress) */}
          <div className="relative grid grid-cols-3 gap-[3px] min-h-[94px] mt-1 mb-4 px-1.5 py-2.5 overflow-hidden bg-[#f3f3f3] rounded-[20px]">
            <div className="absolute top-[27px] left-[15%] right-[15%] h-[2px] bg-[#767a7c]" aria-hidden="true" />
            {steps.map((s) => (
              <div key={s.kh} className="relative z-[1] min-w-0 flex flex-col items-center text-center">
                <span className="relative">
                  {s.icon}
                  <span className="absolute -top-1.5 -right-1.5 w-[14px] h-[14px] grid place-items-center text-white bg-[#38b98c] border border-[#f3f3f3] rounded-full">
                    <Check size={9} strokeWidth={3.5} />
                  </span>
                </span>
                <p className="mt-1.5 text-[9px] font-bold text-[#45484a] leading-snug">{s.kh}</p>
                <p className="text-[7px] font-semibold tracking-[0.03em] text-[#8a8c8e]">{s.en}</p>
                <p className="mt-[2px] w-full text-[7px] text-[#818386] leading-[1.25] break-all">{kmTime}</p>
              </div>
            ))}
          </div>

          {/* Dashed divider */}
          <div className="h-px mx-[-19px] mb-4 border-t border-dashed border-[#c9c9c9]" />

          {/* Details */}
          <div className="flex flex-col pb-2">
            {bkDetails.map(([label, value]) => (
              <div key={label} className="min-h-[32px] flex items-baseline justify-between gap-3.5 text-[12px] leading-[1.35]">
                <span className="text-[#858585] shrink-0">{label}</span>
                <strong className="max-w-[63%] text-[#414246] text-[12px] font-bold text-right break-all">{value}</strong>
              </div>
            ))}
          </div>

          {/* Share / Download */}
          <div className="flex flex-col gap-0.5 mt-1.5 pt-2.5 border-t border-[#e9e9e9]">
            <button onClick={share} className="w-full min-h-[54px] flex items-center gap-2.5 px-0 text-left text-[#12639b] rounded-xl active:bg-[#f7fafc]">
              <span className="flex-[0_0_35px] w-[35px] h-[35px] grid place-items-center text-[#21668e] bg-[#f1f6f9] rounded-full"><Share2 size={19} strokeWidth={2.2} /></span>
              <span className="flex flex-col gap-[3px]">
                <strong className="text-[12px] font-bold text-[#12639b]">ចែករំលែកជារូបភាព</strong>
                <small className="text-[9px] text-[#a4a7a9]">ចែករំលែកព័ត៌មានលម្អិតប្រតិបត្តិការទាំងនេះជារូបភាព</small>
              </span>
            </button>
            <button onClick={() => window.print()} className="w-full min-h-[54px] flex items-center gap-2.5 px-0 text-left text-[#12639b] rounded-xl active:bg-[#f7fafc]">
              <span className="flex-[0_0_35px] w-[35px] h-[35px] grid place-items-center text-[#21668e] bg-[#f1f6f9] rounded-full"><FileDown size={19} strokeWidth={2.2} /></span>
              <span className="flex flex-col gap-[3px]">
                <strong className="text-[12px] font-bold text-[#12639b]">ទាញយកជា PDF</strong>
                <small className="text-[9px] text-[#a4a7a9]">រក្សាទុក ព័ត៌មានប្រតិបត្តិការទាំងនេះជា PDF</small>
              </span>
            </button>
          </div>
          {shared && <p className="mt-2 text-center text-[11px] font-semibold text-[#12639b]">Copied transaction details to clipboard</p>}

          {/* Receipt footer */}
          <div className="flex flex-col items-center gap-1 mt-2.5 pt-2.5 border-t border-[#f1f1f1] text-center text-[8px] font-semibold tracking-[0.06em] text-[#9a9da1]">
            <span>វិក្កយបត្រផ្ទេរប្រាក់ · Transfer Receipt</span>
            <span>ABA Mobile Banking · {dateStr}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-[#F7F5FF] flex flex-col overflow-y-auto"
    >
      <AngkorPattern />

      {/* Header */}
      <div className="relative px-4 pt-12 pb-3 flex items-center justify-between">
        <button onClick={onDone} className="w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-800">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <p className="text-[16px] font-bold text-gray-900 tracking-tight">ABA គណនី</p>
        <div className="w-9" />
      </div>

      <div className="relative px-4 flex flex-col flex-1 pb-10">
        {/* Amount + recipient */}
        <div className="mt-2 text-center">
          <p className="text-[40px] font-extrabold text-[#E8002D] leading-none tracking-tight">-{amt}</p>
          <p className="mt-2 text-[15px] font-semibold text-gray-700">Transfer to {data.merchantName}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{toAccount}</p>
        </div>

        {/* Details */}
        <div className="mt-5 rounded-3xl bg-white shadow-[0_8px_24px_rgba(123,79,232,0.08)] px-5 py-2 divide-y divide-gray-100">
          {details.map(([label, value]) => (
            <div key={label} className="py-2.5 flex items-start justify-between gap-3">
              <span className="text-[12.5px] text-gray-500 font-medium shrink-0">{label}</span>
              <span className="text-[12.5px] font-bold text-gray-900 text-right break-all">{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-5 rounded-3xl bg-white shadow-[0_8px_24px_rgba(123,79,232,0.08)] px-5 divide-y divide-gray-100">
          {actions.map((a) => (
            <button key={a.title} onClick={a.onClick} className="w-full py-3.5 flex items-center gap-4 text-left active:bg-gray-50 transition-colors">
              <span className="w-11 h-11 rounded-xl bg-[#F3EDFF] flex items-center justify-center shrink-0">{a.icon}</span>
              <span className="flex-1">
                <span className="block text-[14.5px] font-bold text-gray-800">{a.title}</span>
                <span className="block text-[11.5px] text-gray-400 mt-0.5 leading-snug">{a.sub}</span>
              </span>
            </button>
          ))}
        </div>
        {shared && <p className="mt-3 text-center text-[12px] font-semibold text-[#7B4FE8]">Copied transaction details to clipboard</p>}
      </div>
    </motion.div>
  );
};

/* ─── Main page ──────────────────────────────────────────────────────────────── */
/* ABA demo FX rate: 1 USD = 4,050 KHR (approx. NBC interbank mid-rate). */
const EXCHANGE_RATE = 4050;

export default function Transfer() {
  const [, setLocation] = useLocation();
  const [data, setData]         = useState<KHQRData | null>(null);
  /** Transfer mode chosen on the TransferHub: 'internal' = ABA-to-ABA form
      (account number only, no QR), 'cross' = inter-bank / KHQR form. When a
      KHQR scan is the entry, the scanned payload decides instead. */
  const [tfMode, setTfMode] = useState<'internal' | 'cross'>(() =>
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('aba.tf.mode') === 'internal' ? 'internal' : 'cross'
  );
  useEffect(() => {
    try { sessionStorage.removeItem('aba.tf.mode'); } catch { /* ignore */ }
  }, [setTfMode]);
  /** Payee actually submitted (typed account recipient, else scan data). */
  const [payeeData, setPayeeData] = useState<KHQRData | null>(null);
  const [amount, setAmount]     = useState('');
  const [note, setNote]         = useState('');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  /** Recipient currency — the currency the PAYEE receives (USD or KHR).
      The user picks this from the amount card label: pay in USD or pay in
      KHR to the other party. The pay-from account stays independent and is
      converted when its currency differs. */
  const [payeeCur, setPayeeCur] = useState<'USD' | 'KHR'>('USD');
  const [accountId, setAccountId] = useState('1'); // default USD account
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');
  const [pinStep, setPinStep]   = useState(false);
  const [pinStatus, setPinStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [pinError, setPinError] = useState('');
  const [shake, setShake]       = useState(false);
  const noteRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<KHQRData | null>(null);
  const rawRef = useRef('');
  const pollRef = useRef<number>(0);
  const pollCountRef = useRef(0);
  const [livePay, setLivePay] = useState<BakongPaymentResult | null>(null);
  const [pwPay, setPwPay] = useState<PayWayInitiateResult | null>(null);
  const [pwError, setPwError] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [sendAsGift, setSendAsGift] = useState(false);
  /** Real-time Bakong holder verification for the typed account number. */
  const [bkCheck, setBkCheck] = useState<'idle' | 'checking' | 'ok' | 'missing' | 'offline'>('idle');

  /* Verify the typed account against the real Bakong Open API (debounced).
     On success we show the holder name + "verified" badge; on "not found" a
     red warning. If the gateway is offline, fall back to the local name pool. */
  useEffect(() => {
    const clean = toAccount.replace(/\s+/g, '');
    if (!/^\d{9,}$/.test(clean)) { setBkCheck('idle'); return; }
    let cancelled = false;
    setBkCheck('checking');
    const t = setTimeout(async () => {
      const res = await checkBakongAccount(`${clean}@ababank`);
      if (cancelled) return;
      if (!res.live) setBkCheck('offline');
      else setBkCheck(res.ok ? 'ok' : 'missing');
    }, 650);
    return () => { cancelled = true; clearTimeout(t); };
  }, [toAccount]);

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? defaultAccount;
  /** Recipient currency — user picks from the amount card label: pay the
      other party in USD or in KHR. Initialised from the scanned KHQR payload
      (or defaults to USD) when the form loads. The pay-from account stays
      independent and is converted when its currency differs. */
  const payeeCurrency: 'USD' | 'KHR' = payeeCur;
  const inputCurrency = payeeCurrency;
  /** Amount the recipient receives (typed amount, always in payee currency). */
  const payeeAmount = amount;
  /** Amount actually deducted from the selected account, converted at
      EXCHANGE_RATE when the account currency differs from the payee's. */
  const deductAmount = !!amount
    ? currency === payeeCurrency
      ? parseFloat(amount).toString()
      : currency === 'USD'
        ? (parseFloat(amount) / EXCHANGE_RATE).toFixed(2) // KHR order → USD deduction
        : (parseFloat(amount) * EXCHANGE_RATE).toFixed(0) // USD order → KHR deduction
    : '0';

  useEffect(() => {
    const pending = getPendingTransfer();
    if (pending) {
      setData(pending.data);
      rawRef.current = pending.raw;
      clearPendingTransfer();
      // Initialise the recipient/pay currency from the scanned payload; the
      // user can still switch USD ↔ KHR from the amount card label.
      setPayeeCur(pending.data.currency ?? 'USD');
      // Pre-fill the amount from a dynamic QR. The typed amount is always in
      // the payee/order currency (payeeCurrency); the pay-from account stays
      // whatever the user selects (default USD) and is converted when needed.
      if (pending.data.amount) setAmount(pending.data.amount);
      setToAccount(pending.data.accountNumber || pending.data.bakongId.split('@')[0] || '');
      return;
    }
    // Direct entry (e.g. Home "Transfers" button): default to the first ABA
    // demo recipient so the transfer form opens straight away. The internal
    // ABA-to-ABA form stays account-only (no QR payload, empty account input).
    const d = parseKHQR(DEMO_KHQR[0].qr);
    if (d) {
      setData(d);
      rawRef.current = DEMO_KHQR[0].qr;
      setPayeeCur(d.currency ?? 'USD');
      if (tfMode !== 'internal') setToAccount(d.accountNumber || d.bakongId.split('@')[0] || '');
    }
  }, [setLocation]);

  const handleKey = (k: string) => {
    setError('');
    if (k === '⌫') { setAmount(a => a.slice(0, -1)); return; }
    if (k === '.' && amount.includes('.')) return;
    if (amount === '0' && k !== '.') { setAmount(k); return; }
    if (amount.length >= 10) return;
    // KHR — no decimals (input is always in the payee/order currency)
    if (payeeCurrency === 'KHR' && k === '.') return;
    setAmount(a => a + k);
  };

  const handleConfirm = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) { setError('Please enter a valid amount'); return; }
    if (num > 99999) { setError('Amount exceeds limit'); return; }
    // Step 0: speak the amount for review ("转账金额 X，请你确认" / EN) — in the
    // payee/order currency the user typed. Language comes from the Settings page.
    speakTransferConfirm(num, payeeCurrency, getTtsLang());
    // Step 1: verify the payment PIN before committing the transfer.
    // The payee is the account the user actually typed in the form (name shown
    // under the input), falling back to the scanned KHQR payload.
    const payee = isABAInternal
      ? (recipient ?? (/^\d{9,}$/.test(toAccount.replace(/\s+/g, '')) ? abaHolder(toAccount) : data))
      : (typedRecipient ?? data);
    pendingRef.current = payee;
    setPayeeData(payee);
    setPinStep(true);
    setPinStatus('idle');
    setPinError('');
  };

  /* Settle the transfer locally: deduct the outbound amount from the payer
     account, record the transaction in the statement ledger and show the
     success screen. */
  const commitLocal = (extra?: BakongPaymentResult) => {
    const d = pendingRef.current;
    if (!d) return;
    const numDeduct = parseFloat(deductAmount) || 0;
    // Deduct from the account the user selected (USD or KHR), converted from
    // the payee/order currency when needed (e.g. 28,800 KHR order → $7.11 USD).
    deductBalance(accountId, numDeduct);
    const seed = accounts.find((a) => a.id === accountId)?.balance ?? '0.00';
    const balanceAfter = Number(getBalance(accountId, seed)) || 0;
    addTxn({
      name: d.merchantName,
      amount: payeeAmount,
      currency: payeeCurrency,
      deductAmount,
      deductCurrency: currency,
      bankName: d.bankName,
      bankColor: d.bankColor,
      bakongId: d.bakongId,
      accountNumber: d.accountNumber,
      note: note.trim() || undefined,
    });
    setPinStep(false);
    setLivePay(null);
    setPwPay(null);
    setPwError('');
    // Speak the confirmed OUTBOUND amount (what was sent to the recipient),
    // never the remaining balance (user explicitly asked not to read balance).
    // Uses pre-recorded MP3 if available, falls back to browser TTS.
    speakTransferSuccessSmart(getTtsLang(), parseFloat(payeeAmount) || 0, payeeCurrency);
    setSuccess(true);
  };

  const handlePin = (fullPin: string) => {
    if (fullPin === MOCK_PAYMENT_PIN) {
      setPinStatus('success');
      setTimeout(async () => {
        // Step 2: submit through the payment gateway. ABA PayWay first (real
        // channel when configured), Bakong next, local demo as last resort.
        const d = pendingRef.current;
        if (!d) { setPinStep(false); setSuccess(true); return; }

        /* ── Demo mode: settle locally so the journey stays fully testable.
           Flip USE_REAL_PAYMENT to true when the PayWay key is renewed (or the
           Bakong app-confirmation flow is desired). The typed-account holder
           verification (checkBakongAccount) is ALREADY real regardless. ── */
        if (!USE_REAL_PAYMENT) { commitLocal(); return; }

        /* ── A. ABA PayWay (real gateway) ── */
        const payway = await getPaywayStatus();
        if (payway.configured) {
          const pw = await initiatePaywayPayment({
            amount: parseFloat(amount) || 0,
            currency,
            paymentOption: 'abapay',
            firstName: d.merchantName,
            continueSuccessUrl: `${window.location.origin}${window.location.pathname}`,
          });

          if (pw?.mode === 'form' || pw?.mode === 'deeplink') {
            setPinStep(false);
            setPwError('');
            setPwPay(pw);
            startPwPoll(pw.tranId ?? '');
            return;
          }
          if (pw?.mode === 'error') {
            // ABA answered with a business error (e.g. code 21 expired key).
            setPinStep(false);
            setPwPay(null);
            setPwError(formatPwError(pw));
            return;
          }
          if (!pw) {
            /* gateway offline → fall through to Bakong */
          } else {
            commitLocal(); // mock gateway
            return;
          }
        }

        /* ── B. Bakong gateway ── */
        const initiated = await initiateBakongPayment({
          qr: rawRef.current || d.bakongId,
          amount: parseFloat(amount) || 0,
          currency,
          toAccountId: d.bakongId,
          fromAccountId: 'aba_demo@ababank',
          reference: `100FT${Math.floor(Date.now() / 1000)}`,
        });

        if (!initiated) { commitLocal(); return; }                          // gateway offline → local demo
        if (initiated.status === 'success') { commitLocal(initiated); return; } // settled instantly (mock / confirmed)

        // Live Bakong: ask the user to complete the payment in the Bakong app,
        // then poll the gateway until the transaction settles.
        setPinStep(false);
        setLivePay(initiated);
        pollRef.current = window.setInterval(async () => {
          const s = await pollBakongPayment(initiated.id);
          if (s && s.status === 'success') {
            window.clearInterval(pollRef.current);
            commitLocal(s);
          }
        }, 3000);
      }, 500);
    } else {
      setPinStatus('error');
      setPinError('支付密码错误，请重新输入');
      setShake(true);
      setTimeout(() => { setShake(false); setPinStatus('idle'); setPinError(''); }, 1100);
    }
  };

  /* Poll ABA PayWay until it settles (max ~60s, then manual re-check). */
  const startPwPoll = (tranId: string) => {
    if (!tranId) return;
    pollCountRef.current = 0;
    pollRef.current = window.setInterval(async () => {
      const s = await checkPaywayStatus(tranId);
      if (s.ok) { window.clearInterval(pollRef.current); commitLocal(); return; }
      if (s.status === 3) {
        window.clearInterval(pollRef.current);
        setPwError('支付被拒绝（Declined）');
        setPwPay(p => p ? { ...p, status: 'failed' } : p);
        return;
      }
      pollCountRef.current += 1;
      if (pollCountRef.current >= 20) {
        window.clearInterval(pollRef.current);
        setPwPay(p => p ? { ...p, status: 'failed' } : p);
        setPwError('等待超时，请确认是否已在 ABA 完成支付，然后点击"我已完成支付"');
      }
    }, 3000);
  };

  const formatPwError = (pw: PayWayInitiateResult): string => {
    const code = pw.data?.status?.code ?? pw.data?.code;
    const msg = pw.data?.status?.message ?? pw.data?.message ?? pw.message ?? pw.detail ?? '';
    const codeStr = code !== undefined && code !== null ? String(code) : '';
    const base = codeStr ? `ABA PayWay 错误 ${codeStr}：${msg}` : (msg || 'ABA PayWay 支付发起失败');
    if (codeStr === '21') return 'ABA PayWay API Key 已过期（End of API lifetime）。请联系 ABA 更新商户 Public Key 后重试。';
    return base;
  };

  const formatted = () => {
    if (!amount) return payeeCurrency === 'KHR' ? '0 ៛' : '$0.00';
    const n = parseFloat(amount);
    if (isNaN(n)) return '';
    return payeeCurrency === 'KHR' ? n.toLocaleString() + ' ៛' : '$' + amount;
  };

  if (!data) return null;

  /* ── ABA internal (ABA to ABA) form helpers ── */
  const matchRecipient = (acc: string): KHQRData | null => {
    if (!acc) return null;
    const clean = acc.replace(/\s+/g, '');
    for (const e of DEMO_KHQR) {
      const d = parseKHQR(e.qr);
      if (d && (d.accountNumber || d.bakongId.split('@')[0] || '').replace(/\s+/g, '') === clean) return d;
    }
    // Built-in ABA account book → resolve recipient name under the input.
    const hit = ABA_ACCOUNTS[clean];
    if (hit) {
      return {
        bakongId: `${clean}@ababank`,
        accountNumber: clean,
        bankCode: 'ababank',
        bankName: 'ABA Bank',
        bankColor: '#E8002D',
        merchantName: hit.name,
        city: 'PHNOM PENH',
        currency: hit.currency,
        qrType: 'static',
      };
    }
    // Any other valid ABA account: no fabricated name — the real Bakong
    // verification badge (checkBakongAccount) shows "verified / not found"
    // instead of inventing a holder. Names come only from the built-in account
    // book, scanned KHQR payloads, or the user's own registry.
    return null;
  };
  const isABAInternal = tfMode === 'internal' || data.bankName === 'ABA Bank' || data.bankCode === 'ababank';
  const recipient = isABAInternal
    ? matchRecipient(toAccount) ??
      (toAccount.replace(/\s+/g, '') === (data.accountNumber || '').replace(/\s+/g, '') ? data : null)
    : null;
  /** Neutral ABA payee descriptor for a typed-but-unregistered account
      (used for the receipt when no registered/scanned name exists). */
  const abaHolder = (acc: string): KHQRData => {
    const clean = acc.replace(/\s+/g, '');
    return {
      bakongId: `${clean}@ababank`,
      accountNumber: clean,
      bankCode: 'ababank',
      bankName: 'ABA Bank',
      bankColor: '#E8002D',
      merchantName: 'ABA Account Holder',
      city: 'PHNOM PENH',
      currency: 'USD',
      qrType: 'static',
    };
  };
  /** For cross-bank forms: the recipient resolved from the typed account
      number (may be null — then the badge shows the real Bakong result and
      the name falls back to the scanned KHQR payload). */
  const typedRecipient = matchRecipient(toAccount);

  return (
    <div className="min-h-[100dvh] md:h-screen md:min-h-screen bg-zinc-900 flex items-center justify-center md:p-4 font-sans select-none">
      <div className="w-full h-full md:max-w-[390px] md:h-[844px] bg-[#F5F5F7] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden md:border-[8px] border-black flex flex-col">

        {/* ── Header ── */}
        <div className="bg-white px-4 pt-12 pb-4 shrink-0 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => setLocation('/transfer')} className="text-gray-700 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <div className="flex-1">
              {isABAInternal ? (
                <p className="text-[17px] font-extrabold text-gray-900">ABA ផ្ទេរប្រាក់</p>
              ) : (
                <p className="text-[17px] font-extrabold text-gray-900">Transfer via KHQR</p>
              )}
            </div>
            {isABAInternal ? (
              <span className="w-8 h-8 rounded-lg bg-[#E8002D] text-white text-[10px] font-black flex items-center justify-center shadow-sm shrink-0">ABA</span>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#00A67E]/10 px-2.5 py-1 rounded-full shrink-0">
                <div className="w-2 h-2 rounded-full bg-[#00A67E]" />
                <span className="text-[10px] font-bold text-[#00A67E]">bakong</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {isABAInternal ? (
            <div className="px-4 pt-4">

              {/* Banner: ABA logo + subtitle */}
              <div className="bg-white rounded-2xl px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-[#E8002D] text-white text-[13px] font-black flex items-center justify-center shrink-0 shadow-sm">ABA</span>
                <p className="text-[13.5px] font-bold text-gray-800 leading-snug">ផ្ទេរទៅគណនី ABA ណាមួយ</p>
              </div>

              {/* Choose pay currency (USD / KHR) — switches the pay-from account */}
              <div
                onClick={() => {
                  const next = accountId === '1' ? '5' : '1';
                  const acct = accounts.find((a) => a.id === next)!;
                  setAccountId(next);
                  setCurrency(acct.currency as 'USD' | 'KHR');
                  setAmount('');
                  setError('');
                }}
                className="mt-3 w-full bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-between text-left active:bg-gray-50 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-400">ជ្រើសរើសគណនីរបស់អ្នក · រូបិយប័ណ្ណទូទាត់</p>
                  <p className="text-[15px] font-extrabold text-gray-900 mt-1 truncate">
                    {selectedAccount.name}: {currency === 'KHR'
                      ? Number(getBalance(selectedAccount.id, selectedAccount.balance ?? '0')).toLocaleString() + ' ៛'
                      : '$' + Number(getBalance(selectedAccount.id, selectedAccount.balance ?? '0')).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex rounded-xl bg-gray-100 p-0.5" role="group" aria-label="Pay currency">
                    <button
                      onClick={() => {
                        if (currency !== 'USD') {
                          const acct = accounts.find((a) => a.id === '1')!;
                          setAccountId(acct.id);
                          setCurrency('USD');
                          setAmount('');
                          setError('');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-[10px] text-[12px] font-extrabold transition-colors ${currency === 'USD' ? 'bg-white text-[#1A1F71] shadow-sm' : 'text-gray-500'}`}
                    >
                      USD
                    </button>
                    <button
                      onClick={() => {
                        if (currency !== 'KHR') {
                          const acct = accounts.find((a) => a.id === '5')!;
                          setAccountId(acct.id);
                          setCurrency('KHR');
                          setAmount('');
                          setError('');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-[10px] text-[12px] font-extrabold transition-colors ${currency === 'KHR' ? 'bg-white text-[#C8102E] shadow-sm' : 'text-gray-500'}`}
                    >
                      KHR
                    </button>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={2.5} />
                </div>
              </div>

              {/* Recipient account number */}
              <div className="mt-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <p className="text-[11px] font-bold text-gray-400">ដាក់លេខគណនីទទួល</p>
                <input
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value.replace(/[^\d\s]/g, '').slice(0, 15))}
                  placeholder="000 000 000"
                  inputMode="numeric"
                  className="mt-1 w-full text-[16px] font-extrabold text-gray-900 placeholder-gray-300 bg-transparent outline-none tracking-wide"
                />
              </div>

              {/* Recipient verification */}
              <div className={`mt-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-3 ${recipient ? '' : 'opacity-70'}`}>
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-[14px] shrink-0"
                  style={recipient ? { backgroundColor: recipient.bankColor } : { backgroundColor: '#9CA3AF' }}
                >
                  {recipient ? recipient.merchantName.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
                </span>
                <div className="flex-1 min-w-0">
                  {recipient ? (
                    <>
                      <p className="text-[14px] font-extrabold text-gray-900 truncate">{recipient.merchantName}</p>
                      <p className="text-[11px] text-gray-400 font-semibold truncate">{toAccount || recipient.bakongId}</p>
                    </>
                  ) : bkCheck === 'ok' ? (
                    <>
                      <p className="text-[14px] font-extrabold text-gray-900 truncate">ABA Account Holder</p>
                      <p className="text-[11px] text-gray-400 font-semibold truncate">{toAccount}</p>
                    </>
                  ) : bkCheck === 'missing' ? (
                    <>
                      <p className="text-[14px] font-extrabold text-[#E8002D] truncate">账户不存在</p>
                      <p className="text-[11px] text-gray-400 font-semibold truncate">{toAccount}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[14px] font-extrabold text-gray-400 truncate">មិនទាន់ផ្ទៀងផ្ទាត់</p>
                      <p className="text-[11px] text-gray-400 font-semibold truncate">{toAccount || 'លេខគណនី ABA ណាមួយ'}</p>
                    </>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${payeeCurrency === 'USD' ? 'bg-[#1A1F71]/10 text-[#1A1F71]' : 'bg-[#C8102E]/10 text-[#C8102E]'}`}>
                  {payeeCurrency}
                </span>
                {bkCheck === 'checking' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-gray-100 text-gray-500">验证中…</span>
                )}
                {bkCheck === 'ok' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-[#00A67E]/10 text-[#00A67E]">✓ 已验证</span>
                )}
                {bkCheck === 'missing' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-[#E8002D]/10 text-[#E8002D]">账户不存在</span>
                )}
                {bkCheck === 'offline' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-gray-100 text-gray-500">离线校验</span>
                )}
              </div>

              {/* Amount */}
              <div className="mt-3 bg-white rounded-2xl px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ចំនួនទឹកប្រាក់</p>
                  <button
                    type="button"
                    onClick={() => { setPayeeCur(p => (p === 'USD' ? 'KHR' : 'USD')); setAmount(''); setError(''); }}
                    aria-label={`切换支付币种为 ${payeeCurrency === 'USD' ? 'KHR' : 'USD'}`}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full border text-[12px] font-bold active:scale-95 transition-all ${payeeCurrency === 'USD' ? 'border-[#1A1F71] text-[#1A1F71]' : 'border-[#C8102E] text-[#C8102E]'}`}
                  >
                    {payeeCurrency}
                    <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="flex items-end justify-center gap-1 min-h-[52px]">
                  <span className="text-[40px] font-extrabold text-gray-900 leading-none tracking-tight">{formatted()}</span>
                </div>

                {/* FX conversion — convert the payee/order amount into the
                    selected account currency (e.g. 28,800 KHR order → ≈ $7.11 USD) */}
                {!!amount && parseFloat(amount) > 0 && currency !== payeeCurrency && (
                  <div className="mt-2 text-center">
                    <p className="text-[12px] font-bold text-[#00A67E]">
                      ≈ {currency === 'USD'
                        ? `$${(parseFloat(amount) / EXCHANGE_RATE).toFixed(2)}`
                        : `${(parseFloat(amount) * EXCHANGE_RATE).toLocaleString('en-US')} ៛`}
                      <span className="text-[10.5px] text-gray-400 font-semibold ml-1.5">
                        {currency === 'USD' ? '等值美金' : '等值KHR'}（1 USD = 4,050 KHR）
                      </span>
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-[11px] text-[#E8002D] font-semibold text-center mt-2">{error}</p>
                )}

              </div>

              {/* Note */}
              <div className="mt-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <p className="text-[11px] font-bold text-gray-400">ចំណាំ (មិនដាក់ក៏បាន)</p>
                <input
                  ref={noteRef}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="បញ្ចូលកំណត់ចំណាំ..."
                  className="mt-1 w-full text-[14px] font-semibold text-gray-800 placeholder-gray-300 bg-transparent outline-none"
                />
              </div>

              {/* Save template toggle */}
              <div className="mt-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-between">
                <p className="text-[13.5px] font-bold text-gray-800 leading-snug">បង្កើត គំរូទូទាត់ប្រចាំ</p>
                <button
                  onClick={() => setSaveTemplate(s => !s)}
                  aria-label="Toggle save template"
                  className={`w-12 h-7 rounded-full transition-colors relative ${saveTemplate ? 'bg-[#00A67E]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${saveTemplate ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Send as gift toggle */}
              <div className="mt-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-between">
                <p className="text-[13.5px] font-bold text-gray-800 leading-snug">ផ្ញើជាកាដូ</p>
                <button
                  onClick={() => setSendAsGift(s => !s)}
                  aria-label="Toggle send as gift"
                  className={`w-12 h-7 rounded-full transition-colors relative ${sendAsGift ? 'bg-[#00A67E]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${sendAsGift ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Numpad */}
              <div className="mt-3 bg-white rounded-2xl px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <NumPad onKey={handleKey} />
              </div>

              {/* Transfer button (grey until complete) */}
              <div className="mt-3 mb-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirm}
                  disabled={!amount || !recipient}
                  className={`w-full py-4 rounded-2xl font-extrabold text-[16px] transition-colors ${
                    amount && recipient
                      ? 'bg-[#E8002D] text-white shadow-[0_4px_16px_rgba(232,0,45,0.3)]'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  ផ្ទេរ
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="px-4 pt-4">

              {/* Banner: ABA logo + subtitle */}
              <div className="bg-white rounded-2xl px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-[#E8002D] text-white text-[13px] font-black flex items-center justify-center shrink-0 shadow-sm">ABA</span>
                <p className="text-[13.5px] font-bold text-gray-800 leading-snug">ផ្ទេរទៅគណនីណាមួយ</p>
              </div>

              {/* Choose pay currency (USD / KHR) — switches the pay-from account */}
              <div
                onClick={() => {
                  const next = accountId === '1' ? '5' : '1';
                  const acct = accounts.find((a) => a.id === next)!;
                  setAccountId(next);
                  setCurrency(acct.currency as 'USD' | 'KHR');
                  setAmount('');
                  setError('');
                }}
                className="mt-3 w-full bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-between text-left active:bg-gray-50 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-400">ជ្រើសរើសគណនីរបស់អ្នក · រូបិយប័ណ្ណទូទាត់</p>
                  <p className="text-[15px] font-extrabold text-gray-900 mt-1 truncate">
                    {selectedAccount.name}: {currency === 'KHR'
                      ? Number(getBalance(selectedAccount.id, selectedAccount.balance ?? '0')).toLocaleString() + ' ៛'
                      : '$' + Number(getBalance(selectedAccount.id, selectedAccount.balance ?? '0')).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex rounded-xl bg-gray-100 p-0.5" role="group" aria-label="Pay currency">
                    <button
                      onClick={() => {
                        if (currency !== 'USD') {
                          const acct = accounts.find((a) => a.id === '1')!;
                          setAccountId(acct.id);
                          setCurrency('USD');
                          setAmount('');
                          setError('');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-[10px] text-[12px] font-extrabold transition-colors ${currency === 'USD' ? 'bg-white text-[#1A1F71] shadow-sm' : 'text-gray-500'}`}
                    >
                      USD
                    </button>
                    <button
                      onClick={() => {
                        if (currency !== 'KHR') {
                          const acct = accounts.find((a) => a.id === '5')!;
                          setAccountId(acct.id);
                          setCurrency('KHR');
                          setAmount('');
                          setError('');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-[10px] text-[12px] font-extrabold transition-colors ${currency === 'KHR' ? 'bg-white text-[#C8102E] shadow-sm' : 'text-gray-500'}`}
                    >
                      KHR
                    </button>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={2.5} />
                </div>
              </div>

              {/* Recipient account number */}
              <div className="mt-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <p className="text-[11px] font-bold text-gray-400">ដាក់លេខគណនីទទួល</p>
                <input
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value.replace(/[^\d\s]/g, '').slice(0, 20))}
                  placeholder="000 000 000"
                  inputMode="numeric"
                  className="mt-1 w-full text-[16px] font-extrabold text-gray-900 placeholder-gray-300 bg-transparent outline-none tracking-wide"
                />
              </div>

              {/* Recipient verification — shows the recipient name right under
                  the account input once a valid account number is typed */}
              <div className="mt-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-3">
                <span className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-[14px] shrink-0" style={{ backgroundColor: typedRecipient?.bankColor ?? data.bankColor }}>
                  {(typedRecipient?.merchantName ?? (bkCheck === 'ok' ? 'ABA Account Holder' : bkCheck === 'missing' ? '' : toAccount.replace(/\s+/g, '') === (data.accountNumber || '').replace(/\s+/g, '') ? data.merchantName : 'ABA Account Holder')).split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                </span>
                <div className="flex-1 min-w-0">
                  {typedRecipient ? (
                    <>
                      <p className="text-[14px] font-extrabold text-gray-900 truncate">{typedRecipient.merchantName}</p>
                      <p className="text-[11px] text-gray-400 font-semibold truncate">{toAccount || typedRecipient.bakongId}</p>
                    </>
                  ) : bkCheck === 'ok' ? (
                    <>
                      <p className="text-[14px] font-extrabold text-gray-900 truncate">ABA Account Holder</p>
                      <p className="text-[11px] text-gray-400 font-semibold truncate">{toAccount}</p>
                    </>
                  ) : bkCheck === 'missing' ? (
                    <>
                      <p className="text-[14px] font-extrabold text-[#E8002D] truncate">账户不存在</p>
                      <p className="text-[11px] text-gray-400 font-semibold truncate">{toAccount}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[14px] font-extrabold text-gray-900 truncate">
                        {toAccount.replace(/\s+/g, '') === (data.accountNumber || '').replace(/\s+/g, '') ? data.merchantName : 'ABA Account Holder'}
                      </p>
                      <p className="text-[11px] text-gray-400 font-semibold truncate">{toAccount || data.accountNumber || data.bakongId}</p>
                    </>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${payeeCurrency === 'USD' ? 'bg-[#1A1F71]/10 text-[#1A1F71]' : 'bg-[#C8102E]/10 text-[#C8102E]'}`}>{payeeCurrency}</span>
                {bkCheck === 'checking' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-gray-100 text-gray-500">验证中…</span>
                )}
                {bkCheck === 'ok' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-[#00A67E]/10 text-[#00A67E]">✓ 已验证</span>
                )}
                {bkCheck === 'missing' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-[#E8002D]/10 text-[#E8002D]">账户不存在</span>
                )}
                {bkCheck === 'offline' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-gray-100 text-gray-500">离线校验</span>
                )}
              </div>

              {/* Amount */}
              <div className="mt-3 bg-white rounded-2xl px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ចំនួនទឹកប្រាក់</p>
                  <button
                    type="button"
                    onClick={() => { setPayeeCur(p => (p === 'USD' ? 'KHR' : 'USD')); setAmount(''); setError(''); }}
                    aria-label={`切换支付币种为 ${payeeCurrency === 'USD' ? 'KHR' : 'USD'}`}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full border text-[12px] font-bold active:scale-95 transition-all ${payeeCurrency === 'USD' ? 'border-[#1A1F71] text-[#1A1F71]' : 'border-[#C8102E] text-[#C8102E]'}`}
                  >
                    {payeeCurrency}
                    <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="flex items-end justify-center gap-1 min-h-[52px]">
                  <span className="text-[40px] font-extrabold text-gray-900 leading-none tracking-tight">{formatted()}</span>
                </div>

                {/* FX conversion — convert the payee/order amount into the
                    selected account currency (e.g. 28,800 KHR order → ≈ $7.11 USD) */}
                {!!amount && parseFloat(amount) > 0 && currency !== payeeCurrency && (
                  <div className="mt-2 text-center">
                    <p className="text-[12px] font-bold text-[#00A67E]">
                      ≈ {currency === 'USD'
                        ? `$${(parseFloat(amount) / EXCHANGE_RATE).toFixed(2)}`
                        : `${(parseFloat(amount) * EXCHANGE_RATE).toLocaleString('en-US')} ៛`}
                      <span className="text-[10.5px] text-gray-400 font-semibold ml-1.5">
                        {currency === 'USD' ? '等值美金' : '等值KHR'}（1 USD = 4,050 KHR）
                      </span>
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-[11px] text-[#E8002D] font-semibold text-center mt-2">{error}</p>
                )}

              </div>

              {/* Note */}
              <div className="mt-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <p className="text-[11px] font-bold text-gray-400">ចំណាំ (មិនដាក់ក៏បាន)</p>
                <input
                  ref={noteRef}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="បញ្ចូលកំណត់ចំណាំ..."
                  className="mt-1 w-full text-[14px] font-semibold text-gray-800 placeholder-gray-300 bg-transparent outline-none"
                />
              </div>

              {/* Save template toggle */}
              <div className="mt-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-between">
                <p className="text-[13.5px] font-bold text-gray-800 leading-snug">បង្កើត គំរូទូទាត់ប្រចាំ</p>
                <button
                  onClick={() => setSaveTemplate(s => !s)}
                  aria-label="Toggle save template"
                  className={`w-12 h-7 rounded-full transition-colors relative ${saveTemplate ? 'bg-[#00A67E]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${saveTemplate ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Numpad */}
              <div className="mt-3 bg-white rounded-2xl px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <NumPad onKey={handleKey} />
              </div>

              {/* Transfer button (grey until amount entered) */}
              <div className="mt-3 mb-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirm}
                  disabled={!amount}
                  className={`w-full py-4 rounded-2xl font-extrabold text-[16px] transition-colors ${
                    amount ? 'bg-[#E8002D] text-white shadow-[0_4px_16px_rgba(232,0,45,0.3)]' : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  ផ្ទេរ
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* ── Payment PIN verification ── */}
        <AnimatePresence>
          {pinStep && data && (
            <PinScreen
              amount={deductAmount}
              currency={currency}
              onPin={handlePin}
              onCancel={() => { setPinStep(false); setPinStatus('idle'); setPinError(''); }}
              status={pinStatus}
              error={pinError}
              shake={shake}
            />
          )}
        </AnimatePresence>

        {/* ── Live Bakong payment (waiting for confirmation in Bakong app) ── */}
        <AnimatePresence>
          {livePay && data && (            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center px-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-[#00A67E]/10 flex items-center justify-center mb-5"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                  <circle cx="12" cy="12" r="9" fill="#00A67E" opacity="0.15" />
                  <polygon points="12,5 17,12 12,19 7,12" fill="#00A67E" opacity="0.7" />
                  <circle cx="12" cy="12" r="3" fill="#00A67E" />
                </svg>
              </motion.div>

              <p className="text-[17px] font-extrabold text-gray-900">在 Bakong 完成支付</p>
              <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">
                付款已通过 Bakong API 发起，请在 Bakong / ABA 应用中确认{' '}
                <span className="font-bold text-gray-900">
                  {currency === 'KHR'
                    ? Number(amount).toLocaleString() + ' ៛'
                    : '$' + Number(amount).toFixed(2)}
                </span>{' '}
                的转账
              </p>

              {livePay.paymentUrl && (
                <a
                  href={livePay.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 w-full py-3.5 rounded-xl bg-[#00A67E] text-white font-bold text-[14px] text-center shadow-[0_4px_12px_rgba(0,166,126,0.3)]"
                >
                  打开 Bakong 完成支付
                </a>
              )}

              <p className="text-[11px] text-gray-400 mt-5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00A67E] animate-pulse" />
                等待支付确认…（支付完成后自动返回）
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ABA PayWay payment (real gateway) ── */}
        <AnimatePresence>
          {(pwPay || pwError) && data && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center px-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-[#E8002D]/10 flex items-center justify-center mb-5"
              >
                <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none">
                  <rect x="3" y="4.5" width="18" height="15" rx="2.5" fill="#E8002D" opacity="0.92" />
                  <path d="M3 9.5h18" stroke="#fff" strokeWidth="1.6" />
                  <circle cx="16.5" cy="15" r="2.2" fill="#fff" />
                  <path d="M6.5 13.5l3 3 4.5-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>

              {pwError && !pwPay ? (
                <>
                  <p className="text-[17px] font-extrabold text-gray-900">ABA PayWay 支付发起失败</p>
                  <p className="text-[12px] text-[#E8002D] mt-2 leading-relaxed">{pwError}</p>
                  <div className="w-full mt-6 space-y-3">
                    <motion.button
                      whileTap={{ scale: 0.97 }} onClick={() => commitLocal()}
                      className="w-full py-3.5 rounded-xl bg-[#E8002D] text-white font-bold text-[14px] shadow-[0_4px_12px_rgba(232,0,45,0.3)]"
                    >
                      继续本地演示
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setPwError(''); setPinStep(false); }}
                      className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-[14px]"
                    >
                      关闭
                    </motion.button>
                  </div>
                </>
              ) : pwPay ? (
                <>
                  <p className="text-[17px] font-extrabold text-gray-900">在 ABA PayWay 完成支付</p>
                  <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">
                    付款已通过 ABA PayWay 发起，请在打开的支付页完成{' '}
                    <span className="font-bold text-gray-900">
                      {currency === 'KHR'
                        ? Number(amount).toLocaleString() + ' ៛'
                        : '$' + Number(amount).toFixed(2)}
                    </span>{' '}
                    的支付
                  </p>

                  {pwPay.mode === 'form' && pwPay.url && pwPay.fields && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => submitPayWayForm(pwPay.url!, pwPay.fields!)}
                      className="mt-6 w-full py-3.5 rounded-xl bg-[#E8002D] text-white font-bold text-[14px] text-center shadow-[0_4px_12px_rgba(232,0,45,0.3)]"
                    >
                      打开 ABA PayWay 支付页
                    </motion.button>
                  )}
                  {pwPay.mode === 'deeplink' && pwPay.data?.abapay_deeplink && (
                    <a
                      href={pwPay.data.abapay_deeplink}
                      target="_blank" rel="noreferrer"
                      className="mt-6 w-full py-3.5 rounded-xl bg-[#E8002D] text-white font-bold text-[14px] text-center shadow-[0_4px_12px_rgba(232,0,45,0.3)]"
                    >
                      在 ABA App 中完成支付
                    </a>
                  )}

                  <p className={`text-[11px] mt-5 flex items-center gap-1.5 ${pwPay.status === 'failed' ? 'text-[#E8002D]' : 'text-gray-400'}`}>
                    {pwError ? pwError : (
                      <>
                        <span className={`w-2 h-2 rounded-full animate-pulse ${pwPay.status === 'failed' ? 'bg-[#E8002D]' : 'bg-[#E8002D]'}`} />
                        等待支付确认…（支付完成后自动返回）
                      </>
                    )}
                  </p>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { if (pwPay.tranId) startPwPoll(pwPay.tranId); }}
                    className="mt-4 w-full py-3 rounded-xl border border-[#E8002D]/30 text-[#E8002D] font-bold text-[13px]"
                  >
                    我已完成支付
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }} onClick={() => commitLocal()}
                    className="mt-2 w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-bold text-[13px]"
                  >
                    跳过，本地演示
                  </motion.button>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Success overlay ── */}
        <AnimatePresence>
          {success && (
            <SuccessScreen
              data={payeeData ?? data}
              amount={deductAmount}
              currency={currency}
              payeeAmount={payeeAmount}
              payeeCurrency={payeeCurrency}
              isBakong={(payeeData ?? data).bankCode !== 'ababank'}
              onDone={() => setLocation('/')}
              onRepeat={() => { setSuccess(false); setAmount(''); }}
              onViewHistory={() => setLocation(`/accounts/${selectedAccount.id}`)}
              fromAccount={selectedAccount}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
