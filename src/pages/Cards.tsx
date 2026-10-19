import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Snowflake, Globe, KeyRound, Wallet, Plus, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useLocation } from 'wouter';
import { Switch } from '@/components/ui/switch';

/* ─── Card data ─────────────────────────────────────────────────────────────── */
const CARD = {
  holder: 'YUKHEANG SOEU',
  number: '6233 7501 5785 4858',
  exp: '07/31',
  cvv: '159',
  type: 'UPI Debit Card',
  account: 'qiang *168',
  balance: '0.34 USD',
};

/* ─── UnionPay logo ─────────────────────────────────────────────────────────── */
const UnionPayLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 80 50" className={className}>
    <rect x="2" y="2" width="76" height="46" rx="8" fill="#E60012" />
    <rect x="2" y="2" width="38" height="46" rx="8" fill="#004098" />
    <text x="20" y="32" textAnchor="middle" fontSize="16" fontWeight="900" fill="white" fontFamily="Arial">U</text>
    <text x="58" y="32" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="Arial">P</text>
    <text x="40" y="44" textAnchor="middle" fontSize="7" fontWeight="700" fill="white" fontFamily="Arial">UnionPay 银联</text>
  </svg>
);

/* ─── ABA Bank logo on card ─────────────────────────────────────────────────── */
const ABALogo = () => (
  <div className="flex items-center gap-1.5">
    <div className="flex items-center">
      <span className="text-white text-[16px] font-black tracking-tight">ABA<span className="text-[#E8002D]">'</span> BANK</span>
    </div>
  </div>
);

