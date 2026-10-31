import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, QrCode, BarChart2, MoreVertical, ChevronDown, Store, FileText, Eye, EyeOff } from 'lucide-react';
import { useLocation, useParams } from 'wouter';
import { accounts } from '../data/accounts';
import { getDynamicTxns, todayStatementDate } from '../lib/txnStore';
import { getBalance } from '../lib/balanceStore';

const accountData = Object.fromEntries(
  accounts.map((a) => [a.id, { id: a.id, name: a.name, number: a.number, balance: a.balance ?? null, currency: a.currency, card: a.card, color: a.color }])
);

type AvatarKind = 'khqr' | 'store' | 'initials' | 'document';
type BadgeKind = 'check' | 'question' | null;

type Transaction = {
  id: number | string;
  name: string;
  amount: string;
  currency?: 'USD' | 'KHR';
  type: 'debit' | 'credit';
  avatarKind: AvatarKind;
  initials?: string;
  avatarColor?: string;
  badge?: BadgeKind;
};

type DateGroup = { date: string; items: Transaction[] };

/* ── Static statement data by date (USD) ── */
const usdByDate: DateGroup[] = [
  { date: '31 តុលា 2026', items: [
    { id: 1, name: 'LEAH SEAN', amount: '+161.89', type: 'credit', avatarKind: 'initials', initials: 'LS', avatarColor: '#2563EB', badge: 'check' },
  ] },
  { date: '30 តុលា 2026', items: [
    { id: 2, name: 'Foodpanda', amount: '-230.84', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 3, name: 'KH GAME TOPUP 54', amount: '-16.46', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 4, name: 'Bakong Transfer', amount: '+1659.50', type: 'credit', avatarKind: 'initials', initials: 'BT', avatarColor: '#2563EB', badge: 'check' },
  ] },
  { date: '29 តុលា 2026', items: [
    { id: 5, name: 'CHAN VEASNA', amount: '+4918.85', type: 'credit', avatarKind: 'initials', initials: 'CV', avatarColor: '#2563EB', badge: 'check' },
    { id: 6, name: 'Lucky Supermarket', amount: '-72.57', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '28 តុលា 2026', items: [
    { id: 7, name: 'AEON Mall', amount: '-8.37', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 8, name: 'WING BANK', amount: '+86.11', type: 'credit', avatarKind: 'initials', initials: 'WB', avatarColor: '#2563EB', badge: 'check' },
  ] },
  { date: '27 តុលា 2026', items: [
    { id: 9, name: 'TELA Telecom', amount: '-165.72', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '26 តុលា 2026', items: [
    { id: 10, name: 'NOCH PANHA', amount: '+4623.43', type: 'credit', avatarKind: 'initials', initials: 'NP', avatarColor: '#2563EB', badge: 'check' },
  ] },
  { date: '25 តុលា 2026', items: [
    { id: 11, name: 'Grab Cambodia', amount: '-10.44', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 12, name: 'Grab Cambodia', amount: '-48.76', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '24 តុលា 2026', items: [
    { id: 13, name: 'Visa Annual Fee', amount: '-133.18', type: 'debit', avatarKind: 'initials', initials: 'VA', avatarColor: '#7C3AED', badge: 'question' },
    { id: 14, name: 'Metfone Internet', amount: '-92.31', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 15, name: 'CFE អគ្គិសនី', amount: '-13.59', type: 'debit', avatarKind: 'initials', initials: 'Cអ', avatarColor: '#7C3AED', badge: 'question' },
    { id: 16, name: 'Cambodia Post', amount: '-175.91', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '22 តុលា 2026', items: [
    { id: 17, name: 'AM MAHEDY', amount: '-191.95', type: 'debit', avatarKind: 'initials', initials: 'AM', avatarColor: '#7C3AED', badge: 'question' },
    { id: 18, name: 'PHONG SREYNET', amount: '+109.28', type: 'credit', avatarKind: 'initials', initials: 'PS', avatarColor: '#2563EB', badge: 'check' },
  ] },
  { date: '21 តុលា 2026', items: [
    { id: 19, name: 'PHONE RECHARGE', amount: '-280.82', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '19 តុលា 2026', items: [
    { id: 20, name: 'TELA Telecom', amount: '-171.65', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 21, name: 'SOK KIMHENG', amount: '+2758.13', type: 'credit', avatarKind: 'initials', initials: 'SK', avatarColor: '#2563EB', badge: 'check' },
    { id: 22, name: 'LEAH SEAN', amount: '+1859.32', type: 'credit', avatarKind: 'initials', initials: 'LS', avatarColor: '#2563EB', badge: 'check' },
    { id: 23, name: 'RUN SOHENG', amount: '-8.99', type: 'debit', avatarKind: 'initials', initials: 'RS', avatarColor: '#7C3AED', badge: 'check' },
  ] },
  { date: '17 តុលា 2026', items: [
    { id: 24, name: 'Foodpanda', amount: '-43.25', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 25, name: 'Nisai Media', amount: '-35.87', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '16 តុលា 2026', items: [
    { id: 26, name: 'MENG HOUR', amount: '+1653.16', type: 'credit', avatarKind: 'initials', initials: 'MH', avatarColor: '#2563EB', badge: 'check' },
  ] },
  { date: '14 តុលា 2026', items: [
    { id: 27, name: 'Nisai Media', amount: '-239.69', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '13 តុលា 2026', items: [
    { id: 28, name: 'Makro Cambodia', amount: '-21.64', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 29, name: 'MENG HOUR', amount: '+2720.37', type: 'credit', avatarKind: 'initials', initials: 'MH', avatarColor: '#2563EB', badge: 'check' },
    { id: 30, name: 'Wing Cash In', amount: '+1772.10', type: 'credit', avatarKind: 'initials', initials: 'WC', avatarColor: '#2563EB', badge: 'check' },
  ] },
  { date: '12 តុលា 2026', items: [
    { id: 31, name: 'PHONE RECHARGE', amount: '-13.29', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 32, name: 'WING BANK', amount: '+225.74', type: 'credit', avatarKind: 'initials', initials: 'WB', avatarColor: '#2563EB', badge: 'check' },
  ] },
  { date: '10 តុលា 2026', items: [
    { id: 33, name: 'AM MAHEDY', amount: '-14.72', type: 'debit', avatarKind: 'initials', initials: 'AM', avatarColor: '#7C3AED', badge: 'question' },
  ] },
  { date: '8 តុលា 2026', items: [
    { id: 34, name: 'RUN SOHENG', amount: '-182.26', type: 'debit', avatarKind: 'initials', initials: 'RS', avatarColor: '#7C3AED', badge: 'check' },
    { id: 35, name: 'Prince Supermarket', amount: '-135.76', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 36, name: 'THIDA SOK', amount: '+1496.11', type: 'credit', avatarKind: 'initials', initials: 'TS', avatarColor: '#2563EB', badge: 'check' },
  ] },
  { date: '7 តុលា 2026', items: [
    { id: 37, name: 'Makro Cambodia', amount: '-462.94', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '6 តុលា 2026', items: [
    { id: 38, name: 'Caltex Cambodia', amount: '-448.96', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 39, name: 'ABA Bank Fee', amount: '-83.09', type: 'debit', avatarKind: 'khqr', avatarColor: '#E8002D',  },
    { id: 40, name: 'TELA Telecom', amount: '-172.35', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '5 តុលា 2026', items: [
    { id: 41, name: 'PassApp Taxi', amount: '-117.87', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '4 តុលា 2026', items: [
    { id: 42, name: 'Starbucks Cambodia', amount: '-52.07', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
    { id: 43, name: 'Nisai Media', amount: '-10.21', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '3 តុលា 2026', items: [
    { id: 44, name: 'VATTANAC BANK', amount: '+95.21', type: 'credit', avatarKind: 'initials', initials: 'VB', avatarColor: '#2563EB', badge: 'check' },
    { id: 45, name: 'SALARY BONUS', amount: '+61184.44', type: 'credit', avatarKind: 'initials', initials: 'SB', avatarColor: '#2563EB', badge: 'check' },
  ] },
  { date: '2 តុលា 2026', items: [
    { id: 46, name: 'PassApp Taxi', amount: '-22.18', type: 'debit', avatarKind: 'store', avatarColor: '#1E3A8A',  },
  ] },
  { date: '1 តុលា 2026', items: [
    { id: 47, name: 'ABA Bank Fee', amount: '-422.91', type: 'debit', avatarKind: 'khqr', avatarColor: '#E8002D',  },
    { id: 48, name: 'ACLEDA Bank Transfer', amount: '+575.74', type: 'credit', avatarKind: 'initials', initials: 'AB', avatarColor: '#2563EB', badge: 'check' },
  ] },
];

/* ── Static statement data by date (KHR) ── */
const khrByDate: DateGroup[] = [
  {
    date: '11 តុលា 2026',
    items: [
      { id: 101, name: 'EDC អគ្គិសនីកម្ពុជា', amount: '-30,000', currency: 'KHR', type: 'debit', avatarKind: 'store', avatarColor: '#F59E0B' },
      { id: 102, name: 'qiang (internal)', amount: '+81,000', currency: 'KHR', type: 'credit', avatarKind: 'initials', initials: 'QH', avatarColor: '#1A7AFF', badge: 'check' },
    ],
  },
  {
    date: '10 តុលា 2026',
    items: [
      { id: 103, name: 'TELA Telecom', amount: '-20,000', currency: 'KHR', type: 'debit', avatarKind: 'store', avatarColor: '#8B5CF6' },
      { id: 104, name: 'Salary (ACLEDA)', amount: '+500,000', currency: 'KHR', type: 'credit', avatarKind: 'initials', initials: 'SA', avatarColor: '#00A67E', badge: 'check' },
    ],
  },
  {
    date: '09 តុលា 2026',
    items: [
      { id: 105, name: 'Bakong Transfer', amount: '-40,000', currency: 'KHR', type: 'debit', avatarKind: 'khqr', avatarColor: '#E8002D' },
    ],
  },
  {
    date: '08 តុលា 2026',
    items: [
      { id: 106, name: 'CFE អគ្គិសនី', amount: '-15,000', currency: 'KHR', type: 'debit', avatarKind: 'store', avatarColor: '#0EA5E9' },
      { id: 107, name: 'Wing Cash In', amount: '+100,000', currency: 'KHR', type: 'credit', avatarKind: 'initials', initials: 'WC', avatarColor: '#F59E0B', badge: 'check' },
    ],
  },
];

/* ── Avatar components ── */
const KHQRAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-[#E8002D] flex items-center justify-center shrink-0">
    <span className="text-white text-[9px] font-extrabold tracking-tight">KHQR</span>
  </div>
);

const StoreAvatar = ({ color }: { color: string }) => (
  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
    <Store className="w-5 h-5 text-white" strokeWidth={1.8} />
  </div>
);

const DocumentAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
    <FileText className="w-5 h-5 text-gray-400" strokeWidth={1.8} />
  </div>
);

const InitialsAvatar = ({ initials, color, badge }: { initials: string; color: string; badge?: BadgeKind }) => (
  <div className="relative shrink-0">
    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
      <span className="text-white text-[13px] font-extrabold">{initials}</span>
    </div>
    {badge === 'check' && (
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#16A34A] flex items-center justify-center border-2 border-white">
        <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
          <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )}
    {badge === 'question' && (
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E8002D] flex items-center justify-center border-2 border-white">
        <span className="text-white text-[9px] font-extrabold">?</span>
      </div>
    )}
  </div>
);

const TxAvatar = ({ tx }: { tx: Transaction }) => {
  switch (tx.avatarKind) {
    case 'khqr': return <KHQRAvatar />;
    case 'store': return <StoreAvatar color={tx.avatarColor || '#1E3A8A'} />;
    case 'document': return <DocumentAvatar />;
    case 'initials':
    default:
      return <InitialsAvatar initials={tx.initials || '??'} color={tx.avatarColor || '#6B7280'} badge={tx.badge} />;
  }
};

/* ── Normalize dynamic txns into the Transaction shape ── */
function normalizeDynamic(raw: any): Transaction {
  const name = raw.name || raw.recipient || 'Transfer';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() || '')
    .join('');
  return {
    id: raw.id ?? `dyn-${Date.now()}`,
    name,
    amount: raw.amount ?? '0.00',
    currency: raw.currency ?? 'USD',
    type: raw.type ?? (String(raw.amount).startsWith('-') ? 'debit' : 'credit'),
    avatarKind: 'initials',
    initials: initials || 'TX',
    avatarColor: raw.type === 'credit' ? '#16A34A' : '#2563EB',
    badge: 'check',
  };
}

export default function AccountDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const account = accountData[params.id] ?? accountData['1'];
  const [showAll, setShowAll] = useState(false);
  const [hideTxns, setHideTxns] = useState(true); // transaction records hidden by default

  const staticGroups = account.currency === 'KHR' ? khrByDate : usdByDate;
  const visibleGroups = showAll ? staticGroups : staticGroups.slice(0, 2);
  const hasMore = staticGroups.length > 2;
  const rawDynamic = getDynamicTxns().filter(
    (t) => (t.currency ?? 'USD') === (account.currency ?? 'USD')
  );
  const dynamicTxns: Transaction[] = rawDynamic.map(normalizeDynamic);

  const todayKhmer = todayStatementDate(); // fallback; we use Khmer date labels

  const renderRow = (tx: Transaction, index: number, keyPrefix: string) => (
    <motion.button
      key={`${keyPrefix}-${tx.id}`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setLocation(`/accounts/${params.id}/tx/${tx.id}`)}
      className="flex items-center gap-3.5 py-3.5 w-full text-left border-b border-gray-50 last:border-b-0"
    >
      <TxAvatar tx={tx} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-gray-900 truncate">{hideTxns ? '••••••••••' : tx.name}</p>
      </div>
      <div className="text-right shrink-0">
        <span className={`text-[15px] font-extrabold ${tx.type === 'debit' ? 'text-[#E8002D]' : 'text-[#16A34A]'}`}>
          {hideTxns ? '••••' : tx.amount}
        </span>
        <span className="text-[10px] font-bold text-gray-400 ml-1">{tx.currency === 'KHR' ? 'KHR' : 'USD'}</span>
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-[100dvh] md:h-screen md:min-h-screen bg-gray-200 flex items-center justify-center md:p-4 font-sans select-none">
      <div className="w-full h-full md:max-w-[390px] md:h-[844px] bg-white md:rounded-[2.5rem] shadow-2xl relative overflow-hidden md:border-[8px] border-black flex flex-col">

        {/* ── Header: account name + number/balance + icons ── */}
        <div className="relative z-20 px-4 pt-12 pb-3 flex items-center gap-3 bg-white">
          <button onClick={() => setLocation('/accounts')} className="text-gray-800 hover:text-gray-900 transition-colors shrink-0">
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-extrabold text-gray-900 leading-tight truncate">{account.name}</p>
            <p className="text-[12px] text-gray-500 font-semibold leading-tight">
              {account.number} <span className="mx-1">|</span> {getBalance(account.id, account.balance)} {account.currency}
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button className="text-gray-700 hover:text-gray-900 transition-colors">
              <QrCode className="w-5 h-5" strokeWidth={2} />
            </button>
            <button className="text-gray-700 hover:text-gray-900 transition-colors">
              <BarChart2 className="w-5 h-5" strokeWidth={2} />
            </button>
            <button className="text-gray-700 hover:text-gray-900 transition-colors">
              <MoreVertical className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Filter strip: pending transactions ── */}
        <div className="relative z-10 px-4 pb-2">
          <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#FDECEC] hover:bg-[#FBDADA] transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-800">ប្រតិបត្តិការបង្កទុក</span>
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#E8002D] text-white text-[11px] font-extrabold flex items-center justify-center">3</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Transaction list ── */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Hide/show transaction records toggle (hidden by default) */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <p className="text-[13px] font-bold text-gray-500">ប្រវត្តិប្រតិបត្តិការ · Transactions</p>
            <button
              onClick={() => setHideTxns(!hideTxns)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
              aria-label={hideTxns ? 'បង្ហាញប្រវត្តិ' : 'លាក់ប្រវត្តិ'}
            >
              {hideTxns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Dynamic txns (today) */}
          {dynamicTxns.length > 0 && (
            <div className="px-5 pt-3 pb-1">
              <p className="text-[12px] font-bold text-gray-400">{todayKhmer}</p>
            </div>
          )}
          {dynamicTxns.length > 0 && (
            <div className="px-4">
              {dynamicTxns.map((tx, i) => renderRow(tx, i, 'dyn'))}
            </div>
          )}

          {/* Static grouped by date */}
          {visibleGroups.map((group) => (
            <div key={group.date}>
              <div className="px-5 pt-4 pb-1">
                <p className="text-[12px] font-bold text-gray-400">{group.date}</p>
              </div>
              <div className="px-4">
                {group.items.map((tx, i) => renderRow(tx, i, 'ref'))}
              </div>
            </div>
          ))}

          <div className="h-6" />
        </div>

        {/* ── Bottom: Show more (only when more groups exist) ── */}
        {hasMore && !showAll && (
          <div className="relative z-20 px-4 pb-6 pt-2 bg-white">
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-3.5 rounded-2xl bg-[#E8002D] hover:bg-[#D00028] transition-colors text-white text-[15px] font-extrabold shadow-lg"
            >
              បង្ហាញបន្ថែម
            </button>
          </div>
        )}
        {showAll && <div className="h-6" />}
      </div>
    </div>
  );
}
