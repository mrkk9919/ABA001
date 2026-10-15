import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, Clock3 } from 'lucide-react';
import { buildKHQR } from '@/lib/khqr';

/* Payment-waiting screen styled after eMoney Cambodia's KHQR payee page. */

const PAYEE = 'LY KIM ENG';
const PAYEE_ACCOUNT = '0966279599';
const BANK_NAME = 'eMoney Cambodia';
const BASE_AMOUNT = '20.00';
const COUNTDOWN_SEC = 5 * 60; // 05:00 like the reference

const bankLogos: { short: string; sub?: string; bg: string; fg: string }[] = [
  { short: 'ABA', sub: 'NATIONAL BANK OF CANADA GROUP', bg: '#E8002D', fg: '#fff' },
  { short: 'ធនាគារអេស៊ីលីដា', bg: '#005BAA', fg: '#fff' },
  { short: 'Wing', sub: 'Bank', bg: '#D97706', fg: '#fff' },
  { short: 'true', sub: 'money', bg: '#C8102E', fg: '#fff' },
  { short: 'AMRET', bg: '#E8632A', fg: '#fff' },
  { short: 'Pi Pay', bg: '#7B4FE8', fg: '#fff' },
  { short: 'ធនាគារ', sub: 'KHANNA', bg: '#B91C1C', fg: '#fff' },
];

function orderNo() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function EmoneyPay() {
  const [, setLocation] = useLocation();
  const [qrUrl, setQrUrl] = useState('');
  const [secLeft, setSecLeft] = useState(COUNTDOWN_SEC);
  const [copiedField, setCopiedField] = useState('');
  const orderRef = useRef(orderNo());

  useEffect(() => {
    const qr = buildKHQR({
      bakongId: `${PAYEE_ACCOUNT}@emoney`,
      merchantName: PAYEE,
      city: 'PHNOM PENH',
      currency: 'USD',
      amount: BASE_AMOUNT,
    });
    QRCode.toDataURL(qr, { width: 440, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => setQrUrl(url))
      .catch(() => setQrUrl(''));
  }, []);

  // Countdown timer
  useEffect(() => {
    const t = window.setInterval(() => {
      setSecLeft((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const mm = String(Math.floor(secLeft / 60)).padStart(2, '0');
  const ss = String(secLeft % 60).padStart(2, '0');
  const progress = secLeft / COUNTDOWN_SEC;

  const copy = async (label: string, text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopiedField(label);
    window.setTimeout(() => setCopiedField(''), 1800);
  };

  const saveQr = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `KHQR-${PAYEE.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const rows: { label: string; value: string }[] = [
    { label: '收款银行', value: BANK_NAME },
    { label: '姓名', value: PAYEE },
    { label: '收款账户', value: PAYEE_ACCOUNT },
    { label: '订单号', value: orderRef.current },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6] font-sans flex flex-col overflow-y-auto">
      {/* Red header */}
      <div className="bg-[#E8002D] px-4 pt-11 pb-3.5">
        <div className="flex items-center justify-between">
          <button onClick={() => setLocation('/')} className="text-white/90 text-[14px] font-bold tracking-widest">CANCEL</button>
          <p className="text-white text-[18px] font-extrabold tracking-[0.2em]">KHQR</p>
          <button onClick={() => setLocation('/')} className="text-white/90">
            <X className="w-6 h-6" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 px-4 pt-5 pb-8">
        {/* Waiting status */}
        <div className="text-center">
          <p className="text-[24px] font-extrabold text-gray-900">等待支付</p>
          <p className="text-[13px] text-gray-500 mt-1.5">请截屏或扫描二维码付款</p>
        </div>

        {/* QR card */}
        <div className="mt-5 rounded-3xl bg-white shadow-[0_8px_28px_rgba(232,0,45,0.12)] p-5 flex flex-col items-center">
          {qrUrl ? (
            <img src={qrUrl} alt="KHQR" className="w-[230px] h-[230px]" />
          ) : (
            <div className="w-[230px] h-[230px] rounded-2xl bg-gray-100 animate-pulse" />
          )}
          <button
            onClick={saveQr}
            className="mt-4 px-6 py-2.5 rounded-xl border-2 border-[#E8002D] text-[#E8002D] text-[13px] font-extrabold flex items-center gap-2 active:scale-[0.97]"
          >
            <Download className="w-4 h-4" strokeWidth={2.4} /> Save QR Code
          </button>

          {/* Amount */}
          <div className="mt-4 flex items-center gap-2">
            <p className="text-[30px] font-extrabold text-gray-900">$ {BASE_AMOUNT}</p>
            <button onClick={() => copy('amt', `$ ${BASE_AMOUNT}`)} className="flex items-center gap-1 text-[12px] font-bold text-[#2E6FD8]">
              {copiedField === 'amt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} 复制
            </button>
          </div>

          {/* Countdown */}
          <div className="mt-4 w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1 text-[12px] font-bold text-gray-700">
                <Clock3 className="w-3.5 h-3.5" /> {mm}:{ss}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">支付倒计时:</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#E8002D] transition-all duration-1000"
                style={{ width: `${Math.max(progress * 100, 2)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Supported banks */}
        <div className="mt-4 text-center">
          <p className="text-[13px] font-bold text-gray-800">支持所有银行</p>
          <div className="mt-3 grid grid-cols-4 gap-2.5">
            {bankLogos.map((b) => (
              <div key={b.short} className="flex flex-col items-center gap-1">
                <span className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white text-[8px] font-extrabold leading-tight text-center px-0.5 shadow-sm" style={{ background: b.bg, color: b.fg }}>
                  <span className="leading-tight">{b.short}</span>
                  {b.sub && <span className="text-[6px] font-bold opacity-90 leading-tight">{b.sub}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payee details */}
        <div className="mt-5 rounded-3xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] px-5 py-4 divide-y divide-gray-100">
          {rows.map((r) => (
            <div key={r.label} className="py-2.5 flex items-center justify-between gap-3">
              <span className="text-[13px] text-gray-500 shrink-0">{r.label}</span>
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-[13px] font-bold text-gray-900 truncate">{r.value}</span>
                <button onClick={() => copy(r.label, r.value)} className="text-[#2E6FD8] shrink-0">
                  {copiedField === r.label ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[12px] text-gray-500 leading-relaxed">
          请在规定时间内完成付款，超时订单将自动关闭
        </p>
      </div>
    </div>
  );
}