/* ─── Debit Card (centered) ─────────────────────────────────────────────────── */
const DebitCard = ({ showCvv, onToggleCvv }: { showCvv: boolean; onToggleCvv: () => void }) => (
  <div className="flex justify-center px-5 pb-1">
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative shrink-0 w-[320px] h-[195px] rounded-[20px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
      style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3B66 35%, #1A5F8A 70%, #2980B9 100%)' }}
    >
      {/* Geometric pattern - grid dots */}
      <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 320 195">
        {/* Grid pattern top-right */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#4FC3F7" />
          </pattern>
        </defs>
        <rect x="180" y="0" width="140" height="100" fill="url(#grid)" opacity="0.5" />
        {/* Diagonal lines */}
        <line x1="0" y1="60" x2="200" y2="0" stroke="#29B6F6" strokeWidth="2" opacity="0.4" />
        <line x1="0" y1="90" x2="250" y2="10" stroke="#29B6F6" strokeWidth="1.5" opacity="0.3" />
        {/* Red accent line */}
        <line x1="50" y1="195" x2="200" y2="80" stroke="#E8002D" strokeWidth="2" opacity="0.6" />
        {/* Red square accent */}
        <rect x="210" y="55" width="20" height="20" fill="#E8002D" opacity="0.8" transform="rotate(15 220 65)" />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-5 pt-4 pb-4">
        {/* Bank identity row */}
        <div className="flex items-start justify-between">
          <div>
            <ABALogo />
            <p className="text-white/60 text-[6.5px] font-semibold mt-[3px] tracking-[0.1em]">
              NATIONAL BANK OF CANADA GROUP
            </p>
          </div>
        </div>

        {/* Vertical DEBIT label */}
        <div className="absolute top-0 bottom-0 right-0 w-[28px] bg-[#E8002D] flex items-center justify-center">
          <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-black tracking-[0.2em] text-white">
            DEBIT
          </span>
        </div>

        <div className="flex-1" />

        {/* Holder name */}
        <p className="text-white text-[13px] font-bold tracking-[0.06em]">{CARD.holder}</p>

        {/* Card number */}
        <p className="text-white text-[17px] font-extrabold tracking-[0.12em] mt-[6px]">
          {CARD.number}
        </p>

        {/* Bottom row: exp + cvv button + UnionPay */}
        <div className="flex items-end justify-between mt-[12px] pr-8">
          <div className="flex items-center gap-4">
            <span className="text-white/80 text-[10px] font-bold">
              Exp: <span className="text-white font-extrabold">{CARD.exp}</span>
            </span>
            <button
              onClick={onToggleCvv}
              className="flex items-center gap-1 bg-[#1565C0] hover:bg-[#1976D2] px-2.5 py-1 rounded-md transition-colors"
            >
              <span className="text-white text-[10px] font-bold">CVV:</span>
              <span className="text-white text-[10px] font-extrabold tracking-wider">
                {showCvv ? CARD.cvv : '***'}
              </span>
              {showCvv ? <EyeOff className="w-3 h-3 text-white/80" /> : <Eye className="w-3 h-3 text-white/80" />}
            </button>
          </div>
          <UnionPayLogo className="w-[52px] h-[33px]" />
        </div>
      </div>
    </motion.div>
  </div>
);

/* ─── Card selector bar (below card) ────────────────────────────────────────── */
const CardSelector = () => (
  <div className="mx-5 mt-3 bg-[#E8E8EC] rounded-xl px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div>
        <p className="text-[14px] font-bold text-gray-900">{CARD.type}</p>
        <p className="text-[12px] text-gray-500 font-medium mt-0.5">
          {CARD.account} <span className="mx-1.5">|</span> {CARD.balance}
        </p>
      </div>
    </div>
    <ChevronDown className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
  </div>
);

/* ─── Action buttons (ផ្ទេរ / មើលប្រតិបត្តិការ / បង្កកកាត) ─────────────────── */
const ActionButtons = () => {
  const [, setLocation] = useLocation();
  const actions = [
    {
      label: 'ផ្ទេរ',
      icon: (
        <div className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100">
          <UnionPayLogo className="w-7 h-5" />
        </div>
      ),
      action: () => setLocation('/transfer'),
    },
    {
      label: 'មើលប្រតិបត្តិការ',
      icon: (
        <div className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100">
          <Clock className="w-5 h-5 text-gray-700" strokeWidth={2} />
        </div>
      ),
      action: () => setLocation('/accounts/1'),
    },
    {
      label: 'បង្កកកាត',
      icon: (
        <div className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100">
          <Snowflake className="w-5 h-5 text-gray-700" strokeWidth={2} />
        </div>
      ),
      action: () => {},
    },
  ];

  return (
    <div className="flex justify-around px-8 mt-5">
      {actions.map((a) => (
        <motion.button
          key={a.label}
          whileTap={{ scale: 0.92 }}
          onClick={a.action}
          className="flex flex-col items-center gap-2"
        >
          {a.icon}
          <span className="text-[12px] font-bold text-gray-700">{a.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

/* ─── Settings rows ─────────────────────────────────────────────────────────── */
type SettingRow = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  type: 'link' | 'switch' | 'disabled';
};

const SettingRowItem = ({
  row,
  index,
  onlineOn,
  onToggle,
}: {
  row: SettingRow;
  index: number;
  onlineOn: boolean;
  onToggle: (v: boolean) => void;
}) => {
  const isDisabled = row.type === 'disabled';

  const rowBody = (
    <>
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
        <span className={isDisabled ? 'text-gray-400' : 'text-gray-600'}>{row.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-bold ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {row.title}
        </p>
        {row.subtitle && (
          <p className={`text-[11px] font-medium leading-snug mt-[2px] ${isDisabled ? 'text-gray-300' : 'text-gray-500'}`}>
            {row.subtitle}
          </p>
        )}
      </div>
      {row.type === 'switch' ? (
        <Switch
          checked={onlineOn}
          onCheckedChange={onToggle}
          aria-label="Online payments toggle"
          className="data-[state=checked]:bg-[#34C759] data-[state=unchecked]:bg-gray-300"
        />
      ) : row.type === 'link' ? (
        <div className="flex items-center gap-2">
          {row.id === 'linked' && (
            <button className="flex items-center gap-1 bg-[#E8002D] hover:bg-[#D00028] px-3 py-1.5 rounded-full transition-colors">
              <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              <span className="text-[11px] font-extrabold text-white">កាត</span>
            </button>
          )}
        </div>
      ) : null}
    </>
  );

  const rowClassName = `w-full flex items-center gap-3.5 px-5 py-[14px] text-left ${isDisabled ? '' : 'hover:bg-gray-50'} transition-colors`;

  if (row.type === 'switch' || row.type === 'disabled') {
    return <div className={rowClassName}>{rowBody}</div>;
  }

  return (
    <motion.button
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.05, ease: 'easeOut' }}
      whileTap={{ scale: 0.985 }}
      className={rowClassName}
    >
      {rowBody}
    </motion.button>
  );
};

/* ─── Main Page (light theme, matches ABA official) ─────────────────────────── */
export default function Cards() {
  const [, setLocation] = useLocation();
  const [onlineOn, setOnlineOn] = useState(true);
  const [showCvv, setShowCvv] = useState(false);

  const rows: SettingRow[] = [
    {
      id: 'limit',
      title: 'ប្តូរកម្រិតប្រតិបត្តិការ',
      subtitle: 'កំណត់កម្រិតប្រតិបត្តិការសំរាប់កាតនេះ',
      icon: <Clock className="w-[20px] h-[20px]" strokeWidth={1.8} />,
      type: 'disabled',
    },
    {
      id: 'online',
      title: 'ការទូទាត់តាមអនឡាញ',
      subtitle: 'បើក ឬបិទកាតរបស់អ្នកសម្រាប់ការទូទាត់តាមអនឡាញ',
      icon: <Globe className="w-[20px] h-[20px]" strokeWidth={1.8} />,
      type: 'switch',
    },
    {
      id: 'pin',
      title: 'ប្តូរលេខសម្ងាត់ថ្មី',
      subtitle: 'កំណត់លេខសម្ងាត់កាតរបស់អ្នកឡើងវិញ',
      icon: <KeyRound className="w-[20px] h-[20px]" strokeWidth={1.8} />,
      type: 'link',
    },
    {
      id: 'linked',
      title: 'ប្តូរគណនីភ្ជាប់',
      subtitle: 'ផ្លាស់ប្តូរគណនីប្រភពដែលត្រូវបានភ្ជាប់ទៅកាត',
      icon: <Wallet className="w-[20px] h-[20px]" strokeWidth={1.8} />,
      type: 'link',
    },
  ];

  return (
    <div className="min-h-[100dvh] md:h-screen md:min-h-screen bg-gray-300 flex items-center justify-center md:p-4 font-sans select-none">
      <div className="w-full h-full md:max-w-[390px] md:h-[844px] bg-[#F3F2F7] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden md:border-[8px] border-black flex flex-col">

        {/* Header */}
        <div className="relative z-20 px-5 pt-12 pb-2 flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            aria-label="Back"
            className="text-gray-900 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">
            ABA<span className="text-[#E8002D] text-2xl font-black">'</span>{' '}
            <span className="font-semibold">កាត</span>
          </h1>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-8">
          {/* Debit card */}
          <DebitCard showCvv={showCvv} onToggleCvv={() => setShowCvv(!showCvv)} />

          {/* Card selector */}
          <CardSelector />

          {/* Action buttons */}
          <ActionButtons />

          {/* Settings sheet */}
          <div className="mt-6 bg-white rounded-t-[26px] pt-5 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            <div className="px-5 pb-2">
              <h2 className="text-[16px] font-extrabold text-gray-900">ការកំណត់លើកាត</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <SettingRowItem
                  key={row.id}
                  row={row}
                  index={i}
                  onlineOn={onlineOn}
                  onToggle={setOnlineOn}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
