import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, AlertCircle, Landmark,
  Gift, Activity, Plus, HandCoins, ArrowLeftRight, MapPin,
} from 'lucide-react';
import { useLocation } from 'wouter';
import jsQR from 'jsqr';
import { parseKHQRDetail, parseKHQRLenient, DEMO_KHQR, type KHQRData } from '@/lib/khqr';
import { setPendingTransfer } from '@/lib/transferState';
import BankLogo from '@/components/BankLogo';
import { getBakongStatus, checkBakongAccount, type BakongStatus, type BakongAccountCheck } from '@/lib/bakongClient';
import { getPaywayStatus, type PayWayStatus } from '@/lib/paywayClient';

/* ─── KHQR result type (verified vs unverified readout) ─────────────────────── */
interface ScanResult {
  data: KHQRData;
  /** strict parse passed (payload + CRC-16 + Bakong) */
  verified: boolean;
  /** why strict parse failed, when unverified */
  reason?: 'crc' | 'not-bakong' | 'malformed';
}

/* ─── Payment method logos ─────────────────────────────────────────────────── */
const LOGOS: { label: string; bg: string; text: string }[][] = [
  [
    { label: 'KHQR',      bg: '#005BAA', text: 'white' },
    { label: 'eCASH',     bg: '#00913F', text: 'white' },
    { label: 'CASHin',    bg: '#F05A28', text: 'white' },
    { label: 'AnyPAY',    bg: '#6A1B9A', text: 'white' },
    { label: 'TrueMoney', bg: '#FF6600', text: 'white' },
  ],
  [
    { label: 'DuitNow',   bg: '#E53935', text: 'white' },
    { label: 'VietQR',    bg: '#0D47A1', text: 'white' },
    { label: 'Wing',      bg: '#D97706', text: 'white' },
    { label: 'VISA',      bg: '#1A1F71', text: 'white' },
    { label: 'MC',        bg: 'white',   text: '#1A1A1A' },
  ],
];

const PaymentLogos = () => (
  <div className="flex flex-col gap-2 items-center">
    {LOGOS.map((row, ri) => (
      <div key={ri} className="flex items-center gap-2">
        {row.map(({ label, bg, text }) =>
          label === 'MC' ? (
            <div key={label} className="h-7 px-1.5 rounded-md flex items-center justify-center gap-[-4px]"
              style={{ backgroundColor: bg }}>
              <div className="w-5 h-5 rounded-full bg-[#EB001B] -mr-1.5" />
              <div className="w-5 h-5 rounded-full bg-[#F79E1B] opacity-90" />
            </div>
          ) : (
            <div key={label} className="h-7 px-2 rounded-md flex items-center justify-center"
              style={{ backgroundColor: bg }}>
              <span className="text-[9px] font-extrabold tracking-wide" style={{ color: text }}>{label}</span>
            </div>
          )
        )}
      </div>
    ))}
  </div>
);

/* ─── Scan-page feature strips (smaller than the Home 3×3 grid) ─────────────── */
type StripItem = { label: string; icon: React.ReactNode; bg: string };

const STRIP_GROUPS: { cols: number; items: StripItem[] }[] = [
  {
    cols: 2,
    items: [
      { label: 'សេវាស្ថាប័នរដ្ឋាភិបាល', bg: '#1A88C8', icon: <Landmark className="w-4 h-4" strokeWidth={2.2} /> },
      { label: 'កាដូ', bg: '#F26A21', icon: <Gift className="w-4 h-4" strokeWidth={2.2} /> },
    ],
  },
  {
    cols: 3,
    items: [
      { label: 'មុខងារវិភាគ', bg: '#2E6FD8', icon: <Activity className="w-4 h-4" strokeWidth={2.2} /> },
      { label: 'បន្ថែម', bg: '#9CA3AF', icon: <Plus className="w-4 h-4" strokeWidth={2.5} /> },
      { label: 'កម្ចី', bg: '#E8B53A', icon: <HandCoins className="w-4 h-4" strokeWidth={2.2} /> },
    ],
  },
  {
    cols: 2,
    items: [
      { label: 'អត្រាប្តូរប្រាក់', bg: '#00A67E', icon: <ArrowLeftRight className="w-4 h-4" strokeWidth={2.2} /> },
      { label: 'ទីតាំង ABA', bg: '#E8002D', icon: <MapPin className="w-4 h-4" strokeWidth={2.2} /> },
    ],
  },
];

