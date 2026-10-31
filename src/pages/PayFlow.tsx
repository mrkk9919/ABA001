import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Check, ChevronLeft, Pencil, Share2, Download, Delete, X } from 'lucide-react';
import { accounts } from '@/data/accounts';
import { getPendingTransfer, clearPendingTransfer } from '@/lib/transferState';

type Step = 'amount' | 'processing' | 'success';
type Currency = 'USD' | 'KHR';

const DARK_TEAL: React.CSSProperties = {
  background: 'linear-gradient(165deg, #164654 0%, #0C2A33 55%, #071A21 100%)',
};

/* MBCambodia-style bank badge (white circle + blue MB wordmark) */
const BankBadge = ({ size = 64 }: { size?: number }) => (
  <div
    className="rounded-full bg-white flex items-center justify-center shadow-lg"
    style={{ width: size, height: size }}
  >
    <span style={{ color: '#005BAA', fontWeight: 900, fontSize: size * 0.32, letterSpacing: '-0.5px' }}>
      MB<span style={{ fontSize: size * 0.18, verticalAlign: 'super' }}>★</span>
    </span>
  </div>
);

/* ─── Amount entry screen (dark teal, keypad) ─────────────────────────────── */
const AmountScreen = ({
  payeeName,
  bankName,
  currency,
  setCurrency,
  amountStr,
  setAmountStr,
  fromAcctIdx,
  cycleFromAcct,
  onOpenNote,
  onPay,
}: {
  payeeName: string;
  bankName: string;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  amountStr: string;
  setAmountStr: (s: string) => void;
  fromAcctIdx: number;
  cycleFromAcct: () => void;
  onOpenNote: () => void;
  onPay: () => void;
}) => {
  const [, setLocation] = useLocation();
  const from = accounts[fromAcctIdx % accounts.length];
  const amountNum = parseFloat(amountStr || '0');
  const canPay = amountNum > 0;

  const displayAmount = useMemo(() => {
    if (!amountStr) return '0';
    const [intPart, decPart] = amountStr.split('.');
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
  }, [amountStr]);

  const press = (k: string) => {
    if (k === 'del') {
      setAmountStr(amountStr.slice(0, -1));
      return;
    }
    if (k === '.') {
      if (amountStr.includes('.')) return;
      setAmountStr(amountStr ? amountStr + '.' : '0.');
      return;
    }
    if (amountStr === '0' && k !== '.') {
      setAmountStr(k);
      return;
    }
    if (amountStr.includes('.') && amountStr.split('.')[1].length >= 2) return;
    if (amountStr.replace('.', '').length >= 12) return;
    setAmountStr(amountStr + k);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  return (
    <div className="min-h-[100dvh] flex flex-col text-white" style={DARK_TEAL}>
      {/* Header */}
      <div className="relative flex items-center justify-center pt-12 pb-3 px-5">
        <button onClick={() => setLocation('/')} className="absolute left-5 top-12 text-white/80">
          <ChevronLeft className="w-7 h-7" strokeWidth={2.2} />
        </button>
        <p className="text-[18px] font-extrabold tracking-wide flex items-center gap-1.5">
          ABA<span className="inline-block w-2 h-2 rounded-full bg-[#E8002D]" />ស្កែន
        </p>
      </div>

      {/* Payee */}
      <div className="flex flex-col items-center pt-2 pb-4">
        <BankBadge size={72} />
        <p className="mt-3 text-[19px] font-bold tracking-wide">{payeeName}</p>
        <p className="mt-1 text-[11px] text-white/50">{bankName}</p>
      </div>

      {/* Currency toggle */}
      <div className="flex justify-center pb-4">
        <div className="flex rounded-full bg-white/10 p-1 backdrop-blur">
          {(['KHR', 'USD'] as Currency[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-6 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                currency === c ? 'bg-[#E8002D] text-white shadow' : 'text-white/60'
              }`}
            >
              {c === 'KHR' ? 'រៀល' : 'ដុល្លារ'}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="flex justify-center items-baseline gap-1 py-2">
        {currency === 'USD' && <span className="text-[34px] font-light text-white/60">$</span>}
        <span className="text-[52px] font-light tracking-tight text-white/90 leading-none">{displayAmount}</span>
        {currency === 'KHR' && <span className="text-[24px] font-light text-white/60 ml-1">៛</span>}
      </div>

      {/* From account */}
      <div className="flex justify-center pt-1 pb-3">
        <button onClick={cycleFromAcct} className="flex items-center gap-1.5 text-[13px] text-cyan-200/80 active:opacity-70">
          <span>ទូទាត់ពី:</span>
          <span className="font-semibold">{from.number}</span>
          <span className="opacity-70">| {from.currency}</span>
          <ChevronLeft className="w-3.5 h-3.5 rotate-[-90deg] opacity-70" />
        </button>
      </div>

      {/* Note button */}
      <div className="flex justify-center pb-4">
        <button
          onClick={onOpenNote}
          className="flex items-center gap-2 px-8 py-2.5 rounded-full border border-white/25 text-[13px] font-semibold text-white/80 active:bg-white/10"
        >
          <Pencil className="w-4 h-4" />
          ចំណាំ
        </button>
      </div>

      {/* Keypad */}
      <div className="flex-1 flex items-end">
        <div className="w-full grid grid-cols-3 gap-y-1 pb-3 px-8">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="h-[58px] flex items-center justify-center text-[26px] font-medium text-white active:bg-white/10 rounded-xl"
            >
              {k === 'del' ? <Delete className="w-6 h-6" /> : k}
            </button>
          ))}
        </div>
      </div>

      {/* Pay button */}
      <button
        onClick={onPay}
        disabled={!canPay}
        className={`w-full py-4 text-[16px] font-extrabold tracking-wide transition-all ${
          canPay ? 'bg-[#E8002D] text-white active:scale-[0.99]' : 'bg-white/15 text-white/40'
        }`}
      >
        បង់ឥឡូវ
      </button>
    </div>
  );
};

/* ─── Processing screen (loading dots) ────────────────────────────────────── */
const ProcessingScreen = ({ payeeName, bankName }: { payeeName: string; bankName: string }) => (
  <div className="min-h-[100dvh] flex flex-col items-center text-white" style={DARK_TEAL}>
    <div className="flex flex-col items-center pt-24">
      <BankBadge size={72} />
      <p className="mt-3 text-[19px] font-bold tracking-wide">{payeeName}</p>
      <p className="mt-1 text-[11px] text-white/50">{bankName}</p>
    </div>
    <div className="flex-1 flex items-center justify-center gap-3">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-cyan-300/70 animate-pulse"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
    <div className="pb-16 opacity-30">
      <div className="w-24 h-24 rounded-full border-[10px] border-cyan-200/40 flex items-center justify-center">
        <span className="text-4xl font-bold text-cyan-100/60">$</span>
      </div>
    </div>
  </div>
);

/* ─── Success receipt screen ──────────────────────────────────────────────── */
const SuccessScreen = ({
  amount,
  currency,
  payeeName,
  bankName,
  fromNumber,
}: {
  amount: string;
  currency: Currency;
  payeeName: string;
  bankName: string;
  fromNumber: string;
}) => {
  const [, setLocation] = useLocation();
  const now = new Date();
  const stamp = `${now.getMonth() + 1} តុលា | ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' | ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 'PM';
  const ref1 = Math.random().toString(16).slice(2, 10);
  const ref2 = String(Math.floor(Math.random() * 9e11) + 1e11);
  const amt = currency === 'USD' ? `-${parseFloat(amount || '0.01').toFixed(2)} USD` : `-${amount} KHR`;

  const steps = [
    { label: 'បានផ្ញើចេញ', done: true },
    { label: 'បានផ្ញើបន្ត', done: true },
    { label: 'បានផ្ញើដល់អ្នកទទួល', done: true },
  ];

  const details: [string, string][] = [
    ['ថ្ងៃធ្វើប្រតិបត្តិការ:', dateStr],
    ['លេខកូដបាតាង:', ref1],
    ['ធនាគារទទួល:', bankName],
    ['ទូទាត់ពី:', fromNumber],
    ['លេខកូដប្រតិបត្តិការ:', ref2],
  ];

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center px-5 pt-16 pb-6"
      style={{ background: 'linear-gradient(180deg, #E9EFE2 0%, #DDE4D3 100%)' }}
    >
      {/* Check + title */}
      <div className="w-16 h-16 rounded-full bg-[#B8D4BE] flex items-center justify-center shadow-md">
        <Check className="w-8 h-8 text-[#3E6B4C]" strokeWidth={3} />
      </div>
      <h2 className="mt-3 text-[26px] font-extrabold text-[#4A3B2A] tracking-wide">រួចរាល់</h2>

      {/* Receipt card */}
      <div className="w-full max-w-[360px] mt-5 bg-white rounded-[22px] shadow-xl overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <BankBadge size={40} />
            <div>
              <p className="text-[24px] font-extrabold text-gray-900 leading-none">{amt}</p>
              <p className="text-[14px] font-semibold text-gray-600 mt-1">{payeeName}</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="mt-5 flex items-start">
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center flex-1">
                  <div className="w-8 h-8 rounded-full bg-[#0E5A8A] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                  <p className="mt-1.5 text-[9.5px] font-bold text-gray-700 text-center leading-tight">{s.label}</p>
                  <p className="text-[8.5px] text-gray-400 mt-0.5">{stamp}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-[2px] bg-[#0E5A8A] mt-4 mx-[-4px]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Dashed divider */}
        <div className="relative px-5">
          <div className="border-t-[2px] border-dashed border-gray-200" />
          <div className="absolute -left-3 top-[-9px] w-6 h-6 rounded-full bg-[#DDE4D3]" />
          <div className="absolute -right-3 top-[-9px] w-6 h-6 rounded-full bg-[#DDE4D3]" />
        </div>

        {/* Details */}
        <div className="px-5 py-4 space-y-2">
          {details.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 text-[11px]">
              <span className="text-gray-500 shrink-0">{k}</span>
              <span className="text-gray-800 font-semibold text-right break-all">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share / Download */}
      <div className="flex gap-8 mt-6">
        <button className="flex flex-col items-center gap-1.5 active:opacity-70">
          <span className="w-12 h-12 rounded-full bg-[#C9D6BE] flex items-center justify-center shadow">
            <Share2 className="w-5 h-5 text-[#4A5B3E]" />
          </span>
          <span className="text-[11px] font-bold text-[#4A5B3E]">ចែករំលែក</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 active:opacity-70">
          <span className="w-12 h-12 rounded-full bg-[#C9D6BE] flex items-center justify-center shadow">
            <Download className="w-5 h-5 text-[#4A5B3E]" />
          </span>
          <span className="text-[11px] font-bold text-[#4A5B3E]">ទាញយក</span>
        </button>
      </div>

      {/* Home button */}
      <button
        onClick={() => setLocation('/')}
        className="w-full max-w-[360px] mt-auto pt-6"
      >
        <span className="block w-full py-3.5 rounded-[14px] bg-[#C9DCC0] text-[#3E5B45] text-[15px] font-extrabold text-center shadow active:scale-[0.99] transition-transform">
          ទំព័រដើម
        </span>
      </button>
    </div>
  );
};

/* ─── Note modal ──────────────────────────────────────────────────────────── */
const NoteModal = ({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
    <div className="w-full max-w-[320px] bg-white rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-extrabold text-gray-900">ចំណាំ</p>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="បញ្ចូលចំណាំ..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E8002D]"
      />
      <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl bg-[#E8002D] text-white font-bold text-sm">រួចរាល់</button>
    </div>
  </div>
);

/* ─── Page root ───────────────────────────────────────────────────────────── */
export default function PayFlow() {
  const pending = getPendingTransfer();
  const payeeName = (pending?.data as any)?.name || 'THOEURN SAROEUN';
  const bankName = (pending?.data as any)?.bank?.name || 'MB BANK (CAMBODIA) PLC';

  const [step, setStep] = useState<Step>('amount');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [amountStr, setAmountStr] = useState('');
  const [fromIdx, setFromIdx] = useState(0);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    if (step === 'processing') {
      const t = setTimeout(() => setStep('success'), 2600);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'success') clearPendingTransfer();
  }, [step]);

  if (step === 'processing') return <ProcessingScreen payeeName={payeeName} bankName={bankName} />;
  if (step === 'success')
    return (
      <SuccessScreen
        amount={amountStr || '0.01'}
        currency={currency}
        payeeName={payeeName}
        bankName={bankName}
        fromNumber={accounts[fromIdx % accounts.length].number}
      />
    );

  return (
    <>
      <AmountScreen
        payeeName={payeeName}
        bankName={bankName}
        currency={currency}
        setCurrency={setCurrency}
        amountStr={amountStr}
        setAmountStr={setAmountStr}
        fromAcctIdx={fromIdx}
        cycleFromAcct={() => setFromIdx((i) => i + 1)}
        onOpenNote={() => setShowNote(true)}
        onPay={() => setStep('processing')}
      />
      {showNote && <NoteModal value={note} onChange={setNote} onClose={() => setShowNote(false)} />}
    </>
  );
}
