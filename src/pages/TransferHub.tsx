import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft, ArrowRightLeft, Send, Landmark, Wallet, AtSign, Globe,
  CreditCard, Banknote, User, ChevronRight,
} from 'lucide-react';
import { getPendingTransfer } from '@/lib/transferState';

/* ─── Cambodia temple watermark ────────────────────────────────────────────── */
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

const localCards: { icon: React.ReactNode; bg: string; title: string; sub: string }[] = [
  {
    icon: <ArrowRightLeft className="w-6 h-6 text-white" strokeWidth={2.1} />, bg: '#2E6FD8',
    title: 'គណនីផ្ទាល់ខ្លួន',
    sub: 'ផ្ទេរប្រាក់ទៅគណនី ABA ខ្លួនឯង',
  },
  {
    icon: <Landmark className="w-6 h-6 text-white" strokeWidth={2.1} />, bg: '#E8002D',
    title: 'គណនី ABA ណាមួយ',
    sub: 'ផ្ទេរប្រាក់ទៅគណនី ABA ណាមួយ',
  },
  {
    icon: <Wallet className="w-6 h-6 text-white" strokeWidth={2.1} />, bg: '#7B4FE8',
    title: 'ធនាគារ និង Wallet',
    sub: 'ផ្ទេរប្រាក់ទៅធនាគារ និង Wallet ក្នុងស្រុក',
  },
  {
    icon: <AtSign className="w-6 h-6 text-white" strokeWidth={2.1} />, bg: '#00A67E',
    title: 'E CASH',
    sub: 'ផ្ទេរប្រាក់តាមលេខកូដដើម្បីដកពីម៉ាស៊ីន ATM របស់ ABA',
  },
];

const intlRows: { icon: React.ReactNode; label: string; sub: string; brand?: string }[] = [
  { icon: <Globe className="w-5 h-5 text-[#2E6FD8]" strokeWidth={2.1} />, label: 'SWIFT', sub: 'សេវាផ្ទេរប្រាក់ឆ្លងប្រទេស' },
  { icon: <Send className="w-5 h-5 text-[#E8002D]" strokeWidth={2.1} />, label: 'Western Union', sub: 'ផ្ទេរ/ទទួលប្រាក់' },
  { icon: <Banknote className="w-5 h-5 text-[#F59E0B]" strokeWidth={2.1} />, label: 'Ria', sub: 'សេវាផ្ទេរ/ទទួលប្រាក់ Ria' },
  { icon: <Globe className="w-5 h-5 text-[#16A34A]" strokeWidth={2.1} />, label: 'DBP Remittance', sub: 'ផ្ទេរប្រាក់' },
  { icon: <Send className="w-5 h-5 text-[#7B4FE8]" strokeWidth={2.1} />, label: 'MoneyGram', sub: 'សេវាផ្ទេរ/ទទួលប្រាក់ MoneyGram' },
];

const cardRows: { icon: React.ReactNode; label: string; brand?: string }[] = [
  { icon: <CreditCard className="w-5 h-5 text-[#1A1F71]" strokeWidth={2.1} />, label: 'Visa Direct' },
  { icon: <CreditCard className="w-5 h-5 text-[#E8002D]" strokeWidth={2.1} />, label: 'UnionPay' },
  { icon: <CreditCard className="w-5 h-5 text-[#F97316]" strokeWidth={2.1} />, label: 'Mastercard Send' },
];

const favorites = [
  { initials: '赵', name: '赵青', bg: '#2E6FD8' },
  { initials: 'I', name: 'ICBC', bg: '#E8002D' },
  { initials: 'D', name: 'D', bg: '#7B4FE8' },
];