const ScanFeatureStrips = () => (
  <div className="space-y-3">
    {STRIP_GROUPS.map((group, gi) => (
      <div key={gi} className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${group.cols}, minmax(0,1fr))` }}>
        {group.items.map((item) => (
          <button
            key={item.label + gi}
            className="flex items-center gap-2.5 bg-white rounded-[14px] px-3 py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.07)] border border-gray-100 active:scale-95 transition-transform text-left min-w-0"
          >
            <span
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: item.bg }}
            >
              {item.icon}
            </span>
            <span className="text-[11px] font-bold text-gray-800 leading-tight truncate">{item.label}</span>
          </button>
        ))}
      </div>
    ))}
  </div>
);

/* ─── KHQR result sheet ─────────────────────────────────────────────────────── */
const ResultSheet = ({
  data, verified, reason, onClose, onConfirm,
}: { data: KHQRData; verified: boolean; reason?: 'crc' | 'not-bakong' | 'malformed'; onClose: () => void; onConfirm: () => void }) => {
  const initials = data.merchantName.split(' ').map(n => n[0]).join('').slice(0, 2);
  const warnText =
    reason === 'crc'       ? 'CRC check failed · info below is UNVERIFIED'
    : reason === 'not-bakong' ? 'Not a Bakong / KHQR code · info below is UNVERIFIED'
    : 'Code could not be verified · info below is UNVERIFIED';

  // Bakong gateway status + live account verification (falls back to local on offline).
  const [bakongStatus, setBakongStatus] = useState<BakongStatus | null>(null);
  const [accountCheck, setAccountCheck] = useState<BakongAccountCheck | null>(null);
  const [paywayStatus, setPaywayStatus] = useState<PayWayStatus | null>(null);
  useEffect(() => {
    let on = true;
    getBakongStatus().then(s => { if (on) setBakongStatus(s); });
    getPaywayStatus().then(s => { if (on) setPaywayStatus(s); });
    if (data.bakongId) {
      checkBakongAccount(data.bakongId).then(c => { if (on) setAccountCheck(c); });
    }
    return () => { on = false; };
  }, [data.bakongId]);

  const statusDot =
    bakongStatus === null
      ? { bg: 'bg-gray-300', text: 'Bakong API · …' }
      : !bakongStatus.reachable
        ? { bg: 'bg-gray-300', text: 'Bakong API · Offline (local demo)' }
        : bakongStatus.mode === 'live'
          ? { bg: 'bg-[#00A67E]', text: `Bakong API · Live${bakongStatus.hasToken ? '' : ' (no token)'}` }
          : { bg: 'bg-amber-400', text: 'Bakong API · Mock (configure token for live)' };

  const paywayDot =
    paywayStatus === null
      ? { bg: 'bg-gray-300', text: 'ABA PayWay · …' }
      : !paywayStatus.reachable
        ? { bg: 'bg-gray-300', text: 'ABA PayWay · Offline (local demo)' }
        : paywayStatus.configured
          ? { bg: 'bg-[#E8002D]', text: 'ABA PayWay · Live' }
          : { bg: 'bg-amber-400', text: 'ABA PayWay · Not configured' };

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="absolute inset-x-0 bottom-0 z-50 bg-white rounded-t-[28px] shadow-2xl"
    >
      {/* drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      <div className="px-5 pb-8 pt-2">

        {/* Bakong header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Bakong NBC logo */}
            <div className="w-9 h-9 rounded-full bg-[#00A67E] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <circle cx="12" cy="12" r="9" fill="white" opacity="0.15" />
                <polygon points="12,5 17,12 12,19 7,12" fill="white" opacity="0.7" />
                <circle cx="12" cy="12" r="3" fill="white" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-extrabold text-[#00A67E] leading-tight">bakong</p>
              <p className="text-[8px] text-gray-400 font-bold tracking-widest uppercase leading-none">NBC Cambodia</p>
            </div>
          </div>
          {verified ? (
            <div className="flex items-center gap-1.5 bg-[#00A67E]/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00A67E]" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-[#00A67E]">KHQR Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-amber-700">{warnText}</span>
            </div>
          )}
        </div>

        {/* Account card */}
        <div className="bg-[#F8F9FB] rounded-2xl p-4 mb-4 border border-gray-100">

          {/* Bakong service row */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusDot.bg}`} />
              <span className="text-[11px] font-bold text-gray-700">{statusDot.text}</span>
            </div>
            {bakongStatus?.reachable && bakongStatus.baseUrl && (
              <span className="text-[9px] text-gray-400 truncate max-w-[150px]">{bakongStatus.baseUrl}</span>
            )}
          </div>

          {/* ABA PayWay service row */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${paywayDot.bg}`} />
              <span className="text-[11px] font-bold text-gray-700">{paywayDot.text}</span>
            </div>
            {paywayStatus?.reachable && paywayStatus.baseUrl && (
              <span className="text-[9px] text-gray-400 truncate max-w-[150px]">{paywayStatus.baseUrl}</span>
            )}
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-[15px] shrink-0"
              style={{ backgroundColor: data.bankColor }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-extrabold text-gray-900 truncate">{data.merchantName}</p>
              <span className="inline-flex mt-1">
                <BankLogo bankCode={data.bankCode} bankName={data.bankName} />
              </span>
            </div>
            {data.qrType === 'dynamic' ? (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Dynamic</span>
            ) : (
              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Static</span>
            )}
          </div>

          {/* Live Bakong account verification */}
          {accountCheck && accountCheck.live && (
            <div className={`flex items-center gap-1.5 mb-3 text-[11px] font-bold ${accountCheck.ok ? 'text-[#00A67E]' : 'text-[#E8002D]'}`}>
              {accountCheck.ok
                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                : <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />}
              <span>
                {accountCheck.ok
                  ? `收款账号已通过 Bakong 校验${accountCheck.bankName ? ` · ${accountCheck.bankName}` : ''}`
                  : 'Bakong 校验：该收款账号不存在'}
              </span>
            </div>
          )}

          {/* Detail rows */}
          <div className="space-y-2.5 divide-y divide-gray-100">
            {[
              ['Recipient',  data.merchantName],
              ['Bakong ID',  data.bakongId],
              ['Account',    data.accountNumber],
              ['Bank',       data.bankName],
              ['City',       data.city],
              ['Currency',   data.currency],
              ...(data.merchantId ? [['Merchant ID',  data.merchantId]] : []),
              ...(data.amount      ? [['Amount',     `${data.amount} ${data.currency}`]] : []),
              ...(data.billNumber  ? [['Bill No.',   data.billNumber]]  : []),
              ...(data.reference   ? [['Reference',  data.reference]]   : []),
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center pt-2.5 first:pt-0">
                <span className="text-[12px] text-gray-400 font-medium shrink-0 mr-4">{label}</span>
                <span className={`text-[12px] font-bold text-right truncate ${label === 'Bakong ID' ? 'text-[#00A67E]' : 'text-gray-900'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Amount highlight for dynamic QR */}
        {data.amount && (
          <div className="bg-[#E8002D]/5 border border-[#E8002D]/20 rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
            <span className="text-[13px] text-gray-500 font-medium">Transfer Amount</span>
            <span className="text-[20px] font-extrabold text-[#E8002D]">
              {data.currency === 'KHR'
                ? Number(data.amount).toLocaleString() + ' ៛'
                : '$' + Number(data.amount).toFixed(2)}
            </span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-[14px] active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            className="flex-[2] py-3.5 rounded-xl bg-[#E8002D] text-white font-bold text-[14px] shadow-[0_4px_12px_rgba(232,0,45,0.35)] active:scale-95 transition-transform"
          >
            {data.amount ? `Pay ${data.currency === 'KHR' ? Number(data.amount).toLocaleString() + '៛' : '$' + Number(data.amount).toFixed(2)}` : 'Transfer'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Toast helpers ─────────────────────────────────────────────────────────── */
const Toast = ({ type, msg }: { type: 'success' | 'error'; msg: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
    className={`absolute top-24 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-3 shadow-xl flex items-center gap-2.5
      ${type === 'success' ? 'bg-white' : 'bg-[#1C1C1E]'}`}
  >
    {type === 'success'
      ? <CheckCircle2 className="w-5 h-5 text-[#00A67E] shrink-0" strokeWidth={2.5} />
      : <AlertCircle className="w-5 h-5 text-[#E8002D] shrink-0" strokeWidth={2.5} />}
    <span className={`text-[13px] font-bold whitespace-nowrap ${type === 'success' ? 'text-gray-900' : 'text-white'}`}>
      {msg}
    </span>
  </motion.div>
);

/* ─── Demo cycle index (rotates through DEMO_KHQR) ─────────────────────────── */
let demoIdx = 0;

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function Scanner() {
  const [, setLocation] = useLocation();
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number>(0);
  const scannedRef  = useRef(false);            // prevent double-fire

  const [cameraReady, setCameraReady] = useState(false);
  const [torchOn,     setTorchOn]     = useState(false);
  const [result,      setResult]      = useState<ScanResult | null>(null);
  const [lastRaw,     setLastRaw]     = useState('');          // raw KHQR string for the gateway
  const [toast,       setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [pulse,       setPulse]       = useState(false);

  const showToast = (type: 'success' | 'error', msg: string, ms = 2000) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), ms);
  };

  /* ── Camera ── */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraReady(true);
    } catch { /* denied */ }
  }, []);

  /* ── jsQR decode loop ── */
  // After a successful read we STOP the camera loop and show the recipient
  // confirmation sheet (ResultSheet). The user reviews the payee, then taps
  // "Transfer" → PayFlow. This guarantees the scanned recipient is displayed.
  const handleQRString = useCallback((raw: string) => {
    if (scannedRef.current) return;
    const res = parseKHQRDetail(raw);
    if (res.ok) {
      scannedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
      setLastRaw(raw);
      setResult({ data: res.data, verified: true });
      return;
    }
    // Strict verification failed → still try to read what is in the QR,
    // flagged as unverified so it can never authorise a payment.
    const len = parseKHQRLenient(raw);
    const lenData = len.data;
    if (lenData) {
      scannedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
      setLastRaw(raw);
      setResult({ data: lenData, verified: false, reason: res.reason });
      return;
    }
    if (res.reason === 'crc')        showToast('error', 'QR is corrupted (CRC check failed)');
    else if (res.reason === 'not-bakong') showToast('error', 'Not a Bakong / KHQR code');
    else                              showToast('error', 'Unreadable QR code');
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick); return;
    }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
    if (code) { handleQRString(code.data); return; }
    rafRef.current = requestAnimationFrame(tick);
  }, [handleQRString]);

  /* ── Upload QR from gallery ── */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = canvasRef.current ?? document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
      setPulse(true); setTimeout(() => setPulse(false), 500);
      if (code) {
        const res = parseKHQRDetail(code.data);
        if (res.ok) {
          scannedRef.current = true; cancelAnimationFrame(rafRef.current);
          setLastRaw(code.data); setResult({ data: res.data, verified: true });
        } else {
          // Failed verification → still surface readable info, flagged unverified.
          const len = parseKHQRLenient(code.data);
          const lenData = len.data;
          if (lenData) {
            scannedRef.current = true; cancelAnimationFrame(rafRef.current);
            setLastRaw(code.data); setResult({ data: lenData, verified: false, reason: res.reason });
          }
          else if (res.reason === 'not-bakong') showToast('error', 'QR is not a Bakong / KHQR code');
          else if (res.reason === 'crc')        showToast('error', 'QR is corrupted (CRC check failed)');
          else                                  showToast('error', 'Unreadable QR code');
        }
      } else {
        showToast('error', 'No QR code found in this image');
      }
    };
    img.src = url;
  };

  /* ── Demo scan (cycles through the Bakong demo accounts) ── */
  const handleDemo = () => {
    const entry = DEMO_KHQR[demoIdx % DEMO_KHQR.length];
    demoIdx++;
    setPulse(true); setTimeout(() => setPulse(false), 500);
    const res = parseKHQRDetail(entry.qr);
    if (res.ok) {
      scannedRef.current = true; cancelAnimationFrame(rafRef.current);
      setLastRaw(entry.qr);
      setResult({ data: res.data, verified: true });
      showToast('success', `Demo: ${entry.label.split('–')[0].trim()}`, 1500);
    }
  };

  /* ── Torch ── */
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      try { await (track as any).applyConstraints({ advanced: [{ torch: !torchOn }] }); } catch { /* unsupported */ }
    }
    setTorchOn(t => !t);
  };

  /* ── Confirm → go to Transfer page (amount can be entered/adjusted there) ── */
  const handleConfirm = () => {
    if (!result) return;
    setPendingTransfer(result.data, lastRaw);
    setResult(null);
    setLocation('/pay');
  };

  const handleClose = () => {
    setResult(null);
    scannedRef.current = false;          // allow re-scan
    rafRef.current = requestAnimationFrame(tick);
  };

  /* ── Lifecycle ── */
  useEffect(() => { startCamera(); return () => { cancelAnimationFrame(rafRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }; }, [startCamera]);
  useEffect(() => { if (cameraReady) rafRef.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(rafRef.current); }, [cameraReady, tick]);

  return (
    <div className="min-h-[100dvh] bg-black font-sans select-none flex flex-col relative overflow-hidden">

        {/* Live camera */}
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/65 to-transparent pointer-events-none z-10" />

        {/* ── Header ── */}
        <div className="relative z-20 flex items-center justify-center pt-14 pb-3 px-5 shrink-0">
          <p className="text-white font-extrabold text-[18px] tracking-wide flex items-center gap-1.5">
            ABA<span className="inline-block w-2 h-2 rounded-full bg-[#E8002D]" />ស្កែន
          </p>
          <button onClick={() => setLocation('/')} className="absolute right-5 top-6 text-white hover:text-white/70">
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Viewfinder ── */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />

          {/* Scan frame */}
          <motion.div
            animate={pulse ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative w-[280px] h-[280px]"
            style={{ boxShadow: '0 0 0 2000px rgba(0,0,0,0.42)' }}
          >
            {/* Corner brackets */}
            {[
              'top-0 left-0 border-t-[4px] border-l-[4px] rounded-tl-[14px]',
              'top-0 right-0 border-t-[4px] border-r-[4px] rounded-tr-[14px]',
              'bottom-0 left-0 border-b-[4px] border-l-[4px] rounded-bl-[14px]',
              'bottom-0 right-0 border-b-[4px] border-r-[4px] rounded-br-[14px]',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-10 h-10 border-white ${cls}`} />
            ))}

            {/* Animated scan line */}
            <motion.div
              animate={{ top: ['7%', '87%', '7%'] }}
              transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
              className="absolute left-3 right-3 h-0.5 bg-[#E8002D] rounded-full"
              style={{ boxShadow: '0 0 8px 2px rgba(232,0,45,0.55)' }}
            />
          </motion.div>

          {/* KHQR label below frame */}
          <div className="absolute bottom-[12%] left-0 right-0 flex flex-col items-center gap-1">
            <p className="text-white/75 text-[12px] font-semibold">Point at a KHQR / Bakong QR code</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full bg-[#00A67E]" />
              <p className="text-white/45 text-[10px]">ABA · ACLEDA · Wing · Canadia · Prince Bank</p>
            </div>
          </div>
        </div>

        {/* ── Bottom panel ── */}
        {/* ── Floating controls over camera (official ABA style) ── */}
        <div className="relative z-20 shrink-0 px-5 pb-10 pt-4 space-y-5 bg-gradient-to-t from-black/80 via-black/45 to-transparent">
          <div className="flex justify-center gap-3">
            {/* Flash (ពិល) */}
            <button
              onClick={toggleTorch}
              className={`flex items-center gap-2 px-7 py-3 rounded-full font-bold text-[14px] transition-all backdrop-blur-md
                ${torchOn ? 'bg-yellow-400/90 text-black' : 'bg-white/15 text-white hover:bg-white/25'}`}
            >
              <svg viewBox="0 0 24 24" fill={torchOn ? 'black' : 'white'} className="w-5 h-5">
                <path d="M9 2h6l-1 7h2l-4 13-4-13h2L9 2z" />
              </svg>
              ពិល
            </button>

            {/* Open QR from gallery (បើក QR) */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-7 py-3 rounded-full bg-white/15 backdrop-blur-md text-white font-bold text-[14px] hover:bg-white/25 transition-colors active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3M14 17.5v3M17.5 14v3M20.5 17.5h.5M20.5 20.5h.5" strokeLinecap="round" />
              </svg>
              បើក QR
            </button>
          </div>

          <PaymentLogos />
          {/* Demo / test scan button — cycles through real Bakong demo recipients
              so the scan→recipient→transfer flow can be verified without a camera. */}
          <div className="flex justify-center pt-1">
            <button
              onClick={handleDemo}
              className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/60 text-[11px] font-bold hover:bg-white/20 active:scale-95 transition-all"
            >
              សាកល្បងស្កែន · Demo
            </button>
          </div>
        </div>

        {/* ── Result sheet ── */}
        <AnimatePresence>
          {result && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={handleClose}
                className="absolute inset-0 z-40 bg-black/50"
              />
              <ResultSheet data={result.data} verified={result.verified} reason={result.reason} onClose={handleClose} onConfirm={handleConfirm} />
            </>
          )}
        </AnimatePresence>

        {/* ── Toast ── */}
        <AnimatePresence>
          {toast && <Toast type={toast.type} msg={toast.msg} />}
        </AnimatePresence>
    </div>
  );
}
