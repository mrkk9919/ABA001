import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Smartphone, ChevronRight, AlertTriangle, Volume2, Play } from 'lucide-react';
import { getTtsLang, setTtsLang, speakReceivedSmart, type TtsLang } from '@/lib/tts';

/* ─── Cambodia-style temple silhouette (soft watermark) ────────────────────── */
const AngkorPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.16]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 300">
    <g fill="#6D8BC2">
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

const LS_KEY = 'aba.paysound';
type PaySound = { main: boolean; abaQr: boolean; merchant: boolean };
const load = (): PaySound => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '') as PaySound; } catch { /* ignore */ }
  return { main: true, abaQr: true, merchant: false };
};

const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-[46px] h-[26px] rounded-full p-0.5 transition-colors shrink-0 ${on ? 'bg-[#7B4FE8]' : 'bg-gray-300'}`}
    aria-pressed={on}
  >
    <span className={`block w-[22px] h-[22px] rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : ''}`} />
  </button>
);

export default function SettingsFeatures() {
  const [, setLocation] = useLocation();
  const [ps, setPs] = useState<PaySound>(load);
  const [lang, setLang] = useState<TtsLang>(() => getTtsLang());
  const save = (next: PaySound) => {
    setPs(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const rows: { title: string; desc: string; on: boolean; toggle: () => void }[] = [
    {
      title: 'បើកមុខងារ PaySound',
      desc: 'ឮសំឡេងបញ្ជាក់ពីចំនួនលុយទទួលបានភ្លាមៗ ពេលមានការទូទាត់ចូលគណនី',
      on: ps.main,
      toggle: () => save({ ...ps, main: !ps.main }),
    },
    {
      title: 'PaySound សំរាប់ ABA QR',
      desc: 'ឮសំឡេងពេលមានការទូទាត់ចូលគណនីដែលបានភ្ជាប់ជាមួយ ABA QR',
      on: ps.abaQr,
      toggle: () => save({ ...ps, abaQr: !ps.abaQr }),
    },
    {
      title: 'PaySound សំរាប់ Merchant',
      desc: 'ឮសំឡេងពេលមានការទូទាត់ចូលគណនីដែលបានភ្ជាប់ជាមួយ មុខងារជាអាជីវករ ABA',
      on: ps.merchant,
      toggle: () => save({ ...ps, merchant: !ps.merchant }),
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#16264A] via-[#1C3360] to-[#0F1B33] font-sans flex flex-col overflow-y-auto">
      <AngkorPattern />

      {/* Header */}
      <div className="relative px-4 pt-12 pb-3 flex items-center justify-between">
        <button onClick={() => setLocation('/settings')} className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <p className="text-[16px] font-bold text-white tracking-tight">ABA មុខងារបន្ថែម</p>
        <div className="w-9" />
      </div>
      <p className="relative px-4 text-[12.5px] text-white/70 font-medium leading-snug">
        កំណត់របៀបប្រើប្រាស់ សម្រាប់ មុខងារបន្ថែម
      </p>

      <div className="relative px-4 mt-5 pb-10 flex flex-col gap-4">
        {/* Shake function card */}
        <div className="rounded-3xl bg-white shadow-[0_10px_28px_rgba(0,0,0,0.25)] px-5 py-4 flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-[#F3EDFF] flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6 text-[#7B4FE8]" strokeWidth={2.1} />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-bold text-gray-900">មុខងារក្រឡុក</p>
            <p className="text-[11.5px] text-gray-500 mt-1 leading-snug">
              ជ្រើសមុខងារណាមួយដើម្បីចូល បើបានភ្លាមៗដោយគ្រាន់តែក្រឡុកទូរស័ព្ទ
            </p>
          </div>
          <span className="shrink-0 flex items-center gap-0.5 px-3 py-1.5 rounded-xl bg-[#F3EDFF] text-[11px] font-bold text-[#7B4FE8]">
            អាជីវករ ABA <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
          </span>
        </div>

        {/* PAY-SOUND card */}
        <div className="rounded-3xl bg-white shadow-[0_10px_28px_rgba(0,0,0,0.25)] overflow-hidden">
          <div className="px-5 pt-5 pb-4 flex items-center gap-3 border-b border-gray-100">
            <Volume2 className="w-6 h-6 text-[#7B4FE8]" strokeWidth={2.1} />
            <p className="text-[18px] font-extrabold text-gray-900 tracking-wide">PAY-SOUND</p>
            <span className="px-2 py-0.5 rounded-md bg-[#E8002D]/10 text-[#E8002D] text-[10px] font-extrabold">បេតា</span>
          </div>

          {/* Silent-mode notice */}
          <div className="px-5 pt-4 pb-3">
            <div className="rounded-2xl bg-[#FFF8E6] border border-[#F2DFA0] px-4 py-3 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#C79A1B] shrink-0 mt-0.5" strokeWidth={2.2} />
              <p className="text-[12px] text-[#8A6D1A] leading-relaxed">
                PaySound មិនអាចដំណើរការបានប្រសិនបើទូរស័ព្ទអ្នក កំពុងបើកមុខងារ បិទសំឡេងរោទ៍ ឬ កុំរំខាន
              </p>
            </div>
          </div>

          {/* Toggle rows */}
          <div className="px-5 pb-4 divide-y divide-gray-100">
            {rows.map((r) => (
              <div key={r.title} className="py-3.5 flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-[14.5px] font-bold text-gray-800">{r.title}</p>
                  <p className="text-[11.5px] text-gray-500 mt-1 leading-snug">{r.desc}</p>
                </div>
                <Toggle on={r.on} onClick={r.toggle} />
              </div>
            ))}
          </div>

          {/* Voice language selector — Khmer (ខ្មែរ) in the middle, default */}
          <div className="px-5 pb-4 pt-1">
            <p className="text-[12px] font-bold text-gray-700 mb-2">ភាសាសំឡេង · Voice Language</p>
            <div className="flex rounded-xl bg-gray-100 p-1">
              {([
                { code: 'zh', label: '中文' },
                { code: 'km', label: 'ខ្មែរ' },
                { code: 'en', label: 'English' },
              ] as { code: TtsLang; label: string }[]).map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => { setLang(code); setTtsLang(code); }}
                  className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-all active:scale-95 ${
                    lang === code ? 'bg-[#7B4FE8] text-white shadow' : 'text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-center text-[10.5px] text-gray-400">
              ជ្រើសភាសាសម្រាប់សំឡេង PaySound · ខ្មែរ ប្រើសេវា TTS របស់ម៉ាស៊ីនមេ
            </p>
          </div>
          {/* Test incoming payment voice */}
          <div className="px-5 pb-5 pt-1">
            <button
              onClick={() => {
                if (!ps.main) return;
                speakReceivedSmart(5, 'USD', lang).catch(() => {});
              }}
              className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-[14px] transition-colors ${ps.main ? 'bg-[#7B4FE8] text-white shadow-[0_6px_16px_rgba(123,79,232,0.35)] active:scale-[0.98]' : 'bg-gray-100 text-gray-400'}`}
            >
              <Play className="w-4.5 h-4.5" strokeWidth={2.4} />
              សាកល្បងសំឡេងទទួលប្រាក់ · Test received-payment voice
            </button>
            <p className="mt-2 text-center text-[11px] text-gray-400">
              ឮសំឡេង "ទទួលបាន 5.00 ដុល្លារ" ភ្លាមៗ · Speaks the incoming amount (follows 中文 / English / ខ្មែរ)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
