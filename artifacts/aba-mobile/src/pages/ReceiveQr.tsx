import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { accounts } from '@/data/accounts';
import personalQr from '@/assets/aba-personal-qr.png';

type TabId = 'home' | 'qr' | 'transfer' | 'sound';
type AccountId = 'account' | 'phone';

/* ─── Nav icons ─────────────────────────────────────────────────────────────── */
const Glyph = ({ name }: { name: TabId }) => {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (name === 'home') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...shared} d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>;
  }
  if (name === 'qr') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...shared} d="M3.5 3.5h6v6h-6zM14.5 3.5h6v6h-6zM3.5 14.5h6v6h-6zM14.5 14.5h2v2h-2zM18.5 14.5h2v2h-2zM14.5 18.5h2v2h-2zM18.5 18.5h2v2h-2z" /></svg>;
  }
  if (name === 'transfer') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...shared} d="M7 17 17 7M8 7h9v9" /><path {...shared} d="M4 12v7a1 1 0 0 0 1 1h7" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...shared} d="M4 14v-3a8 8 0 0 1 16 0v3" /><rect {...shared} x="3" y="13" width="4" height="7" rx="2" /><rect {...shared} x="17" y="13" width="4" height="7" rx="2" /><path {...shared} d="M17 20a5 5 0 0 1-5 2" /></svg>;
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function ReceiveQr() {
  const [, navigate] = useLocation();
  const [amount, setAmount] = useState(0);
  const [amountDraft, setAmountDraft] = useState('');
  const [amountOpen, setAmountOpen] = useState(false);
  const [expandedAccount, setExpandedAccount] = useState<AccountId | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('qr');
  const [closed, setClosed] = useState(false);

  /* Current user's accounts */
  const usdAcct = accounts.find((a) => a.currency === 'USD' && a.badge?.label === 'គណនីគោល') ?? accounts[0];
  const khrAcct = accounts.find((a) => a.currency === 'KHR') ?? accounts[accounts.length - 1];
  const PAYEE = usdAcct.name.toUpperCase();

  const accountList: { id: AccountId; label: string; number: string; symbol: string; detail: string }[] = [
    { id: 'account', label: 'ទទួលប្រាក់រៀលចូល', number: khrAcct.number, symbol: '៛', detail: 'គណនីទទួលប្រាក់ KHQR' },
    { id: 'phone', label: 'ទទួលប្រាក់ដុល្លារចូល', number: usdAcct.number, symbol: '$', detail: 'ទូរស័ព្ទដែលភ្ជាប់នឹងគណនី' },
  ];

  const saveAmount = () => {
    const nextAmount = Number(amountDraft);
    if (Number.isFinite(nextAmount) && nextAmount >= 0) {
      setAmount(nextAmount);
      setAmountOpen(false);
      setAmountDraft('');
    }
  };

  const handleNav = (id: TabId) => {
    setActiveTab(id);
    if (id === 'home') navigate('/');
    else if (id === 'transfer') navigate('/transfer');
    else if (id === 'sound') navigate('/settings');
  };

  if (closed) {
    return (
      <main className="min-h-screen bg-[#efefef] flex items-center justify-center" style={{ fontFamily: '"Noto Sans Khmer", "DM Sans", sans-serif' }}>
        <div className="w-full max-w-[370px] flex flex-col items-center justify-center text-center px-5">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#df171e] text-[25px] font-bold mb-4">×</div>
          <h2 className="text-[18px] font-bold text-[#111] mb-2">ទំព័រ QR ត្រូវបានបិទ</h2>
          <p className="max-w-[280px] text-[#777] text-[12px] leading-[1.65] mb-5">
            នេះជាការមើលជាមុនប៉ុណ្ណោះ។ អ្នកអាចបើកទំព័រទទួលប្រាក់ឡើងវិញបាន។
          </p>
          <button
            className="min-h-[42px] px-5 border-0 rounded-[11px] bg-[#df171e] text-white text-[12px] font-semibold cursor-pointer active:scale-95 transition-transform"
            onClick={() => setClosed(false)}
          >
            បើក QR ឡើងវិញ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#efefef] text-[#111313] overflow-x-hidden flex justify-center"
      style={{ fontFamily: '"Noto Sans Khmer", "DM Sans", sans-serif', padding: 'max(12px, env(safe-area-inset-top)) 20px max(11px, env(safe-area-inset-bottom))' }}
    >
      <div className="w-full max-w-[370px] min-h-screen flex flex-col relative">
        {/* Close button */}
        <button
          className="absolute z-10 top-[43px] right-0 w-[38px] h-[38px] border-0 rounded-full bg-[#111] text-white flex items-center justify-center cursor-pointer hover:bg-[#c51d27] hover:rotate-5 transition-all"
          aria-label="បិទទំព័រ QR"
          onClick={() => navigate('/')}
        >
          <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header */}
        <header className="text-center pt-[25px] px-[34px]">
          <div className="relative inline-flex items-center text-[#171a19] text-[24px] font-bold tracking-[0.045em] leading-none" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            ABA QR
            <span className="absolute w-[5px] h-[5px] left-[48%] -top-[3px] rounded-full bg-[#df171e]" style={{ boxShadow: '0 0 0 2px #efefef' }} />
          </div>
          <p className="mt-2.5 text-[#707372] text-[12px] leading-[1.65]">
            ប្រើ QR code នេះដើម្បីទទួលការទូទាត់ដោយងាយស្រួល <span aria-hidden="true">ⓘ</span>
          </p>
        </header>

        {/* KHQR Card */}
        <section
          className="w-full max-w-[340px] mx-auto mt-[18px] overflow-hidden rounded-[18px] bg-white"
          style={{ boxShadow: '0 9px 25px rgba(0,0,0,.09), 0 2px 4px rgba(0,0,0,.035)' }}
          aria-label="KHQR receiving code"
        >
          {/* Card head */}
          <div
            className="relative min-h-[49px] flex items-center justify-center bg-[#df171e] text-white text-[19px] font-semibold tracking-[0.035em]"
            style={{ fontFamily: '"DM Sans", "Noto Sans Khmer", sans-serif' }}
          >
            KHQR
            <span
              className="absolute z-10 -bottom-[26px] right-0 w-0 h-0"
              style={{ borderTop: '27px solid #df171e', borderLeft: '27px solid transparent' }}
            />
          </span>

          {/* Merchant + amount */}
          <div className="px-6 pt-[22px] pb-4">
            <div className="text-[#111] text-[14px] font-semibold tracking-[0.005em]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              {PAYEE}
            </div>
            <div className="mt-0.5 text-[#080909] text-[27px] font-semibold leading-[1.2]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              {amount === 0 ? '0' : amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Divider */}
          <hr className="border-t border-dashed border-[#c8c9c9] mx-0" />

          {/* QR code */}
          <div className="flex justify-center px-4 py-6">
            <img
              src={personalQr}
              alt="KHQR payment code"
              className="block w-full max-w-[258px] aspect-square object-contain bg-white"
            />
          </div>
        </section>

        {/* Add amount button */}
        <button
          className="w-full max-w-[340px] mx-auto mt-3 min-h-[43px] border-0 rounded-[12px] flex items-center justify-center gap-2 bg-[#df171e] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#c51d27] active:scale-[0.985] transition-all"
          style={{ fontFamily: '"Noto Sans Khmer", sans-serif', boxShadow: '0 5px 12px rgba(197,29,39,.18)' }}
          onClick={() => setAmountOpen(true)}
        >
          <span className="w-5 h-5 border border-white/70 rounded-full relative" aria-hidden="true">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-[1.5px] bg-white rounded" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.5px] h-2 bg-white rounded" />
          </span>
          <span>{amount === 0 ? 'បញ្ចូលចំនួនទឹកប្រាក់' : 'កែប្រែចំនួនទឹកប្រាក់'}</span>
        </button>

        {/* Account details */}
        <section className="w-full max-w-[340px] mx-auto mt-[9px]" aria-label="Account information">
          {accountList.map((account) => (
            <div key={account.id} className="border-b border-[#e2e3e3] last:border-b-0">
              <button
                className="w-full min-h-[39px] px-0.5 border-0 grid grid-cols-[19px_1fr_auto_14px] items-center gap-2 bg-transparent text-left text-[#8a8c8c] text-[11px] cursor-pointer"
                style={{ fontFamily: '"Noto Sans Khmer", sans-serif' }}
                aria-expanded={expandedAccount === account.id}
                onClick={() => setExpandedAccount(expandedAccount === account.id ? null : account.id)}
              >
                <span className="w-4 h-4 border border-[#a1a3a3] rounded-full flex items-center justify-center text-[10px] font-medium text-[#555]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                  {account.symbol}
                </span>
                <span>{account.label}</span>
                <strong className="text-[#252828] text-[12px] font-semibold tracking-[0.025em] whitespace-nowrap" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                  {account.number}
                </strong>
                <svg
                  className="w-[13px] h-[13px] transition-transform"
                  style={{ transform: expandedAccount === account.id ? 'rotate(180deg)' : 'none' }}
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path d="m3.5 6 4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {expandedAccount === account.id && (
                <div className="px-2.5 pb-2 pl-[27px] text-[#8c8f8e] text-[10px]">
                  {account.detail}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Bottom nav */}
        <nav className="grid grid-cols-4 gap-1 mt-auto -mx-[7px] pt-[15px]" aria-label="ការរុករក">
          {([
            ['home', 'ទំព័រដើម'],
            ['qr', 'ផ្ទេរ QR'],
            ['transfer', 'ផ្ញើប្រាក់'],
            ['sound', 'PaySound'],
          ] as [TabId, string][]).map(([id, label]) => (
            <button
              key={id}
              className="min-w-0 pt-[3px] px-0.5 border-0 rounded-[12px] bg-transparent flex flex-col items-center gap-1.5 text-[#898c8b] text-[10px] font-medium cursor-pointer hover:text-[#df171e] hover:-translate-y-0.5 transition-all"
              style={{ fontFamily: '"Noto Sans Khmer", sans-serif', color: activeTab === id ? '#df171e' : undefined }}
              data-active={activeTab === id}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => handleNav(id)}
            >
              <span
                className="w-[37px] h-[37px] border rounded-full bg-white flex items-center justify-center"
                style={{
                  borderColor: activeTab === id ? '#f1d1d3' : '#f4f4f4',
                  backgroundColor: activeTab === id ? '#f8e3e4' : '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,.03)',
                }}
              >
                <span className="w-5 h-5 block"><Glyph name={id} /></span>
              </span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Home indicator */}
        <div className="flex-shrink-0 w-[105px] h-1 mx-auto mt-[13px] rounded-full bg-[#080808]" aria-hidden="true" />
      </div>

      {/* Amount modal */}
      {amountOpen && (
        <div
          className="fixed inset-0 z-50 p-[18px] flex items-center justify-center bg-[#1117] backdrop-blur-[3px]"
          onClick={(e) => { if (e.target === e.currentTarget) setAmountOpen(false); }}
        >
          <section
            className="w-full max-w-[330px] p-[23px] rounded-[18px] bg-white"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,.12)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="aba-amount-title"
          >
            <h2 id="aba-amount-title" className="text-[17px] font-bold m-0">បញ្ចូលចំនួនទឹកប្រាក់</h2>
            <p className="mt-[7px] mb-[17px] text-[#757978] text-[12px] leading-[1.6]">
              កំណត់ចំនួនទឹកប្រាក់សម្រាប់ QR របស់អ្នក។
            </p>
            <input
              className="w-full h-[47px] px-[13px] border border-[#d8d9d9] rounded-[10px] text-[#191b1b] bg-white text-[17px] font-semibold outline-none focus:border-[#df171e]"
              style={{ fontFamily: '"DM Sans", sans-serif' }}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              autoFocus
              value={amountDraft}
              onChange={(e) => setAmountDraft(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveAmount(); }}
              aria-label="Amount"
            />
            <div className="grid grid-cols-2 gap-[9px] mt-4">
              <button
                className="min-h-[41px] border-0 rounded-[10px] bg-[#f0f0f0] text-[#454747] text-[12px] font-semibold cursor-pointer active:scale-95 transition-transform"
                style={{ fontFamily: '"Noto Sans Khmer", sans-serif' }}
                onClick={() => setAmountOpen(false)}
              >
                បោះបង់
              </button>
              <button
                className="min-h-[41px] border-0 rounded-[10px] bg-[#df171e] text-white text-[12px] font-semibold cursor-pointer active:scale-95 transition-transform"
                style={{ fontFamily: '"Noto Sans Khmer", sans-serif' }}
                onClick={saveAmount}
              >
                រក្សាទុក
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