export default function TransferHub() {
  const [, setLocation] = useLocation();

  // A scan flow landed here with a pending recipient → jump straight into the form.
  useEffect(() => {
    const pending = getPendingTransfer();
    if (pending) setLocation('/transfer/send');
  }, [setLocation]);

  return (
    <div className="min-h-[100dvh] bg-[#F5F5F7] font-sans flex flex-col overflow-y-auto">
      <TemplePattern />

      {/* Header */}
      <div className="relative px-4 pt-12 pb-3">
        <button onClick={() => setLocation('/')} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-800">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <p className="mt-3 text-[19px] font-extrabold text-gray-900 tracking-tight">ABA ផ្ទេរប្រាក់</p>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12px] text-gray-500 font-medium leading-relaxed mt-1">
            ផ្ទេរប្រាក់ទៅមិត្តភក្តិ និងក្រុមគ្រួសារ ជាមួយជំហានងាយៗ
          </p>
          <button className="shrink-0 mt-1 w-11 h-11 rounded-full bg-[#E8F0FF] text-[#2E6FD8] flex items-center justify-center shadow-sm">
            <ArrowRightLeft className="w-6 h-6" strokeWidth={2.3} />
          </button>
        </div>
      </div>

      <div className="relative px-4 flex flex-col flex-1 pb-10">
        {/* Frequent recipients */}
        <p className="text-[13px] font-bold text-gray-700 mb-2">គំរូទូទាត់ប្រចាំ</p>
        <div className="grid grid-cols-4 gap-2.5">
          {favorites.map((f) => (
            <button key={f.name} className="rounded-2xl bg-white shadow-sm py-3 flex flex-col items-center gap-1.5 active:scale-[0.96] transition-transform">
              <span className="w-11 h-11 rounded-full text-white text-[14px] font-extrabold flex items-center justify-center" style={{ background: f.bg }}>
                {f.initials}
              </span>
              <span className="text-[10.5px] font-bold text-gray-700 truncate max-w-full px-1">{f.name}</span>
            </button>
          ))}
          <button className="rounded-2xl bg-white shadow-sm py-3 flex flex-col items-center gap-1.5 active:scale-[0.96] transition-transform">
            <span className="w-11 h-11 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
              <ChevronRight className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <span className="text-[10.5px] font-bold text-gray-500">ទាំងអស់</span>
          </button>
        </div>

        {/* Domestic transfers */}
        <p className="mt-5 text-[13px] font-bold text-gray-700 mb-2">ផ្ទេរប្រាក់ក្នុងស្រុក</p>
        <div className="grid grid-cols-2 gap-3">
          {localCards.map((c, i) => (
            <button
              key={c.title}
              onClick={() => {
                if (i >= 3) return;
                // internal ABA-to-ABA (no QR, account only) vs inter-bank (KHQR)
                sessionStorage.setItem('aba.tf.mode', i < 2 ? 'internal' : 'cross');
                setLocation('/transfer/send');
              }}
              className="rounded-3xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] p-4 flex flex-col items-start gap-2.5 text-left active:scale-[0.98] transition-transform min-h-[128px]"
            >
              <span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: c.bg }}>{c.icon}</span>
              <span className="text-[13.5px] font-extrabold text-gray-900 leading-tight">{c.title}</span>
              <span className="text-[10.5px] text-gray-500 leading-snug">{c.sub}</span>
            </button>
          ))}
        </div>

        {/* eMoney KHQR pay-entry */}
        <button
          onClick={() => setLocation('/emoney/pay')}
          className="mt-5 w-full rounded-3xl bg-gradient-to-r from-[#F97316] to-[#E8002D] shadow-[0_6px_18px_rgba(232,0,45,0.25)] px-5 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <span className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
            <AtSign className="w-6 h-6" strokeWidth={2.2} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-extrabold text-white">eMoney · KHQR ទទួលប្រាក់</span>
            <span className="block text-[11px] text-white/85 mt-0.5">LY KIM ENG · 0966279599 · 等待支付</span>
          </span>
          <ChevronRight className="w-5 h-5 text-white/80 shrink-0" strokeWidth={2.4} />
        </button>

        {/* ABA API incoming entry */}
        <button
          onClick={() => setLocation('/incoming')}
          className="mt-3 w-full rounded-3xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <span className="w-11 h-11 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6" strokeWidth={2.1} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-extrabold text-gray-900">ABA API ទទួលប្រាក់</span>
            <span className="block text-[11px] text-gray-500 mt-0.5">PayWay Incoming · 入账流水（对账/交易查询）</span>
          </span>
          <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" strokeWidth={2.4} />
        </button>

        {/* All Cambodia banks entry */}
        <button
          onClick={() => setLocation('/banks')}
          className="mt-3 w-full rounded-3xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <span className="w-11 h-11 rounded-2xl bg-[#2E6FD8]/10 text-[#2E6FD8] flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6" strokeWidth={2.1} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-extrabold text-gray-900">ធនាគារទាំងអស់</span>
            <span className="block text-[11px] text-gray-500 mt-0.5">All Banks in Cambodia · 柬埔寨全部银行 logo</span>
          </span>
          <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" strokeWidth={2.4} />
        </button>

        {/* International transfers */}
        <p className="mt-5 text-[13px] font-bold text-gray-700 mb-2">ផ្ទេរប្រាក់ទៅក្រៅប្រទេស</p>
        <div className="rounded-3xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-5 py-2 divide-y divide-gray-100">
          {intlRows.map((r) => (
            <button key={r.label} className="w-full py-3.5 flex items-center gap-4 text-left active:bg-gray-50 transition-colors">
              <span className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">{r.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-bold text-gray-900">{r.label}</span>
                <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug truncate">{r.sub}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={2.2} />
            </button>
          ))}
        </div>

        {/* Card transfers */}
        <p className="mt-5 text-[13px] font-bold text-gray-700 mb-2">ផ្ទេរទៅកាន់កាត</p>
        <div className="rounded-3xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-5 py-2 divide-y divide-gray-100">
          {cardRows.map((r) => (
            <button key={r.label} className="w-full py-3.5 flex items-center gap-4 text-left active:bg-gray-50 transition-colors">
              <span className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">{r.icon}</span>
              <span className="flex-1 text-[14px] font-bold text-gray-900">{r.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={2.2} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
