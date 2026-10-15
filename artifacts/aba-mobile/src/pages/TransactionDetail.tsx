import React from 'react';
import { motion } from 'framer-motion';
import { Check, Share2, Download, MessageCircle, Clock, Upload } from 'lucide-react';
import { useLocation, useParams } from 'wouter';
import { getTxnDetail } from '../lib/txnStore';

type TxStatus = { label: string; time: string };

type TxAvatar = {
  type: 'store' | 'initials' | 'khqr' | 'document';
  color: string;
  text?: string;
  badge?: 'check' | 'question' | null;
};

type TxDetail = {
  amount: string;
  currency?: 'USD' | 'KHR';
  type: 'debit' | 'credit';
  merchant: string;
  avatar?: TxAvatar;
  status?: TxStatus[];
  fields: { label: string; value: string }[];
};

/* ── Internal ABA-to-ABA transfer receipt (matches official screenshot) ── */
type InternalTpl = {
  trx: string;
  fromAccount: string;
  original: string;
  reference: string;
  sender: string;
  toAccount: string;
  date: string;
};

const internalTpl = (o: InternalTpl): { label: string; value: string }[] => [
  { label: 'លេខកូដប្រតិបត្តិការ', value: o.trx },
  { label: 'From account', value: o.fromAccount },
  { label: 'Original amount', value: o.original },
  { label: 'Reference #', value: o.reference },
  { label: 'Sender', value: o.sender },
  { label: 'To account', value: o.toAccount },
  { label: 'Transaction date', value: o.date },
];

/* ── Bakong cross-bank receipt ── */
type BakongTpl = {
  trx: string;
  hash: string;
  bank: string;
  original: string;
  reference: string;
  seller: string;
  date: string;
  tlTime: string;
};

const bakongTpl = (o: BakongTpl): Pick<TxDetail, 'status' | 'fields'> => ({
  status: [
    { label: 'Sent', time: o.tlTime },
    { label: 'Processed', time: o.tlTime },
    { label: 'Delivered', time: o.tlTime },
  ],
  fields: [
    { label: 'លេខកូដប្រតិបត្តិការ', value: o.trx },
    { label: 'Bakong hash #', value: o.hash },
    { label: 'Bank', value: o.bank },
    { label: 'From account', value: 'qiang (150 614 168)' },
    { label: 'Original amount', value: o.original },
    { label: 'Reference #', value: o.reference },
    { label: 'Seller', value: o.seller },
    { label: 'Transaction date', value: o.date },
  ],
});

/* ── Card purchase receipt ── */
type CardTpl = {
  trx: string;
  apv: string;
  khtime: string;
  card: string;
  cardholder: string;
  clearing: string;
  original: string;
  rrn: string;
  terminalLocation: string;
  terminalName: string;
};

const cardTpl = (o: CardTpl): { label: string; value: string }[] => [
  { label: 'លេខកូដប្រតិបត្តិការ', value: o.trx },
  { label: 'Authorization Code', value: o.apv },
  { label: 'Cambodia time', value: o.khtime },
  { label: 'Card#', value: o.card },
  { label: 'Cardholder', value: o.cardholder },
  { label: 'Clearing time', value: o.clearing },
  { label: 'From account', value: 'qiang (150 614 168)' },
  { label: 'Original amount', value: o.original },
  { label: 'RRN#', value: o.rrn },
  { label: 'Terminal location', value: o.terminalLocation },
  { label: 'Terminal name', value: o.terminalName },
];

const txDetails: Record<string, TxDetail> = {
  /* ── Internal ABA-to-ABA transfers (new screenshot-matched template) ── */
  '4': {
    amount: '-5.00', type: 'debit', merchant: 'KET SOKLY',
    avatar: { type: 'initials', color: '#16A34A', text: 'KS', badge: 'check' },
    fields: internalTpl({
      trx: '62810821841', fromAccount: 'qiang (150 614 168)',
      original: '5.00 USD', reference: '100FT39274468733',
      sender: 'qiang', toAccount: 'KET SOKLY (012 xxx xxx)',
      date: 'Oct 11, 2026 09:12 AM',
    }),
  },
  '5': {
    amount: '-3.00', type: 'debit', merchant: 'SEAB CHANTY',
    avatar: { type: 'initials', color: '#16A34A', text: 'SC', badge: 'check' },
    fields: internalTpl({
      trx: '62810821855', fromAccount: 'qiang (150 614 168)',
      original: '3.00 USD', reference: '100FT39274468744',
      sender: 'qiang', toAccount: 'SEAB CHANTY (096 xxx xxx)',
      date: 'Oct 11, 2026 10:30 AM',
    }),
  },
  '7': {
    amount: '-1.49', type: 'debit', merchant: 'SOM SOPHEAN',
    avatar: { type: 'initials', color: '#16A34A', text: 'SS', badge: 'check' },
    fields: internalTpl({
      trx: '62810821878', fromAccount: 'qiang (150 614 168)',
      original: '1.49 USD', reference: '100FT39274468761',
      sender: 'qiang', toAccount: 'SOM SOPHEAN (085 xxx xxx)',
      date: 'Oct 10, 2026 01:15 PM',
    }),
  },
  '9': {
    amount: '-2.00', type: 'debit', merchant: 'PHONE RECHARGE',
    avatar: { type: 'initials', color: '#DC2626', text: 'PR', badge: 'check' },
    fields: internalTpl({
      trx: '62810821902', fromAccount: 'qiang (150 614 168)',
      original: '2.00 USD', reference: '100FT39274468788',
      sender: 'qiang', toAccount: 'PHONE RECHARGE (017 xxx xxx)',
      date: 'Oct 10, 2026 03:05 PM',
    }),
  },
  '3': {
    amount: '-5.00', type: 'debit', merchant: 'LOEURM REY',
    avatar: { type: 'initials', color: '#4338CA', text: 'LP', badge: 'check' },
    fields: internalTpl({
      trx: '62810821828', fromAccount: 'qiang (150 614 168)',
      original: '5.00 USD', reference: '100FT39274468711',
      sender: 'qiang', toAccount: 'LOEURM REY (017 xxx xxx)',
      date: 'Oct 11, 2026 08:45 AM',
    }),
  },
  /* ── Received internal transfer (matches screenshot exactly) ── */
  '6': {
    amount: '+20.00', type: 'credit', merchant: 'LEAH SEAN',
    avatar: { type: 'initials', color: '#2563EB', text: 'LS', badge: 'check' },
    fields: internalTpl({
      trx: '62810821841', fromAccount: '017 530 556',
      original: '20.00 USD', reference: '100FT39274468733',
      sender: 'LEAH SEAN', toAccount: 'qiang (150614168)',
      date: 'Oct 09, 2026 07:06 AM',
    }),
  },
  /* ── Bakong cross-bank ── */
  '12': {
    amount: '-1.00', type: 'debit', merchant: 'Nisai Media',
    avatar: { type: 'khqr', color: '#E8002D', text: 'KHQR' },
    ...bakongTpl({
      trx: '58148069728', hash: 'f4ab25ae', bank: 'Pi Pay Plc.',
      original: '1.00 USD', reference: '100FT38433785322', seller: 'Nisai Media',
      date: 'Jul 25, 2026 08:14 PM', tlTime: '25 Jul | 8:14 PM',
    }),
  },
  '11': {
    amount: '-46.00', type: 'debit', merchant: 'WING BANK (KHQR)',
    avatar: { type: 'store', color: '#D97706' },
    ...bakongTpl({
      trx: '57647758955', hash: '928ef807', bank: 'Wing Bank (Cambodia) Plc',
      original: '46.00 USD', reference: '100FT38342077625', seller: 'YUKHEANG SOEU',
      date: 'Jul 17, 2026 10:43 AM', tlTime: '17 Jul | 10:43 AM',
    }),
  },
  '8': {
    amount: '+20.00', type: 'credit', merchant: 'WING BANK',
    avatar: { type: 'store', color: '#D97706' },
    ...bakongTpl({
      trx: '57661703090', hash: 'a3d91e04', bank: 'Wing Bank (Cambodia) Plc',
      original: '20.00 USD', reference: '100FT57661703090', seller: 'WING BANK',
      date: 'Jul 17, 2026 02:20 PM', tlTime: '17 Jul | 2:20 PM',
    }),
  },
  '10': {
    amount: '+5.00', type: 'credit', merchant: 'CHAN VEASNA',
    avatar: { type: 'initials', color: '#2563EB', text: 'CV', badge: 'check' },
    ...bakongTpl({
      trx: '57661703119', hash: '72c5f0b1', bank: 'ACLEDA Bank',
      original: '5.00 USD', reference: '100FT57661703119', seller: 'CHAN VEASNA',
      date: 'Jul 17, 2026 04:30 PM', tlTime: '17 Jul | 4:30 PM',
    }),
  },
  /* ── Card purchases ── */
  '1': {
    amount: '-6.06', type: 'debit', merchant: 'HUAXING BANK CO.,LTD,H',
    avatar: { type: 'store', color: '#3B82F6' },
    fields: cardTpl({
      trx: '57661702971', apv: 'APV-854303', khtime: '13-JUL-26',
      card: '623375xxxxxx4858', cardholder: 'SOEU YUKHEANG',
      clearing: 'Jul 17, 2026 03:28 PM', original: '40.20 CNY',
      rrn: '1539831065', terminalLocation: 'GUANGDONG',
      terminalName: 'HUAXING BANK CO.,LTD,H',
    }),
  },
  '2': {
    amount: '-10.00', type: 'debit', merchant: 'LAY THAVY',
    avatar: { type: 'store', color: '#1E3A8A' },
    fields: cardTpl({
      trx: '57661702984', apv: 'APV-854391', khtime: '15-JUL-26',
      card: '623375xxxxxx4858', cardholder: 'SOEU YUKHEANG',
      clearing: 'Jul 17, 2026 04:10 PM', original: '10.00 USD',
      rrn: '1539831102', terminalLocation: 'PHNOM PENH',
      terminalName: 'LAY THAVY STORE',
    }),
  },
  /* ── KHR transactions ── */
  '101': {
    amount: '-30,000', currency: 'KHR', type: 'debit', merchant: 'EDC អគ្គិសនីកម្ពុជា',
    avatar: { type: 'store', color: '#F59E0B' },
    fields: internalTpl({
      trx: '62810900101', fromAccount: 'qiang (600 980 842)',
      original: '30,000 KHR', reference: '100FT39290010101',
      sender: 'qiang', toAccount: 'EDC អគ្គិសនីកម្ពុជា',
      date: 'Oct 11, 2026 08:00 AM',
    }),
  },
  '102': {
    amount: '+81,000', currency: 'KHR', type: 'credit', merchant: 'qiang (internal)',
    avatar: { type: 'initials', color: '#1A7AFF', text: 'QH', badge: 'check' },
    fields: internalTpl({
      trx: '62810900102', fromAccount: 'qiang (150 614 168)',
      original: '81,000 KHR', reference: '100FT39290010202',
      sender: 'qiang', toAccount: 'qiang (600980842)',
      date: 'Oct 11, 2026 09:30 AM',
    }),
  },
  '103': {
    amount: '-20,000', currency: 'KHR', type: 'debit', merchant: 'TELA Telecom',
    avatar: { type: 'store', color: '#8B5CF6' },
    fields: internalTpl({
      trx: '62810900103', fromAccount: 'qiang (600 980 842)',
      original: '20,000 KHR', reference: '100FT39290010303',
      sender: 'qiang', toAccount: 'TELA Telecom',
      date: 'Oct 10, 2026 02:15 PM',
    }),
  },
  '104': {
    amount: '+500,000', currency: 'KHR', type: 'credit', merchant: 'Salary (ACLEDA)',
    avatar: { type: 'initials', color: '#00A67E', text: 'SA', badge: 'check' },
    fields: internalTpl({
      trx: '62810900104', fromAccount: 'ACLEDA Bank',
      original: '500,000 KHR', reference: '100FT39290010404',
      sender: 'Salary', toAccount: 'qiang (600980842)',
      date: 'Oct 10, 2026 10:00 AM',
    }),
  },
  '105': {
    amount: '-40,000', currency: 'KHR', type: 'debit', merchant: 'Bakong Transfer',
    avatar: { type: 'khqr', color: '#E8002D', text: 'KHQR' },
    ...bakongTpl({
      trx: '62810900105', hash: 'b7c1e3a9', bank: 'Bakong Network',
      original: '40,000 KHR', reference: '100FT39290010505', seller: 'Bakong Transfer',
      date: 'Oct 09, 2026 04:45 PM', tlTime: '09 Oct | 4:45 PM',
    }),
  },
};

const getDefault = (txId: string, accountId: string): TxDetail => ({
  amount: '0.00', type: 'debit', merchant: 'TRANSACTION',
  avatar: { type: 'initials', color: '#6B7280', text: 'TX', badge: 'check' },
  fields: internalTpl({
    trx: `628109${txId}${accountId}`,
    fromAccount: 'qiang (150 614 168)',
    original: '0.00 USD', reference: `100FT${txId}${accountId}`,
    sender: 'qiang', toAccount: 'TRANSACTION',
    date: 'Oct 11, 2026 12:00 PM',
  }),
});

/* ── Avatar components ── */
const KHQRAvatar = ({ size = 48 }: { size?: number }) => (
  <div className="rounded-full bg-[#E8002D] flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
    <span className="text-white font-extrabold tracking-tight" style={{ fontSize: size * 0.22 }}>KHQR</span>
  </div>
);

const StoreAvatar = ({ color, size = 48 }: { color: string; size?: number }) => (
  <div className="rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: color, width: size, height: size }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" style={{ width: size * 0.5, height: size * 0.5 }}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  </div>
);

const DocumentAvatar = ({ size = 48 }: { size?: number }) => (
  <div className="rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" style={{ width: size * 0.5, height: size * 0.5 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  </div>
);

const InitialsAvatar = ({ text, color, badge, size = 48 }: { text: string; color: string; badge?: 'check' | 'question' | null; size?: number }) => (
  <div className="relative shrink-0" style={{ width: size, height: size }}>
    <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
      <span className="text-white font-extrabold" style={{ fontSize: size * 0.3 }}>{text}</span>
    </div>
    {badge === 'check' && (
      <div className="absolute rounded-full bg-[#16A34A] flex items-center justify-center border-2 border-white"
        style={{ width: size * 0.38, height: size * 0.38, bottom: -2, right: -2 }}>
        <svg viewBox="0 0 10 10" fill="none" style={{ width: size * 0.22, height: size * 0.22 }}>
          <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )}
    {badge === 'question' && (
      <div className="absolute rounded-full bg-[#E8002D] flex items-center justify-center border-2 border-white"
        style={{ width: size * 0.38, height: size * 0.38, bottom: -2, right: -2 }}>
        <span className="text-white font-extrabold" style={{ fontSize: size * 0.2 }}>?</span>
      </div>
    )}
  </div>
);

const TxAvatar = ({ avatar, size = 48 }: { avatar: TxAvatar; size?: number }) => {
  switch (avatar.type) {
    case 'khqr': return <KHQRAvatar size={size} />;
    case 'store': return <StoreAvatar color={avatar.color} size={size} />;
    case 'document': return <DocumentAvatar size={size} />;
    case 'initials':
    default:
      return <InitialsAvatar text={avatar.text ?? '??'} color={avatar.color} badge={avatar.badge} size={size} />;
  }
};

/* ── Action button (icon + title + subtitle, matches screenshot) ── */
const ActionButton = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
  <button className="flex items-center gap-4 w-full py-3.5 hover:bg-gray-50 transition-colors rounded-xl px-1 active:scale-[0.98] text-left">
    <div className="w-10 h-10 rounded-full bg-[#EEF3FF] flex items-center justify-center shrink-0 text-[#2563EB]">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[14px] font-bold text-[#2563EB]">{title}</p>
      <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-snug">{subtitle}</p>
    </div>
  </button>
);

export default function TransactionDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string; txId: string }>();
  const tx = txDetails[params.txId] ?? getTxnDetail(params.txId) ?? getDefault(params.txId, params.id);
  const avatar = tx.avatar ?? { type: 'initials', color: '#6B7280', text: 'TX' };

  const absAmount = tx.amount.replace(/^[+-]/, '');
  const description = tx.type === 'credit' ? `Received from ${tx.merchant}` : `Sent to ${tx.merchant}`;

  return (
    <div className="min-h-[100dvh] md:h-screen md:min-h-screen bg-gray-200 flex items-center justify-center md:p-4 font-sans select-none">
      <div className="w-full h-[100dvh] md:max-w-[390px] md:h-[844px] bg-white md:rounded-[2.5rem] shadow-2xl relative overflow-hidden md:border-[8px] border-black flex flex-col">

        {/* ── Light backdrop (account list peeking through) ── */}
        <div className="absolute inset-0 pointer-events-none bg-gray-50">
          <div className="px-5 pt-14">
            <p className="text-gray-900 text-[18px] font-extrabold tracking-tight">qiang</p>
            <p className="text-gray-500 text-[12px] font-semibold mt-0.5">150 614 168 | 20000.00 USD</p>
          </div>
        </div>

        {/* ── Dim overlay (tap to close) ── */}
        <button
          aria-label="Back to account"
          onClick={() => setLocation(`/accounts/${params.id}`)}
          className="absolute inset-0 z-20 bg-black/30 cursor-pointer"
        />

        {/* ── Receipt bottom sheet ── */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-[28px] max-h-[88%] overflow-y-auto shadow-2xl"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0 sticky top-0 bg-white z-10">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="px-5 pb-6 pt-1">

            {/* Header: avatar + amount + description */}
            <div className="flex items-center gap-3.5 mb-4">
              <TxAvatar avatar={avatar} size={52} />
              <div className="flex-1 min-w-0">
                <p data-testid="receipt-amount" className="text-[24px] font-extrabold leading-tight tracking-tight text-gray-900">
                  {absAmount} <span className="text-[16px] font-bold text-gray-500">{tx.currency === 'KHR' ? 'KHR' : 'USD'}</span>
                </p>
                <p className="text-[14px] font-semibold text-gray-500 mt-0.5 truncate">{description}</p>
              </div>
            </div>

            {/* Bakong delivery timeline (cross-bank only) */}
            {tx.status && (
              <div className="bg-[#F8F9FB] rounded-2xl px-4 py-3.5 mb-4">
                <div className="flex items-start justify-between">
                  {tx.status.map((s) => (
                    <div key={s.label} className="flex flex-col items-center flex-1">
                      <div className="w-7 h-7 rounded-full bg-[#16A34A] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                      <p className="text-[12px] font-bold text-gray-900 mt-1.5">{s.label}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dashed divider */}
            <div className="my-4 border-t-2 border-dashed border-gray-200" />

            {/* Detail rows */}
            <div className="space-y-3">
              {tx.fields.filter((f) => f.label !== 'Note').map((field) => (
                <div key={field.label} className="flex items-start justify-between gap-4">
                  <span className="text-[13px] text-gray-500 font-medium shrink-0 pt-0.5">{field.label}:</span>
                  <span className="text-[13px] font-bold text-gray-900 text-right whitespace-pre-line">{field.value}</span>
                </div>
              ))}
            </div>

            {/* Dashed divider */}
            <div className="my-5 border-t-2 border-dashed border-gray-200" />

            {/* Action buttons (4 Khmer-labeled actions) */}
            <div className="space-y-1">
              <ActionButton
                icon={<Upload className="w-4 h-4" strokeWidth={2.5} />}
                title="ចែករំលែកជារូបភាព"
                subtitle="ចែករំលែកព័ត៌មានលម្អិតប្រតិបត្តិការទាំងនេះជារូបភាព"
              />
              <ActionButton
                icon={<MessageCircle className="w-4 h-4" strokeWidth={2.5} />}
                title="ឆាត"
                subtitle="សូមចាប់ផ្តើមសារឆ្លើយឆ្លង ជាមួយដៃគូម្នាក់នេះ។"
              />
              <ActionButton
                icon={<Download className="w-4 h-4" strokeWidth={2.5} />}
                title="ទាញយកជា PDF"
                subtitle="រក្សាទុក ព័ត៌មានប្រតិបត្តិការទាំងនេះជា PDF"
              />
              <ActionButton
                icon={<Clock className="w-4 h-4" strokeWidth={2.5} />}
                title="មើលប្រវត្តិប្រតិបត្តិការ"
                subtitle="មើលប្រវត្តិប្រតិបត្តិការទាំងអស់របស់អ្នកទទួលនេះ"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
